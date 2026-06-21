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
      course_fee,
      amount_paid,
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

  if (!userId || userId === "null" || userId === "undefined") {
    return {
      data: null,
      error: {
        message: "Student session was not found. Please log in again.",
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
      profiles:profiles!students_profile_id_fkey (
        full_name,
        email
      ),
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

  const assignedTutorId = student.assigned_tutor_id;

  if (
    !assignedTutorId ||
    assignedTutorId === "null" ||
    assignedTutorId === "undefined"
  ) {
    return {
      data: {
        student,
        assignments: [],
        assignmentMessage:
          "No tutor has been assigned to you yet. Once admin assigns a tutor, your assignments will appear here.",
      },
      error: null,
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
      tutor_id,
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
    .eq("tutor_id", assignedTutorId)
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
      assignmentMessage:
        studentAssignments.length === 0
          ? "No assignment has been published for you yet."
          : "",
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

  const assignment = firstRow(assignmentRows);

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

  const existingSubmission = firstRow(existingRows);

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
      data: firstRow(updatedRows),
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
    data: firstRow(insertedRows),
    error: insertError,
  };
}

export async function getStudentCertificatesForCurrentUser(userId) {
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
      total_paid_classes,
      completed_classes,
      payment_balance,
      profiles:profiles!students_profile_id_fkey (
        full_name,
        email
      ),
      tutors (
        profiles (
          full_name,
          email
        )
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

  const student = firstRow(studentRows);

  if (!student) {
    return {
      data: null,
      error: {
        message: "No student record was found for this logged-in user.",
      },
    };
  }

  const { data: certificates, error: certificatesError } = await supabase
    .from("certificates")
    .select(
      `
      id,
      title,
      certificate_title,
      course,
      status,
      issued_at,
      certificate_url,
      notes,
      created_at,
      updated_at
    `
    )
    .eq("student_id", student.id)
    .order("created_at", { ascending: false });

  if (certificatesError) {
    return {
      data: null,
      error: certificatesError,
    };
  }

  const totalPaidClasses = Number(student.total_paid_classes || 0);
  const completedClasses = Number(student.completed_classes || 0);
  const remainingClasses = Math.max(totalPaidClasses - completedClasses, 0);

  return {
    data: {
      student,
      certificates: certificates || [],
      progress: {
        totalPaidClasses,
        completedClasses,
        remainingClasses,
        completionRate:
          totalPaidClasses > 0
            ? Math.round((completedClasses / totalPaidClasses) * 100)
            : 0,
        isEligible:
          totalPaidClasses > 0 && completedClasses >= totalPaidClasses,
      },
    },
    error: null,
  };
}

export async function getStudentMaterialsForCurrentUser(userId) {
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
      profiles:profiles!students_profile_id_fkey (
        full_name,
        email
      ),
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

  if (!student.assigned_tutor_id) {
    return {
      data: {
        student,
        materials: [],
      },
      error: null,
    };
  }

  const { data: materials, error: materialsError } = await supabase
    .from("materials")
    .select(
      `
      id,
      title,
      description,
      tool,
      material_type,
      material_url,
      visibility,
      status,
      created_at,
      updated_at,
      tutors (
        id,
        profiles (
          full_name,
          email
        )
      )
    `
    )
    .eq("tutor_id", student.assigned_tutor_id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (materialsError) {
    return {
      data: null,
      error: materialsError,
    };
  }

  return {
    data: {
      student,
      materials: materials || [],
    },
    error: null,
  };
}

export async function getStudentAnnouncementsForCurrentUser(userId) {
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
      assigned_tutor_id,
      enrolled_course,
      profiles:profiles!students_profile_id_fkey (
        full_name,
        email
      ),
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

  const today = new Date().toISOString().slice(0, 10);

  const { data: announcements, error: announcementsError } = await supabase
    .from("announcements")
    .select(
      `
      id,
      title,
      body,
      audience,
      priority,
      status,
      tutor_id,
      expires_at,
      created_at,
      profiles:author_profile_id (
        full_name,
        role
      ),
      tutors (
        id,
        profiles (
          full_name,
          email
        )
      )
    `
    )
    .eq("status", "published")
    .or(`expires_at.is.null,expires_at.gte.${today}`)
    .order("created_at", { ascending: false });

  if (announcementsError) {
    return {
      data: null,
      error: announcementsError,
    };
  }

  const visibleAnnouncements = (announcements || []).filter((announcement) => {
    const isForAllStudents = announcement.audience === "all_students";
    const isForEveryone = announcement.audience === "everyone";
    const isFromAssignedTutor =
      announcement.audience === "assigned_students" &&
      announcement.tutor_id === student.assigned_tutor_id;

    return isForAllStudents || isForEveryone || isFromAssignedTutor;
  });

  return {
    data: {
      student,
      announcements: visibleAnnouncements,
      urgentAnnouncements: visibleAnnouncements.filter(
        (announcement) => announcement.priority === "urgent"
      ),
      highPriorityAnnouncements: visibleAnnouncements.filter(
        (announcement) => announcement.priority === "high"
      ),
    },
    error: null,
  };
}

export async function getStudentPracticeForCurrentUser(userId) {
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
      profiles:profiles!students_profile_id_fkey (
        full_name,
        email
      ),
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

  let questionsQuery = supabase
    .from("quiz_questions")
    .select(
      `
      id,
      tutor_id,
      course,
      tool,
      week_number,
      question_text,
      question_type,
      difficulty,
      points,
      status,
      created_at,
      quiz_options (
        id,
        option_text,
        is_correct,
        option_order
      )
    `
    )
    .eq("status", "published")
    .order("week_number", { ascending: true });

  if (student.assigned_tutor_id) {
    questionsQuery = questionsQuery.eq("tutor_id", student.assigned_tutor_id);
  }

  const { data: questions, error: questionsError } = await questionsQuery;

  if (questionsError) {
    return {
      data: null,
      error: questionsError,
    };
  }

  const { data: attempts, error: attemptsError } = await supabase
    .from("quiz_attempts")
    .select(
      `
      id,
      student_id,
      tutor_id,
      course,
      tool,
      week_number,
      total_questions,
      total_points,
      score,
      percentage,
      status,
      submitted_at,
      created_at,
      quiz_answers (
        id,
        question_id,
        selected_option_text,
        correct_option_text,
        is_correct,
        points_awarded,
        quiz_questions (
          question_text,
          tool,
          week_number
        )
      )
    `
    )
    .eq("student_id", student.id)
    .order("submitted_at", { ascending: false });

  if (attemptsError) {
    return {
      data: null,
      error: attemptsError,
    };
  }

  const questionList = questions || [];
  const attemptList = attempts || [];

  return {
    data: {
      student,
      questions: questionList,
      attempts: attemptList,
      summary: {
        totalQuestions: questionList.length,
        totalAttempts: attemptList.length,
        bestScore:
          attemptList.length > 0
            ? Math.max(
                ...attemptList.map((attempt) =>
                  Number(attempt.percentage || 0)
                )
              )
            : 0,
        latestScore:
          attemptList.length > 0 ? Number(attemptList[0].percentage || 0) : 0,
      },
    },
    error: null,
  };
}

export async function submitStudentPracticeAttempt(userId, practiceForm) {
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
    .select("id, enrolled_course, assigned_tutor_id, is_restricted")
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
          "Your access is currently restricted. Please contact admin before submitting weekly practice.",
      },
    };
  }

  const questionIds = practiceForm.question_ids || [];

  if (questionIds.length === 0) {
    return {
      data: null,
      error: {
        message: "No drill questions were selected.",
      },
    };
  }

  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select(
      `
      id,
      tutor_id,
      course,
      tool,
      week_number,
      question_text,
      points,
      quiz_options (
        id,
        option_text,
        is_correct,
        option_order
      )
    `
    )
    .in("id", questionIds);

  if (questionsError) {
    return {
      data: null,
      error: questionsError,
    };
  }

  const questionList = questions || [];

  let score = 0;
  let totalPoints = 0;

  const answerRows = questionList.map((question) => {
    const selectedOptionId = practiceForm.answers[question.id];
    const options = question.quiz_options || [];

    const selectedOption = options.find(
      (option) => option.id === selectedOptionId
    );
    const correctOption = options.find((option) => option.is_correct);

    const questionPoints = Number(question.points || 1);
    const isCorrect = Boolean(selectedOption?.is_correct);
    const pointsAwarded = isCorrect ? questionPoints : 0;

    score += pointsAwarded;
    totalPoints += questionPoints;

    return {
      question_id: question.id,
      selected_option_id: selectedOption?.id || null,
      selected_option_text: selectedOption?.option_text || "",
      correct_option_text: correctOption?.option_text || "",
      is_correct: isCorrect,
      points_awarded: pointsAwarded,
    };
  });

  const percentage =
    totalPoints > 0 ? Math.round((Number(score) / Number(totalPoints)) * 100) : 0;

  const firstQuestion = questionList[0];

  const { data: insertedAttempts, error: attemptError } = await supabase
    .from("quiz_attempts")
    .insert({
      student_id: student.id,
      tutor_id: student.assigned_tutor_id,
      course: firstQuestion?.course || student.enrolled_course || "Data Analysis",
      tool: practiceForm.tool || firstQuestion?.tool || "Excel",
      week_number: Number(
        practiceForm.week_number || firstQuestion?.week_number || 1
      ),
      total_questions: questionList.length,
      total_points: totalPoints,
      score,
      percentage,
      status: "submitted",
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select();

  if (attemptError) {
    return {
      data: null,
      error: attemptError,
    };
  }

  const attempt = firstRow(insertedAttempts);

  if (!attempt) {
    return {
      data: null,
      error: {
        message: "Drill attempt was not saved.",
      },
    };
  }

  const answersToInsert = answerRows.map((answer) => ({
    ...answer,
    attempt_id: attempt.id,
  }));

  const { error: answersError } = await supabase
    .from("quiz_answers")
    .insert(answersToInsert);

  if (answersError) {
    return {
      data: null,
      error: answersError,
    };
  }

  return {
    data: {
      attempt,
      score,
      totalPoints,
      percentage,
      totalQuestions: questionList.length,
    },
    error: null,
  };
}

export async function getStudentAccessStatusForCurrentUser(userId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: studentRows, error } = await supabase
    .from("students")
    .select(
      `
      id,
      student_code,
      payment_balance,
      is_restricted,
      restriction_reason,
      restricted_at,
      enrolled_course,
      profiles:profiles!students_profile_id_fkey (
        full_name,
        email
      )
    `
    )
    .eq("profile_id", userId)
    .limit(1);

  if (error) {
    return {
      data: null,
      error,
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

  return {
    data: student,
    error: null,
  };
}