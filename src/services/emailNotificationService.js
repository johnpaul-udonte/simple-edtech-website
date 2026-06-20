import { supabase } from "../lib/supabaseClient";

export function getPortalUrl(path = "/login") {
  if (typeof window === "undefined") {
    return path;
  }

  return `${window.location.origin}${path}`;
}

export async function sendStudentNotificationEmail({
  to,
  studentName,
  notificationType = "general",
  title,
  message,
  actionLabel = "Open Student Portal",
  actionUrl,
}) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  if (!to) {
    return {
      data: null,
      error: {
        message: "Student email is missing.",
      },
    };
  }

  const { data, error } = await supabase.functions.invoke("send-student-email", {
    body: {
      to,
      studentName,
      notificationType,
      title,
      message,
      actionLabel,
      actionUrl: actionUrl || getPortalUrl("/login"),
    },
  });

  return {
    data,
    error,
  };
}

export async function sendBulkStudentNotificationEmails(students, buildPayload) {
  const safeStudents = Array.isArray(students) ? students : [];

  const results = await Promise.allSettled(
    safeStudents.map((student) => {
      const payload = buildPayload(student);
      return sendStudentNotificationEmail(payload);
    })
  );

  return {
    results,
    successCount: results.filter((result) => result.status === "fulfilled")
      .length,
    failedCount: results.filter((result) => result.status === "rejected")
      .length,
  };
}