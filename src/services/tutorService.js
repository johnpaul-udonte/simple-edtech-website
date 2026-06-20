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
        profiles (
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

  return {
    data: firstRow(insertedRows),
    error: insertError,
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

  return {
    data: firstRow(insertedRows),
    error: insertError,
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

  return {
    data: firstRow(insertedRows),
    error: insertError,
  };
}