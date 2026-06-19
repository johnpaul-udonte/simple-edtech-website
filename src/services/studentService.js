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

export async function getStudentScheduleForCurrentUser(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: student, error: studentError } = await supabase
    .from("students")
    .select("id, student_code, enrolled_course")
    .eq("profile_id", userId)
    .single();

  if (studentError) {
    return {
      data: null,
      error: studentError,
    };
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("class_bookings")
    .select(
      `
      id,
      status,
      reschedule_count,
      approved_at,
      notes,
      created_at,
      tutors (
        id,
        profiles (
          full_name,
          email
        )
      ),
      class_slots (
        slot_date,
        start_time,
        end_time
      ),
      profiles:admin_approved_by (
        full_name,
        email
      )
    `
    )
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  if (bookingsError) {
    return {
      data: null,
      error: bookingsError,
    };
  }

  return {
    data: {
      student,
      bookings: bookings || [],
    },
    error: null,
  };
}