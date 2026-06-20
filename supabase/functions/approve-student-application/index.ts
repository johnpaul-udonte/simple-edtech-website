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

function generateStudentCode() {
  return `JLX-${Date.now().toString().slice(-8)}`;
}

function generateTemporaryPassword() {
  const random = crypto.randomUUID().replaceAll("-", "").slice(0, 10);
  return `Jlux@${random}`;
}

async function findAuthUserByEmail(adminClient: any, email: string) {
  const targetEmail = String(email || "").trim().toLowerCase();

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await adminClient.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      throw new Error(error.message);
    }

    const users = data?.users || [];
    const foundUser = users.find(
      (user: any) =>
        String(user.email || "").trim().toLowerCase() === targetEmail
    );

    if (foundUser) return foundUser;

    if (users.length < 1000) break;
  }

  return null;
}

async function getExistingProfile(
  adminClient: any,
  authUserId: string,
  email: string
) {
  const { data: profileById, error: profileByIdError } = await adminClient
    .from("profiles")
    .select("id, role, email, portrait_path")
    .eq("id", authUserId)
    .maybeSingle();

  if (profileByIdError) {
    throw new Error(profileByIdError.message);
  }

  if (profileById) return profileById;

  const { data: profileByEmail, error: profileByEmailError } =
    await adminClient
      .from("profiles")
      .select("id, role, email, portrait_path")
      .ilike("email", String(email || "").trim())
      .maybeSingle();

  if (profileByEmailError) {
    throw new Error(profileByEmailError.message);
  }

  return profileByEmail;
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
      return jsonResponse({ error: "Invalid admin session." }, 401);
    }

    const { data: adminProfile, error: adminProfileError } = await adminClient
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (adminProfileError || adminProfile?.role !== "admin") {
      return jsonResponse(
        { error: "Only admin can approve applications." },
        403
      );
    }

    const body = await request.json();
    const applicationId = body.applicationId;

    if (!applicationId) {
      return jsonResponse({ error: "Application ID is required." }, 400);
    }

    const { data: application, error: applicationError } = await adminClient
      .from("student_applications")
      .select("*")
      .eq("id", applicationId)
      .single();

    if (applicationError || !application) {
      return jsonResponse({ error: "Application not found." }, 404);
    }

    if (application.application_status === "approved") {
      return jsonResponse(
        { error: "This application has already been approved." },
        400
      );
    }

    const temporaryPassword = generateTemporaryPassword();
    const loginUrl = `${siteUrl}/login`;

    let authUserId = "";
    let userAlreadyExisted = false;

    const { data: createdUserData, error: createUserError } =
      await adminClient.auth.admin.createUser({
        email: application.email,
        password: temporaryPassword,
        email_confirm: true,
        user_metadata: {
          full_name: application.full_name,
          role: "student",
        },
      });

    if (createUserError) {
      const errorMessage = String(createUserError.message || "").toLowerCase();

      const isAlreadyRegistered =
        errorMessage.includes("already") ||
        errorMessage.includes("registered") ||
        errorMessage.includes("exists");

      if (!isAlreadyRegistered) {
        return jsonResponse(
          { error: createUserError.message || "User creation failed." },
          400
        );
      }

      const existingUser = await findAuthUserByEmail(
        adminClient,
        application.email
      );

      if (!existingUser?.id) {
        return jsonResponse(
          {
            error:
              "This email already exists in Supabase Auth, but the existing user could not be found.",
          },
          400
        );
      }

      const existingProfile = await getExistingProfile(
        adminClient,
        existingUser.id,
        application.email
      );

      if (existingProfile?.role && existingProfile.role !== "student") {
        return jsonResponse(
          {
            error:
              "This email already belongs to an Admin or Tutor account. Use another email for the student application.",
          },
          400
        );
      }

      const { error: updateExistingUserError } =
        await adminClient.auth.admin.updateUserById(existingUser.id, {
          password: temporaryPassword,
          email_confirm: true,
          user_metadata: {
            full_name: application.full_name,
            role: "student",
          },
        });

      if (updateExistingUserError) {
        return jsonResponse({ error: updateExistingUserError.message }, 400);
      }

      authUserId = existingUser.id;
      userAlreadyExisted = true;
    } else {
      if (!createdUserData?.user?.id) {
        return jsonResponse({ error: "User creation failed." }, 400);
      }

      authUserId = createdUserData.user.id;
    }

    const existingProfile = await getExistingProfile(
      adminClient,
      authUserId,
      application.email
    );

    if (existingProfile?.role && existingProfile.role !== "student") {
      return jsonResponse(
        {
          error:
            "This email already belongs to an Admin or Tutor account. Use another email for the student application.",
        },
        400
      );
    }

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: authUserId,
      full_name: application.full_name,
      email: application.email,
      role: "student",
      status: "active",
      portrait_path:
        application.portrait_path || existingProfile?.portrait_path || null,
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400);
    }

    const { data: existingStudentRows, error: existingStudentError } =
      await adminClient
        .from("students")
        .select("id")
        .eq("profile_id", authUserId)
        .limit(1);

    if (existingStudentError) {
      return jsonResponse({ error: existingStudentError.message }, 400);
    }

    let student = Array.isArray(existingStudentRows)
      ? existingStudentRows[0]
      : null;

    if (student?.id) {
      const { error: updateStudentError } = await adminClient
        .from("students")
        .update({
          enrolled_course: application.preferred_course || "Data Analysis",
          is_restricted: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", student.id);

      if (updateStudentError) {
        return jsonResponse({ error: updateStudentError.message }, 400);
      }
    } else {
      const { data: insertedStudentRows, error: studentError } =
        await adminClient
          .from("students")
          .insert({
            profile_id: authUserId,
            student_code: generateStudentCode(),
            enrolled_course: application.preferred_course || "Data Analysis",
            total_paid_classes: 0,
            completed_classes: 0,
            missed_classes: 0,
            cancelled_classes: 0,
            rescheduled_classes: 0,
            payment_balance: 0,
            is_restricted: false,
            updated_at: new Date().toISOString(),
          })
          .select();

      if (studentError) {
        return jsonResponse({ error: studentError.message }, 400);
      }

      student = Array.isArray(insertedStudentRows)
        ? insertedStudentRows[0]
        : null;
    }

    const { error: credentialError } = await adminClient
      .from("student_login_credentials")
      .upsert(
        {
          profile_id: authUserId,
          student_id: student?.id || null,
          application_id: application.id,
          student_name: application.full_name,
          email: application.email,
          temporary_password: temporaryPassword,
          login_url: loginUrl,
          password_status: "active",
          password_type: "temporary",
          generated_by: user.id,
          generated_at: new Date().toISOString(),
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
      recipient_profile_id: authUserId,
      student_id: student?.id || null,
      title: "Welcome to Jlux Academy",
      message:
        "Your student portal has been activated. Please check your dashboard, class schedule, materials, assignments, and announcements regularly.",
      category: "account",
      is_read: false,
      created_by: user.id,
    });

    const { error: updateApplicationError } = await adminClient
      .from("student_applications")
      .update({
        application_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: user.id,
        auth_user_id: authUserId,
        student_id: student?.id || null,
        admin_notes: body.adminNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", application.id);

    if (updateApplicationError) {
      return jsonResponse({ error: updateApplicationError.message }, 400);
    }

    return jsonResponse({
      data: {
        message:
          "Student application approved successfully. Login credentials were saved for admin viewing.",
        authUserId,
        studentId: student?.id || null,
        studentName: application.full_name,
        userAlreadyExisted,
        loginEmail: application.email,
        temporaryPassword,
        loginUrl,
        portraitPath:
          application.portrait_path || existingProfile?.portrait_path || null,
        emailSent: false,
        emailError:
          "Email sending disabled. Admin should copy login details manually.",
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        error: error instanceof Error ? error.message : "Approval failed.",
      },
      500
    );
  }
});