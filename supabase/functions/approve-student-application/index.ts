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

    if (foundUser) {
      return foundUser;
    }

    if (users.length < 1000) {
      break;
    }
  }

  return null;
}

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildApprovalEmail({
  fullName,
  email,
  temporaryPassword,
  loginUrl,
}: {
  fullName: string;
  email: string;
  temporaryPassword: string;
  loginUrl: string;
}) {
  return `
    <!doctype html>
    <html>
      <body style="margin:0;padding:0;background:#f4f8ff;font-family:Arial,sans-serif;color:#102033;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f8ff;padding:30px 16px;">
          <tr>
            <td align="center">
              <table width="100%" cellpadding="0" cellspacing="0" style="max-width:680px;background:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5eefb;">
                <tr>
                  <td style="background:#062a63;padding:28px 30px;color:#ffffff;">
                    <h1 style="margin:0;font-size:26px;">Jlux Academy</h1>
                    <p style="margin:8px 0 0;color:#dbeafe;font-size:15px;">Student Application Approved</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:34px 30px;">
                    <p style="margin:0 0 16px;color:#60738c;font-size:16px;">Hello ${escapeHtml(
                      fullName
                    )},</p>

                    <h2 style="margin:0 0 16px;color:#082b61;font-size:28px;line-height:1.25;">
                      Your Jlux Academy student portal access has been approved.
                    </h2>

                    <p style="margin:0 0 20px;color:#475467;font-size:17px;line-height:1.75;">
                      Your application has been reviewed and approved. You can now log in to your student dashboard using the details below.
                    </p>

                    <div style="background:#f4f8ff;border:1px solid #e5eefb;border-radius:18px;padding:20px;margin:24px 0;">
                      <p style="margin:0 0 10px;color:#102033;font-size:16px;"><strong>Email:</strong> ${escapeHtml(
                        email
                      )}</p>
                      <p style="margin:0;color:#102033;font-size:16px;"><strong>Temporary Password:</strong> ${escapeHtml(
                        temporaryPassword
                      )}</p>
                    </div>

                    <p style="margin:0;color:#b42318;font-size:15px;line-height:1.6;">
                      Please change your password after logging in.
                    </p>

                    <a href="${escapeHtml(
                      loginUrl
                    )}" style="display:inline-block;background:#0b4ea2;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:800;margin-top:22px;">
                      Login to Student Portal
                    </a>
                  </td>
                </tr>

                <tr>
                  <td style="background:#f8fbff;padding:20px 30px;color:#75859a;font-size:13px;text-align:center;">
                    © Jlux Academy. Learn Excel, Power BI, SQL, and Python with structure.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom =
      Deno.env.get("EMAIL_FROM") || "Jlux Academy <onboarding@resend.dev>";
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

    const { error: profileError } = await adminClient.from("profiles").upsert({
      id: authUserId,
      full_name: application.full_name,
      email: application.email,
      role: "student",
      status: "active",
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      return jsonResponse({ error: profileError.message }, 400);
    }

    const { data: existingStudent, error: existingStudentError } =
      await adminClient
        .from("students")
        .select("id")
        .eq("profile_id", authUserId)
        .maybeSingle();

    if (existingStudentError) {
      return jsonResponse({ error: existingStudentError.message }, 400);
    }

    let student = existingStudent || null;

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

    let emailSent = false;
    let emailResult: any = null;
    let emailError: any = null;
    const loginUrl = `${siteUrl}/login`;

    if (!resendApiKey) {
      emailError =
        "RESEND_API_KEY is missing. Student account was created, but email was not sent.";
    } else {
      const emailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: emailFrom,
          to: [application.email],
          subject: "Your Jlux Academy Student Portal Access Has Been Approved",
          html: buildApprovalEmail({
            fullName: application.full_name,
            email: application.email,
            temporaryPassword,
            loginUrl,
          }),
        }),
      });

      emailResult = await emailResponse.json().catch(() => null);
      emailSent = emailResponse.ok;

      if (!emailResponse.ok) {
        emailError = emailResult;
      }

      console.log("APPROVAL_EMAIL_RESULT", {
        status: emailResponse.status,
        ok: emailResponse.ok,
        result: emailResult,
      });
    }

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
        message: emailSent
          ? "Student application approved successfully and email was sent."
          : "Student application approved successfully, but email was not sent.",
        authUserId,
        studentId: student?.id || null,
        userAlreadyExisted,
        loginEmail: application.email,
        temporaryPassword,
        loginUrl,
        emailSent,
        emailResult,
        emailError,
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