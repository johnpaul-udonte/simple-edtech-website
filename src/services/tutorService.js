import { supabase } from "../lib/supabaseClient";
import {
  getPortalUrl,
  sendBulkStudentNotificationEmails,
} from "./emailNotificationService";

function firstRow(rows) {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

async function getStudentsForTutorEmail(tutorId) {
  const { data, error } = await supabase
    .from("students")
    .select(
      `
      id,
      student_code,
      enrolled_course,
      is_restricted,
      profiles:profiles!students_profile_id_fkey (
        full_name,
        email,
        status
      )
    `
    )
    .eq("assigned_tutor_id", tutorId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: [],
      error,
    };
  }

  return {
    data: (data || []).filter((student) => student.profiles?.email),
    error: null,
  };
}

async function notifyAssignedStudents(tutorId, payloadBuilder) {
  try {
    const { data: students, error } = await getStudentsForTutorEmail(tutorId);

    if (error) {
      return {
        successCount: 0,
        failedCount: 0,
        error,
      };
    }

    if (!students.length) {
      return {
        successCount: 0,
        failedCount: 0,
        error: null,
      };
    }

    return await sendBulkStudentNotificationEmails(students, payloadBuilder);
  } catch (error) {
    return {
      successCount: 0,
      failedCount: 0,
      error,
    };
  }
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

  const { data: tutorRows, error } = await supabase
    .from("tutors")
    .select(
      `
      id,
      profile_id,
      specialisation,
      bio,
      is_active,
      created_at,
      profiles (
        full_name,
        email,
        role,
        status
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

  const tutor = firstRow(tutorRows);

  if (!tutor) {
    return {
      data: null,
      error: {
        message: "No tutor record was found for this logged-in user.",
      },
    };
  }

  return {
    data: tutor,
    error: null,
  };
}

export async function getTutorStudentsForCurrentUser(userId) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
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
      profiles:profiles!students_profile_id_fkey (
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

  const studentList = students || [];

  return {
    data: {
      tutor,
      students: studentList,
      summary: {
        totalStudents: studentList.length,
        restrictedStudents: studentList.filter((student) => student.is_restricted)
          .length,
        activeStudents: studentList.filter(
          (student) => student.profiles?.status === "active"
        ).length,
        totalCompletedClasses: studentList.reduce(
          (sum, student) => sum + Number(student.completed_classes || 0),
          0
        ),
      },
    },
    error: null,
  };
}

export async function getAssignedStudents(userId) {
  return getTutorStudentsForCurrentUser(userId);
}

export async function getTutorScheduleForCurrentUser(userId) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const { data: bookings, error: bookingsError } = await supabase
    .from("class_bookings")
    .select(
      `
      id,
      status,
      notes,
      created_at,
      students (
        student_code,
        profiles:profiles!students_profile_id_fkey (
          full_name,
          email
        )
      ),
      class_slots (
        id,
        slot_date,
        start_time,
        end_time,
        delivery_mode,
        topic,
        tool,
        status
      )
    `
    )
    .eq("class_slots.tutor_id", tutor.id)
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

export async function getTutorAssignmentsForCurrentUser(userId) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const { data: assignments, error: assignmentsError } = await supabase
    .from("assignments")
    .select(
      `
      id,
      tutor_id,
      title,
      description,
      tool,
      due_date,
      status,
      created_at,
      assignment_submissions (
        id,
        student_id,
        status,
        submitted_at,
        score,
        feedback,
        submission_text,
        submission_link,
        students (
          student_code,
          profiles:profiles!students_profile_id_fkey (
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

  const assignmentList = assignments || [];

  return {
    data: {
      tutor,
      assignments: assignmentList,
      summary: {
        totalAssignments: assignmentList.length,
        publishedAssignments: assignmentList.filter(
          (assignment) => assignment.status === "published"
        ).length,
        draftAssignments: assignmentList.filter(
          (assignment) => assignment.status === "draft"
        ).length,
        totalSubmissions: assignmentList.reduce(
          (sum, assignment) =>
            sum + Number(assignment.assignment_submissions?.length || 0),
          0
        ),
      },
    },
    error: null,
  };
}

export async function createAssignmentForTutor(userId, assignmentForm) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("assignments")
    .insert({
      tutor_id: tutor.id,
      title: assignmentForm.title,
      description: assignmentForm.description,
      tool: assignmentForm.tool,
      due_date: assignmentForm.due_date || null,
      status: assignmentForm.status || "published",
      created_at: new Date().toISOString(),
    })
    .select();

  const assignment = firstRow(insertedRows);

  if (insertError || !assignment) {
    return {
      data: assignment,
      error: insertError,
    };
  }

  let emailResult = null;

  if (assignment.status === "published") {
    emailResult = await notifyAssignedStudents(tutor.id, (student) => ({
      to: student.profiles?.email,
      studentName: student.profiles?.full_name,
      notificationType: "assignment",
      title: assignment.title,
      message: `A new ${assignment.tool || ""} assignment has been posted for you by ${
        tutor.profiles?.full_name || "your tutor"
      }. Please log in to your student portal to review and submit it.${
        assignment.due_date ? ` Due date: ${assignment.due_date}.` : ""
      }`,
      actionLabel: "View Assignment",
      actionUrl: getPortalUrl("/student/assignments"),
    }));
  }

  return {
    data: {
      ...assignment,
      emailResult,
    },
    error: null,
  };
}

export async function gradeAssignmentSubmission(submissionId, gradeForm) {
  const { data: updatedRows, error: updateError } = await supabase
    .from("assignment_submissions")
    .update({
      score: gradeForm.score,
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

export async function getTutorMaterialsForCurrentUser(userId) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
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
      updated_at
    `
    )
    .eq("tutor_id", tutor.id)
    .order("created_at", { ascending: false });

  if (materialsError) {
    return {
      data: null,
      error: materialsError,
    };
  }

  return {
    data: {
      tutor,
      materials: materials || [],
    },
    error: null,
  };
}

export async function createMaterialForTutor(userId, materialForm) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("materials")
    .insert({
      tutor_id: tutor.id,
      title: materialForm.title,
      description: materialForm.description,
      tool: materialForm.tool,
      material_type: materialForm.material_type,
      material_url: materialForm.material_url,
      visibility: materialForm.visibility || "students",
      status: materialForm.status || "published",
      updated_at: new Date().toISOString(),
    })
    .select();

  const material = firstRow(insertedRows);

  if (insertError || !material) {
    return {
      data: material,
      error: insertError,
    };
  }

  let emailResult = null;

  const shouldNotifyStudents =
    material.status === "published" &&
    ["students", "all", "everyone"].includes(material.visibility || "students");

  if (shouldNotifyStudents) {
    emailResult = await notifyAssignedStudents(tutor.id, (student) => ({
      to: student.profiles?.email,
      studentName: student.profiles?.full_name,
      notificationType: "material",
      title: material.title,
      message: `A new ${material.tool || ""} learning material has been uploaded for you by ${
        tutor.profiles?.full_name || "your tutor"
      }. Please log in to your student portal to access it.`,
      actionLabel: "View Material",
      actionUrl: getPortalUrl("/student/materials"),
    }));
  }

  return {
    data: {
      ...material,
      emailResult,
    },
    error: null,
  };
}

export async function getTutorAnnouncementsForCurrentUser(userId) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

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
      expires_at,
      created_at,
      updated_at,
      profiles:author_profile_id (
        full_name,
        email,
        role
      )
    `
    )
    .eq("tutor_id", tutor.id)
    .order("created_at", { ascending: false });

  if (announcementsError) {
    return {
      data: null,
      error: announcementsError,
    };
  }

  return {
    data: {
      tutor,
      announcements: announcements || [],
    },
    error: null,
  };
}

export async function createAnnouncementForTutor(userId, announcementForm) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("announcements")
    .insert({
      title: announcementForm.title,
      body: announcementForm.body,
      audience: "assigned_students",
      priority: announcementForm.priority,
      status: announcementForm.status,
      expires_at: announcementForm.expires_at || null,
      author_profile_id: userId,
      tutor_id: tutor.id,
      updated_at: new Date().toISOString(),
    })
    .select();

  const announcement = firstRow(insertedRows);

  if (insertError || !announcement) {
    return {
      data: announcement,
      error: insertError,
    };
  }

  let emailResult = null;

  if (announcement.status === "published") {
    emailResult = await notifyAssignedStudents(tutor.id, (student) => ({
      to: student.profiles?.email,
      studentName: student.profiles?.full_name,
      notificationType: "announcement",
      title: announcement.title,
      message: announcement.body,
      actionLabel: "Open Student Portal",
      actionUrl: getPortalUrl("/student/dashboard"),
    }));
  }

  return {
    data: {
      ...announcement,
      emailResult,
    },
    error: null,
  };
}

export async function getTutorQuizzesForCurrentUser(userId) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const { data: questions, error: questionsError } = await supabase
    .from("quiz_questions")
    .select(
      `
      id,
      tutor_id,
      created_by,
      course,
      tool,
      week_number,
      question_text,
      question_type,
      difficulty,
      points,
      status,
      created_at,
      updated_at,
      quiz_options (
        id,
        option_text,
        is_correct,
        option_order
      )
    `
    )
    .eq("tutor_id", tutor.id)
    .order("created_at", { ascending: false });

  if (questionsError) {
    return {
      data: null,
      error: questionsError,
    };
  }

  const questionList = questions || [];

  return {
    data: {
      tutor,
      questions: questionList,
      summary: {
        totalQuestions: questionList.length,
        publishedQuestions: questionList.filter(
          (question) => question.status === "published"
        ).length,
        draftQuestions: questionList.filter(
          (question) => question.status === "draft"
        ).length,
        excelQuestions: questionList.filter(
          (question) => question.tool === "Excel"
        ).length,
        powerBiQuestions: questionList.filter(
          (question) => question.tool === "Power BI"
        ).length,
        sqlQuestions: questionList.filter((question) => question.tool === "SQL")
          .length,
        pythonQuestions: questionList.filter(
          (question) => question.tool === "Python"
        ).length,
      },
    },
    error: null,
  };
}

export async function createQuizQuestionForTutor(userId, quizForm) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
    };
  }

  const { data: insertedQuestions, error: questionError } = await supabase
    .from("quiz_questions")
    .insert({
      tutor_id: tutor.id,
      created_by: userId,
      course: quizForm.course,
      tool: quizForm.tool,
      week_number: Number(quizForm.week_number || 1),
      question_text: quizForm.question_text,
      question_type: "multiple_choice",
      difficulty: quizForm.difficulty,
      points: Number(quizForm.points || 1),
      status: quizForm.status,
      updated_at: new Date().toISOString(),
    })
    .select();

  if (questionError) {
    return {
      data: null,
      error: questionError,
    };
  }

  const question = firstRow(insertedQuestions);

  if (!question) {
    return {
      data: null,
      error: {
        message: "Question was not created.",
      },
    };
  }

  const optionsToInsert = [
    {
      question_id: question.id,
      option_text: quizForm.option_a,
      is_correct: quizForm.correct_option === "A",
      option_order: 1,
    },
    {
      question_id: question.id,
      option_text: quizForm.option_b,
      is_correct: quizForm.correct_option === "B",
      option_order: 2,
    },
    {
      question_id: question.id,
      option_text: quizForm.option_c,
      is_correct: quizForm.correct_option === "C",
      option_order: 3,
    },
    {
      question_id: question.id,
      option_text: quizForm.option_d,
      is_correct: quizForm.correct_option === "D",
      option_order: 4,
    },
  ];

  const { error: optionsError } = await supabase
    .from("quiz_options")
    .insert(optionsToInsert);

  if (optionsError) {
    return {
      data: null,
      error: optionsError,
    };
  }

  return {
    data: question,
    error: null,
  };
}

export async function getTutorQuizAttemptsForCurrentUser(userId) {
  const { data: tutor, error: tutorError } = await getCurrentTutorRecord(userId);

  if (tutorError) {
    return {
      data: null,
      error: tutorError,
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
      students (
        student_code,
        profiles:profiles!students_profile_id_fkey (
          full_name,
          email
        )
      ),
      quiz_answers (
        id,
        selected_option_text,
        correct_option_text,
        is_correct,
        points_awarded,
        quiz_questions (
          question_text
        )
      )
    `
    )
    .eq("tutor_id", tutor.id)
    .order("submitted_at", { ascending: false });

  if (attemptsError) {
    return {
      data: null,
      error: attemptsError,
    };
  }

  return {
    data: {
      tutor,
      attempts: attempts || [],
    },
    error: null,
  };
}