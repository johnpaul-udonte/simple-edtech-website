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

export async function getAvailableClassSlotsForStudent() {
  if (!supabase) {
    return {
      data: [],
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  return await supabase
    .from("class_slots")
    .select(
      `
      id,
      slot_date,
      start_time,
      end_time,
      capacity,
      booked_count,
      is_available,
      tutors (
        id,
        profiles (
          full_name,
          email
        )
      )
    `
    )
    .eq("is_available", true)
    .order("slot_date", { ascending: true });
}

export async function requestClassBooking(userId, classSlotId, tutorId) {
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
    .select("id, is_restricted")
    .eq("profile_id", userId)
    .single();

  if (studentError) {
    return {
      data: null,
      error: studentError,
    };
  }

  if (student.is_restricted) {
    return {
      data: null,
      error: {
        message:
          "Your access is currently restricted. Please contact admin before booking a class.",
      },
    };
  }

  const { data: existingBooking, error: existingError } = await supabase
    .from("class_bookings")
    .select("id, status")
    .eq("student_id", student.id)
    .eq("class_slot_id", classSlotId)
    .in("status", ["scheduled", "approved"])
    .maybeSingle();

  if (existingError) {
    return {
      data: null,
      error: existingError,
    };
  }

  if (existingBooking) {
    return {
      data: null,
      error: {
        message:
          "You have already requested or booked this class slot.",
      },
    };
  }

  return await supabase
    .from("class_bookings")
    .insert({
      student_id: student.id,
      tutor_id: tutorId,
      class_slot_id: classSlotId,
      status: "scheduled",
      reschedule_count: 0,
      notes: "Student requested this class slot from the portal.",
    })
    .select()
    .single();
}