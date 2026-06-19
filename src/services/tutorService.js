import { supabase } from "../lib/supabaseClient";

export async function getCurrentTutorRecord(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  return await supabase
    .from("tutors")
    .select("id, specialisation, bio, is_active")
    .eq("profile_id", userId)
    .single();
}

export async function getAssignedStudents(tutorId) {
  if (!supabase) {
    return {
      data: [],
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
      profiles (
        full_name,
        email,
        status
      )
    `
    )
    .eq("assigned_tutor_id", tutorId)
    .order("created_at", { ascending: false });
}