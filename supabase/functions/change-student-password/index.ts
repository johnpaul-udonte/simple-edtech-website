import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function validatePassword(password: string) {
  if (!password || password.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter.";
  }

  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter.";
  }

  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number.";
  }

  return "";
}

serve(async (request: Request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const siteUrl =
      Deno.env.get("SITE_URL") || "https://jluxacademy.vercel.app";

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(
        { error: "Supabase service credentials are missing." },
        500
      );
    }

    const authHeader = request.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse({ error: "Authorization header is required." }, 401);
    }

    const body = await request.json().catch(() => ({}));
    const newPassword = String(body.newPassword || "").trim();

    const passwordError = validatePassword(newPassword);

    if (passwordError) {
      return jsonResponse({ error: passwordError }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const jwt = authHeader.replace("Bearer ", "");

    const {
      data: { user },
      error: userError,
    } = await adminClient.auth.getUser(jwt);

    if (userError || !user) {
      return jsonResponse({ error: "Invalid student session." }, 401);
    }

    const { data: profile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, full_name, email, role, status")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return jsonResponse({ error: "Student profile not found." }, 404);
    }

    if (profile.role !== "student") {
      return jsonResponse(
        { error: "Only students can change password here." },
        403
      );
    }

    const { error: updatePasswordError } =
      await adminClient.auth.admin.updateUserById(user.id, {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: profile.full_name,
          role: "student",
        },
      });

    if (updatePasswordError) {
      return jsonResponse({ error: updatePasswordError.message }, 400);
    }

    const { data: studentRows, error: studentError } = await adminClient
      .from("students")
      .select("id")
      .eq("profile_id", user.id)
      .limit(1);

    if (studentError) {
      return jsonResponse({ error: studentError.message }, 400);
    }

    const student = Array.isArray(studentRows) ? studentRows[0] : null;
    const loginUrl = `${siteUrl}/login`;

    const { error: credentialError } = await adminClient
      .from("student_login_credentials")
      .upsert(
        {
          profile_id: user.id,
          student_id: student?.id || null,
          student_name: profile.full_name,
          email: profile.email || user.email,
          temporary_password: newPassword,
          login_url: loginUrl,
          password_status: "student_changed",
          password_type: "student_changed",
          changed_by_student_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "profile_id",
        }
      );

    if (credentialError) {
      return jsonResponse({ error: credentialError.message }, 400);
    }

    await adminClient.from("student_notifications").insert({
      recipient_profile_id: user.id,
      student_id: student?.id || null,
      title: "Password Changed Successfully",
      message:
        "Your student portal password has been changed successfully. Use your new password the next time you log in.",
      category: "account",
      is_read: false,
      created_by: user.id,
    });

    return jsonResponse({
      data: {
        message: "Password changed successfully.",
        loginEmail: profile.email || user.email,
        newPassword,
        loginUrl,
        credentialSavedForAdmin: true,
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Password change failed.",
      },
      500
    );
  }
});