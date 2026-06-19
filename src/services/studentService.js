import { supabase } from "../lib/supabaseClient";

function firstRow(rows) {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

export async function getCurrentStudentRecord(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data, error } = await supabase
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
    .limit(1);

  return {
    data: firstRow(data),
    error,
  };
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

  const { data: studentRows, error: studentError } = await supabase
    .from("students")
    .select("id, student_code, enrolled_course")
    .eq("profile_id", userId)
    .limit(1);

  if (studentError) {
    return {
      data: null,
      error: studentError,
    };
  }

  const student = firstRow(studentRows);

  if (!student) {
    return {
      data: null,
      error: {
        message: "No student record was found for this logged-in user.",
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
      tutors (
        id,
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

  const { data: studentRows, error: studentError } = await supabase
    .from("students")
    .select("id, is_restricted")
    .eq("profile_id", userId)
    .limit(1);

  if (studentError) {
    return {
      data: null,
      error: studentError,
    };
  }

  const student = firstRow(studentRows);

  if (!student) {
    return {
      data: null,
      error: {
        message: "No student record was found for this logged-in user.",
      },
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

  const { data: existingBookings, error: existingError } = await supabase
    .from("class_bookings")
    .select("id, status")
    .eq("student_id", student.id)
    .eq("class_slot_id", classSlotId)
    .in("status", ["scheduled", "approved"])
    .limit(1);

  if (existingError) {
    return {
      data: null,
      error: existingError,
    };
  }

  const existingBooking = firstRow(existingBookings);

  if (existingBooking) {
    return {
      data: null,
      error: {
        message: "You have already requested or booked this class slot.",
      },
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("class_bookings")
    .insert({
      student_id: student.id,
      tutor_id: tutorId,
      class_slot_id: classSlotId,
      status: "scheduled",
      reschedule_count: 0,
      notes: "Student requested this class slot from the portal.",
    })
    .select();

  return {
    data: firstRow(insertedRows),
    error: insertError,
  };
}

export async function requestClassReschedule(
  userId,
  bookingId,
  newClassSlotId,
  newTutorId
) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: studentRows, error: studentError } = await supabase
    .from("students")
    .select("id, is_restricted")
    .eq("profile_id", userId)
    .limit(1);

  if (studentError) {
    return {
      data: null,
      error: studentError,
    };
  }

  const student = firstRow(studentRows);

  if (!student) {
    return {
      data: null,
      error: {
        message: "No student record was found for this logged-in user.",
      },
    };
  }

  if (student.is_restricted) {
    return {
      data: null,
      error: {
        message:
          "Your access is currently restricted. Please contact admin before rescheduling a class.",
      },
    };
  }

  const { data: bookingRows, error: bookingError } = await supabase
    .from("class_bookings")
    .select(
      `
      id,
      student_id,
      status,
      class_slot_id,
      reschedule_count,
      class_slots (
        id,
        booked_count,
        capacity
      )
    `
    )
    .eq("id", bookingId)
    .eq("student_id", student.id)
    .limit(1);

  if (bookingError) {
    return {
      data: null,
      error: bookingError,
    };
  }

  const booking = firstRow(bookingRows);

  if (!booking) {
    return {
      data: null,
      error: {
        message: "This booking could not be found.",
      },
    };
  }

  const finalStatuses = ["completed", "missed", "cancelled"];

  if (finalStatuses.includes(booking.status)) {
    return {
      data: null,
      error: {
        message:
          "This class can no longer be rescheduled because it is already final.",
      },
    };
  }

  const currentRescheduleCount = Number(booking.reschedule_count || 0);

  if (currentRescheduleCount >= 3) {
    return {
      data: null,
      error: {
        message: "You have reached the maximum of 3 reschedules for this class.",
      },
    };
  }

  if (booking.class_slot_id === newClassSlotId) {
    return {
      data: null,
      error: {
        message: "Please choose a different class slot.",
      },
    };
  }

  const { data: existingBookings, error: existingError } = await supabase
    .from("class_bookings")
    .select("id, status")
    .eq("student_id", student.id)
    .eq("class_slot_id", newClassSlotId)
    .in("status", ["scheduled", "approved"])
    .limit(1);

  if (existingError) {
    return {
      data: null,
      error: existingError,
    };
  }

  const existingBooking = firstRow(existingBookings);

  if (existingBooking) {
    return {
      data: null,
      error: {
        message:
          "You already have a pending or approved booking for this new slot.",
      },
    };
  }

  if (booking.status === "approved") {
    const currentBookedCount = Number(booking.class_slots?.booked_count || 0);
    const capacity = Number(booking.class_slots?.capacity || 1);
    const newBookedCount = Math.max(currentBookedCount - 1, 0);

    const { error: oldSlotUpdateError } = await supabase
      .from("class_slots")
      .update({
        booked_count: newBookedCount,
        is_available: newBookedCount < capacity,
      })
      .eq("id", booking.class_slot_id);

    if (oldSlotUpdateError) {
      return {
        data: null,
        error: oldSlotUpdateError,
      };
    }
  }

  const { data: updatedRows, error: updateError } = await supabase
    .from("class_bookings")
    .update({
      class_slot_id: newClassSlotId,
      tutor_id: newTutorId,
      status: "scheduled",
      reschedule_count: currentRescheduleCount + 1,
      approved_at: null,
      admin_approved_by: null,
      notes: "Student requested a reschedule. Waiting for admin approval.",
    })
    .eq("id", bookingId)
    .select();

  return {
    data: firstRow(updatedRows),
    error: updateError,
  };
}

export async function getStudentAssignmentsForCurrentUser(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: studentRows, error: studentError } = await supabase
    .from("students")
    .select(
      `
      id,
      student_code,
      enrolled_course,
      assigned_tutor_id,
      profiles (
        full_name,
        email
      )
    `
    )
    .eq("profile_id", userId)
    .limit(1);

  if (studentError) {
    return {
      data: null,
      error: studentError,
    };
  }

  const student =
    Array.isArray(studentRows) && studentRows.length > 0 ? studentRows[0] : null;

  if (!student) {
    return {
      data: null,
      error: {
        message: "No student record was found for this logged-in user.",
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
        student_id,
        status,
        submitted_at,
        score,
        feedback,
        submission_text,
        submission_link,
        updated_at
      )
    `
    )
    .eq("tutor_id", student.assigned_tutor_id)
    .in("status", ["published", "closed"])
    .order("created_at", { ascending: false });

  if (assignmentsError) {
    return {
      data: null,
      error: assignmentsError,
    };
  }

  const studentAssignments = (assignments || []).map((assignment) => {
    const studentSubmission =
      assignment.assignment_submissions?.find(
        (submission) => submission.student_id === student.id
      ) || null;

    return {
      ...assignment,
      student_submission: studentSubmission,
    };
  });

  return {
    data: {
      student,
      assignments: studentAssignments,
    },
    error: null,
  };
}

export async function submitAssignmentForStudent(
  userId,
  assignmentId,
  submissionForm
) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: studentRows, error: studentError } = await supabase
    .from("students")
    .select("id, is_restricted")
    .eq("profile_id", userId)
    .limit(1);

  if (studentError) {
    return {
      data: null,
      error: studentError,
    };
  }

  const student =
    Array.isArray(studentRows) && studentRows.length > 0 ? studentRows[0] : null;

  if (!student) {
    return {
      data: null,
      error: {
        message: "No student record was found for this logged-in user.",
      },
    };
  }

  if (student.is_restricted) {
    return {
      data: null,
      error: {
        message:
          "Your access is currently restricted. Please contact admin before submitting assignments.",
      },
    };
  }

  const { data: assignmentRows, error: assignmentError } = await supabase
    .from("assignments")
    .select("id, status")
    .eq("id", assignmentId)
    .limit(1);

  if (assignmentError) {
    return {
      data: null,
      error: assignmentError,
    };
  }

  const assignment =
    Array.isArray(assignmentRows) && assignmentRows.length > 0
      ? assignmentRows[0]
      : null;

  if (!assignment) {
    return {
      data: null,
      error: {
        message: "Assignment could not be found.",
      },
    };
  }

  if (assignment.status === "closed") {
    return {
      data: null,
      error: {
        message: "This assignment is closed and can no longer be submitted.",
      },
    };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("assignment_submissions")
    .select("id, status")
    .eq("assignment_id", assignmentId)
    .eq("student_id", student.id)
    .limit(1);

  if (existingError) {
    return {
      data: null,
      error: existingError,
    };
  }

  const existingSubmission =
    Array.isArray(existingRows) && existingRows.length > 0 ? existingRows[0] : null;

  if (existingSubmission) {
    const { data: updatedRows, error: updateError } = await supabase
      .from("assignment_submissions")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        submission_text: submissionForm.submission_text,
        submission_link: submissionForm.submission_link,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingSubmission.id)
      .select();

    return {
      data: Array.isArray(updatedRows) ? updatedRows[0] : null,
      error: updateError,
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("assignment_submissions")
    .insert({
      assignment_id: assignmentId,
      student_id: student.id,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      submission_text: submissionForm.submission_text,
      submission_link: submissionForm.submission_link,
    })
    .select();

  return {
    data: Array.isArray(insertedRows) ? insertedRows[0] : null,
    error: insertError,
  };
}