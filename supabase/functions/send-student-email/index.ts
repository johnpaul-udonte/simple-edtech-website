import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type EmailPayload = {
  to: string;
  studentName?: string;
  notificationType:
    | "assignment"
    | "material"
    | "announcement"
    | "schedule"
    | "certificate"
    | "payment"
    | "restriction"
    | "general";
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
};

function escapeHtml(value: string) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getSubject(type: EmailPayload["notificationType"], title: string) {
  const safeTitle = title || "New update";

  const subjects = {
    assignment: `New Assignment: ${safeTitle}`,
    material: `New Learning Material: ${safeTitle}`,
    announcement: `New Announcement: ${safeTitle}`,
    schedule: `Class Schedule Update: ${safeTitle}`,
    certificate: `Certificate Update: ${safeTitle}`,
    payment: `Payment Update: ${safeTitle}`,
    restriction: `Account Access Update: ${safeTitle}`,
    general: `Jlux Academy Update: ${safeTitle}`,
  };

  return subjects[type] || subjects.general;
}

function getTypeLabel(type: EmailPayload["notificationType"]) {
  const labels = {
    assignment: "Assignment Notification",
    material: "Learning Material Notification",
    announcement: "Announcement",
    schedule: "Schedule Notification",
    certificate: "Certificate Notification",
    payment: "Payment Notification",
    restriction: "Account Access Notification",
    general: "Jlux Academy Notification",
  };

  return labels[type] || labels.general;
}

function buildEmailHtml(payload: EmailPayload) {
  const studentName = escapeHtml(payload.studentName || "Student");
  const typeLabel = escapeHtml(getTypeLabel(payload.notificationType));
  const title = escapeHtml(payload.title);
  const message = escapeHtml(payload.message);
  const actionLabel = escapeHtml(payload.actionLabel || "Open Student Portal");
  const actionUrl = payload.actionUrl || "";

  const buttonHtml = actionUrl
    ? `
      <a href="${escapeHtml(actionUrl)}"
        style="display:inline-block;background:#0b4ea2;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:999px;font-weight:800;margin-top:18px;">
        ${actionLabel}
      </a>
    `
    : "";

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
                    <h1 style="margin:0;font-size:26px;line-height:1.2;">Jlux Academy</h1>
                    <p style="margin:8px 0 0;color:#dbeafe;font-size:15px;">${typeLabel}</p>
                  </td>
                </tr>

                <tr>
                  <td style="padding:34px 30px;">
                    <p style="margin:0 0 16px;color:#60738c;font-size:16px;">Hello ${studentName},</p>

                    <h2 style="margin:0 0 16px;color:#082b61;font-size:28px;line-height:1.25;">
                      ${title}
                    </h2>

                    <p style="margin:0;color:#475467;font-size:17px;line-height:1.75;">
                      ${message}
                    </p>

                    ${buttonHtml}

                    <div style="margin-top:32px;padding:18px;border-radius:18px;background:#f4f8ff;border:1px solid #e5eefb;">
                      <p style="margin:0;color:#60738c;font-size:14px;line-height:1.6;">
                        This message was sent by Jlux Academy LMS. Please log in to your student portal for full details.
                      </p>
                    </div>
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
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (request.method !== "POST") {
    return new Response(
      JSON.stringify({
        error: "Method not allowed.",
      }),
      {
        status: 405,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }

  try {
    const payload = (await request.json()) as EmailPayload;

    if (!payload.to) {
      return new Response(
        JSON.stringify({
          error: "Recipient email is required.",
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

    if (!payload.title || !payload.message) {
      return new Response(
        JSON.stringify({
          error: "Email title and message are required.",
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

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom =
      Deno.env.get("EMAIL_FROM") || "Jlux Academy <onboarding@resend.dev>";

    if (!resendApiKey) {
      return new Response(
        JSON.stringify({
          error: "RESEND_API_KEY is not configured.",
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

    const subject = getSubject(payload.notificationType, payload.title);
    const html = buildEmailHtml(payload);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: emailFrom,
        to: [payload.to],
        subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      return new Response(
        JSON.stringify({
          error: resendData,
        }),
        {
          status: resendResponse.status,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        data: resendData,
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
        error: error.message || "Email function failed.",
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