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

export async function getTutorScheduleForCurrentUser(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: tutorRows, error: tutorError } = await supabase
    .from("tutors")
    .select("id, specialisation, bio, is_active")
    .eq("profile_id", userId)
    .limit(1);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const tutor = Array.isArray(tutorRows) && tutorRows.length > 0 ? tutorRows[0] : null;

  if (!tutor) {
    return {
      data: null,
      error: {
        message: "No tutor record was found for this logged-in user.",
      },
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
      students (
        id,
        student_code,
        enrolled_course,
        profiles (
          full_name,
          email
        )
      ),
      class_slots (
        id,
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
    .eq("tutor_id", tutor.id)
    .order("created_at", { ascending: false });

  if (bookingsError) {
    return {
      data: null,
      error: bookingsError,
    };
  }

  return {
    data: {
      tutor,
      bookings: bookings || [],
    },
    error: null,
  };
}

export async function getTutorStudentsForCurrentUser(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: tutorRows, error: tutorError } = await supabase
    .from("tutors")
    .select("id, specialisation, bio, is_active")
    .eq("profile_id", userId)
    .limit(1);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const tutor = Array.isArray(tutorRows) && tutorRows.length > 0 ? tutorRows[0] : null;

  if (!tutor) {
    return {
      data: null,
      error: {
        message: "No tutor record was found for this logged-in user.",
      },
    };
  }

  const { data: students, error: studentsError } = await supabase
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
      created_at,
      profiles (
        full_name,
        email,
        status
      )
    `
    )
    .eq("assigned_tutor_id", tutor.id)
    .order("created_at", { ascending: false });

  if (studentsError) {
    return {
      data: null,
      error: studentsError,
    };
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("class_bookings")
    .select(
      `
      id,
      student_id,
      status,
      reschedule_count,
      notes,
      created_at,
      class_slots (
        slot_date,
        start_time,
        end_time
      )
    `
    )
    .eq("tutor_id", tutor.id)
    .order("created_at", { ascending: false });

  if (bookingsError) {
    return {
      data: null,
      error: bookingsError,
    };
  }

  return {
    data: {
      tutor,
      students: students || [],
      bookings: bookings || [],
    },
    error: null,
  };
}

export async function getTutorAssignmentsForCurrentUser(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: tutorRows, error: tutorError } = await supabase
    .from("tutors")
    .select("id, specialisation, bio, is_active")
    .eq("profile_id", userId)
    .limit(1);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const tutor =
    Array.isArray(tutorRows) && tutorRows.length > 0 ? tutorRows[0] : null;

  if (!tutor) {
    return {
      data: null,
      error: {
        message: "No tutor record was found for this logged-in user.",
      },
    };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select(
      `
      id,
      title,
      description,
      tool,
      due_date,
      status,
      created_at,
      tutors (
        id,
        profiles (
          full_name,
          email
        )
      ),
      assignment_submissions (
        id,
        status,
        submitted_at,
        score,
        feedback,
        students (
          id,
          student_code,
          profiles (
            full_name,
            email
          )
        )
      )
    `
    )
    .eq("tutor_id", tutor.id)
    .order("created_at", { ascending: false });

  if (assignmentsError) {
    return {
      data: null,
      error: assignmentsError,
    };
  }

  return {
    data: {
      tutor,
      assignments: assignments || [],
    },
    error: null,
  };
}

export async function createAssignmentForTutor(userId, assignmentForm) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: tutorRows, error: tutorError } = await supabase
    .from("tutors")
    .select("id")
    .eq("profile_id", userId)
    .limit(1);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const tutor =
    Array.isArray(tutorRows) && tutorRows.length > 0 ? tutorRows[0] : null;

  if (!tutor) {
    return {
      data: null,
      error: {
        message: "No tutor record was found for this logged-in user.",
      },
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("assignments")
    .insert({
      tutor_id: tutor.id,
      title: assignmentForm.title,
      description: assignmentForm.description,
      tool: assignmentForm.tool,
      due_date: assignmentForm.due_date,
      status: assignmentForm.status,
    })
    .select();

  return {
    data: Array.isArray(insertedRows) ? insertedRows[0] : null,
    error: insertError,
  };
}