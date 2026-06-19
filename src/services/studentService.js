import { supabase } from "../lib/supabaseClient";

export async function getCurrentStudentRecord(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  return await supabase
    .from("students")
    .select(
      `
      id,
      student_code,
      enrolled_course,
      total_paid_classes,
      completed_classes,
      missed_classes,
      cancelled_classes,
      rescheduled_classes,
      payment_balance,
      is_restricted,
      tutors (
        id,
        profiles (
          full_name,
          email
        )
      )
    `
    )
    .eq("profile_id", userId)
    .single();
}