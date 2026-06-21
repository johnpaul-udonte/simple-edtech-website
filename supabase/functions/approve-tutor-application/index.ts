import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function generatePassword() {
  const randomPart = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `Jlux-${randomPart}-2026!`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          error:
            "Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const authorization = req.headers.get("Authorization") || "";
    const token = authorization.replace("Bearer ", "");

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Missing authorization token.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const {
      data: { user: requestingUser },
      error: userError,
    } = await adminClient.auth.getUser(token);

    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({
          error: "Admin user could not be verified.",
        }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: adminProfile, error: profileError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", requestingUser.id)
      .maybeSingle();

    if (profileError || adminProfile?.role !== "admin") {
      return new Response(
        JSON.stringify({
          error: "Only admins can approve tutor applications.",
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const body = await req.json();
    const applicationId = body?.applicationId;

    if (!applicationId) {
      return new Response(
        JSON.stringify({
          error: "Tutor application ID is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { data: application, error: applicationError } = await adminClient
      .from("tutor_applications")
      .select("*")
      .eq("id", applicationId)
      .maybeSingle();

    if (applicationError || !application) {
      return new Response(
        JSON.stringify({
          error: "Tutor application was not found.",
        }),
        {
          status: 404,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (application.application_status === "approved") {
      return new Response(
        JSON.stringify({
          error: "This tutor application has already been approved.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const temporaryPassword = generatePassword();

    const { data: createdUserData, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: application.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: application.full_name,
          role: "tutor",
        },
      });

    if (createUserError || !createdUserData?.user) {
      return new Response(
        JSON.stringify({
          error:
            createUserError?.message ||
            "Tutor login account could not be created.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const tutorUser = createdUserData.user;

    const { error: profileInsertError } = await adminClient
      .from("profiles")
      .upsert({
        id: tutorUser.id,
        full_name: application.full_name,
        email: application.email,
        role: "tutor",
        portrait_path: application.portrait_path || null,
        updated_at: new Date().toISOString(),
      });

    if (profileInsertError) {
      return new Response(
        JSON.stringify({
          error:
            profileInsertError.message ||
            "Tutor profile could not be created.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { error: tutorInsertError } = await adminClient.from("tutors").insert({
      profile_id: tutorUser.id,
      specialisation: application.area_of_expertise,
      is_active: true,
      tools: application.tools || [],
      teaching_mode: application.teaching_mode,
      available_days: application.available_days || [],
      available_times: application.available_times || [],
      years_of_experience: Number(application.years_of_experience || 0),
      updated_at: new Date().toISOString(),
    });

    if (tutorInsertError) {
      return new Response(
        JSON.stringify({
          error:
            tutorInsertError.message || "Tutor record could not be created.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const { error: updateApplicationError } = await adminClient
      .from("tutor_applications")
      .update({
        application_status: "approved",
        reviewed_by: requestingUser.id,
        reviewed_at: new Date().toISOString(),
        admin_notes: "Tutor login created successfully.",
        updated_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (updateApplicationError) {
      return new Response(
        JSON.stringify({
          error:
            updateApplicationError.message ||
            "Tutor was created, but application status was not updated.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Tutor login created successfully.",
        tutor: {
          email: application.email,
          full_name: application.full_name,
          temporary_password: temporaryPassword,
        },
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error?.message || "Unexpected error approving tutor application.",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});