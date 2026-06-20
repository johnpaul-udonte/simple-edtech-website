import { supabase } from "../lib/supabaseClient";

export async function getMyStudentNotifications(profileId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  if (!profileId) {
    return {
      data: [],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("student_notifications")
    .select(
      `
      id,
      title,
      message,
      category,
      is_read,
      created_at,
      read_at
    `
    )
    .eq("recipient_profile_id", profileId)
    .order("created_at", { ascending: false });

  return {
    data: data || [],
    error,
  };
}

export async function markStudentNotificationAsRead(notificationId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data, error } = await supabase
    .from("student_notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .select();

  return {
    data,
    error,
  };
}