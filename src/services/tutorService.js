import { supabase } from "../lib/supabaseClient";

function firstRow(rows) {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function getCurrentTutorRecord(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data, error } = await supabase
    .from("tutors")
    .select("id, specialisation, bio, is_active")
    .eq("profile_id", userId)
    .limit(1);

  return {
    data: firstRow(data),
    error,
  };
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

  const tutor = firstRow(tutorRows);

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

  const tutor = firstRow(tutorRows);

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

  const tutor = firstRow(tutorRows);

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
        assignment_id,
        student_id,
        status,
        submitted_at,
        score,
        feedback,
        submission_text,
        submission_link,
        updated_at,
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

  const tutor = firstRow(tutorRows);

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
    data: firstRow(insertedRows),
    error: insertError,
  };
}

export async function gradeAssignmentSubmission(userId, submissionId, gradeForm) {
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

  const tutor = firstRow(tutorRows);

  if (!tutor) {
    return {
      data: null,
      error: {
        message: "No tutor record was found for this logged-in user.",
      },
    };
  }

  const { data: submissionRows, error: submissionError } = await supabase
    .from("assignment_submissions")
    .select(
      `
      id,
      assignment_id,
      assignments (
        id,
        tutor_id
      )
    `
    )
    .eq("id", submissionId)
    .limit(1);

  if (submissionError) {
    return {
      data: null,
      error: submissionError,
    };
  }

  const submission = firstRow(submissionRows);

  if (!submission) {
    return {
      data: null,
      error: {
        message: "Submission could not be found.",
      },
    };
  }

  if (submission.assignments?.tutor_id !== tutor.id) {
    return {
      data: null,
      error: {
        message: "You cannot grade a submission for another tutor's assignment.",
      },
    };
  }

  const score = Number(gradeForm.score);

  if (Number.isNaN(score) || score < 0 || score > 100) {
    return {
      data: null,
      error: {
        message: "Score must be a number between 0 and 100.",
      },
    };
  }

  if (!gradeForm.feedback.trim()) {
    return {
      data: null,
      error: {
        message: "Feedback is required before grading.",
      },
    };
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("assignment_submissions")
    .update({
      score,
      feedback: gradeForm.feedback,
      status: "graded",
      updated_at: new Date().toISOString(),
    })
    .eq("id", submissionId)
    .select();

  return {
    data: firstRow(updatedRows),
    error: updateError,
  };
}