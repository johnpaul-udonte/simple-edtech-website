import { supabase } from "../lib/supabaseClient";

function firstRow(rows) {
  return Array.isArray(rows) && rows.length > 0 ? rows[0] : null;
}

function formatScheduleSlots(request) {
  const slots = Array.isArray(request?.requested_slots)
    ? request.requested_slots
    : [];

  if (slots.length > 0) {
    return slots.map((slot) => `${slot.day}: ${slot.time}`).join(" | ");
  }

  if (Array.isArray(request?.requested_days)) {
    return `${request.requested_days.join(", ")} • ${
      request.requested_time || "-"
    }`;
  }

  return request?.requested_time || "-";
}

function validateScheduleSlots(slots) {
  if (!Array.isArray(slots) || slots.length !== 2) {
    return "Please select exactly 2 class days.";
  }

  const cleanSlots = slots.map((slot) => ({
    day: String(slot.day || "").trim(),
    time: String(slot.time || "").trim(),
  }));

  const hasEmptySlot = cleanSlots.some((slot) => !slot.day || !slot.time);

  if (hasEmptySlot) {
    return "Please select both day and time for each class day.";
  }

  const uniqueDays = new Set(cleanSlots.map((slot) => slot.day));

  if (uniqueDays.size !== 2) {
    return "Please select 2 different days.";
  }

  return "";
}

async function createScheduleNotification({
  recipientProfileId,
  studentId,
  title,
  message,
  createdBy,
}) {
  if (!recipientProfileId || !supabase) return;

  await supabase.from("student_notifications").insert({
    recipient_profile_id: recipientProfileId,
    student_id: studentId || null,
    title,
    message,
    category: "schedule",
    is_read: false,
    created_by: createdBy || null,
  });
}

async function notifyAdmins({ title, message, createdBy }) {
  if (!supabase) return;

  const { data: admins, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin")
    .eq("status", "active");

  if (error || !Array.isArray(admins) || admins.length === 0) {
    return;
  }

  const rows = admins.map((admin) => ({
    recipient_profile_id: admin.id,
    student_id: null,
    title,
    message,
    category: "schedule",
    is_read: false,
    created_by: createdBy || null,
  }));

  await supabase.from("student_notifications").insert(rows);
}

export async function getMyScheduleRequests(profileId) {
  if (!supabase) {
    return {
      data: [],
      error: { message: "Supabase is not configured yet." },
    };
  }

  if (!profileId) {
    return {
      data: [],
      error: null,
    };
  }

  const { data, error } = await supabase
    .from("schedule_requests")
    .select("*")
    .eq("student_profile_id", profileId)
    .order("created_at", { ascending: false });

  return {
    data: data || [],
    error,
  };
}

export async function submitStudentScheduleRequest({
  profile,
  requestedSlots,
  learningMode,
  requestNotes,
}) {
  if (!supabase) {
    return {
      data: null,
      error: { message: "Supabase is not configured yet." },
    };
  }

  if (!profile?.id) {
    return {
      data: null,
      error: { message: "Student profile was not found." },
    };
  }

  const slotError = validateScheduleSlots(requestedSlots);

  if (slotError) {
    return {
      data: null,
      error: { message: slotError },
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
      tutors (
        id,
        profile_id,
        profiles (
          full_name,
          email
        )
      )
    `
    )
    .eq("profile_id", profile.id)
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
        message:
          "No student record was found. Please contact admin before requesting a schedule.",
      },
    };
  }

  if (!student.assigned_tutor_id) {
    return {
      data: null,
      error: {
        message:
          "No tutor has been assigned to you yet. Please contact admin before requesting a schedule.",
      },
    };
  }

  const assignedTutorId = student.assigned_tutor_id;
  const tutorProfileId = student.tutors?.profile_id || null;
  const tutorName = student.tutors?.profiles?.full_name || "your tutor";

  if (!tutorProfileId) {
    return {
      data: null,
      error: {
        message:
          "Your assigned tutor profile is not properly linked. Please contact admin.",
      },
    };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("schedule_requests")
    .select("id, status")
    .eq("student_profile_id", profile.id)
    .in("status", ["pending_tutor", "tutor_approved"])
    .limit(1);

  if (existingError) {
    return {
      data: null,
      error: existingError,
    };
  }

  const existingRequest = firstRow(existingRows);

  if (existingRequest) {
    return {
      data: null,
      error: {
        message:
          "You already have an active schedule request waiting for tutor or admin approval.",
      },
    };
  }

  const cleanSlots = requestedSlots.map((slot) => ({
    day: String(slot.day).trim(),
    time: String(slot.time).trim(),
  }));

  const requestedDays = cleanSlots.map((slot) => slot.day);
  const requestedTime = cleanSlots
    .map((slot) => `${slot.day}: ${slot.time}`)
    .join(" | ");

  const { data, error } = await supabase
    .from("schedule_requests")
    .insert({
      student_profile_id: profile.id,
      student_id: student.id,
      student_name: profile.full_name,
      student_email: profile.email,
      assigned_tutor_id: assignedTutorId,
      tutor_profile_id: tutorProfileId,
      requested_days: requestedDays,
      requested_time: requestedTime,
      requested_slots: cleanSlots,
      learning_mode: learningMode || "Online",
      request_notes: requestNotes || null,
      status: "pending_tutor",
      updated_at: new Date().toISOString(),
    })
    .select();

  const insertedRequest = Array.isArray(data) ? data[0] : data;

  if (!error && insertedRequest) {
    const scheduleText = formatScheduleSlots(insertedRequest);

    await createScheduleNotification({
      recipientProfileId: tutorProfileId,
      studentId: student.id,
      title: "Schedule Approval Needed",
      message: `${profile.full_name} submitted a schedule request: ${scheduleText}. Please review and approve or reject it.`,
      createdBy: profile.id,
    });

    await createScheduleNotification({
      recipientProfileId: profile.id,
      studentId: student.id,
      title: "Schedule Request Submitted",
      message: `Your schedule request has been sent to ${tutorName} for tutor approval: ${scheduleText}.`,
      createdBy: profile.id,
    });
  }

  return {
    data: insertedRequest,
    error,
  };
}

export async function getScheduleRequestsForTutor(tutorProfileId) {
  if (!supabase) {
    return {
      data: [],
      error: { message: "Supabase is not configured yet." },
    };
  }

  if (!tutorProfileId) {
    return {
      data: [],
      error: null,
    };
  }

  const { data: tutorRows } = await supabase
    .from("tutors")
    .select("id")
    .eq("profile_id", tutorProfileId)
    .limit(1);

  const tutor = firstRow(tutorRows);

  let query = supabase
    .from("schedule_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (tutor?.id) {
    query = query.or(
      `tutor_profile_id.eq.${tutorProfileId},assigned_tutor_id.eq.${tutor.id}`
    );
  } else {
    query = query.eq("tutor_profile_id", tutorProfileId);
  }

  const { data, error } = await query;

  return {
    data: data || [],
    error,
  };
}

export async function getScheduleRequestsForAdmin() {
  if (!supabase) {
    return {
      data: [],
      error: { message: "Supabase is not configured yet." },
    };
  }

  const { data, error } = await supabase
    .from("schedule_requests")
    .select("*")
    .order("created_at", { ascending: false });

  return {
    data: data || [],
    error,
  };
}

export async function approveScheduleRequestForTutor(
  request,
  tutorProfile,
  tutorNotes
) {
  if (!supabase) {
    return {
      data: null,
      error: { message: "Supabase is not configured yet." },
    };
  }

  if (!request?.id) {
    return {
      data: null,
      error: { message: "Schedule request was not found." },
    };
  }

  if (request.status !== "pending_tutor") {
    return {
      data: null,
      error: {
        message:
          "Only schedule requests waiting for tutor approval can be approved by tutor.",
      },
    };
  }

  const { data, error } = await supabase
    .from("schedule_requests")
    .update({
      status: "tutor_approved",
      tutor_notes: tutorNotes || null,
      tutor_approved_by: tutorProfile?.id || null,
      tutor_decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .select();

  const updatedRequest = Array.isArray(data) ? data[0] : data;

  if (!error && updatedRequest) {
    const scheduleText = formatScheduleSlots(request);

    await createScheduleNotification({
      recipientProfileId: request.student_profile_id,
      studentId: request.student_id || null,
      title: "Tutor Approved Your Schedule",
      message: `Your tutor has approved your schedule request: ${scheduleText}. It is now waiting for final admin approval.`,
      createdBy: tutorProfile?.id || null,
    });

    await notifyAdmins({
      title: "Schedule Waiting for Admin Approval",
      message: `${request.student_name || "A student"} has a tutor-approved schedule waiting for final admin approval: ${scheduleText}.`,
      createdBy: tutorProfile?.id || null,
    });
  }

  return {
    data: updatedRequest,
    error,
  };
}

export async function rejectScheduleRequestForTutor(
  request,
  tutorProfile,
  tutorNotes
) {
  if (!supabase) {
    return {
      data: null,
      error: { message: "Supabase is not configured yet." },
    };
  }

  if (!request?.id) {
    return {
      data: null,
      error: { message: "Schedule request was not found." },
    };
  }

  if (request.status !== "pending_tutor") {
    return {
      data: null,
      error: {
        message:
          "Only schedule requests waiting for tutor approval can be rejected by tutor.",
      },
    };
  }

  const { data, error } = await supabase
    .from("schedule_requests")
    .update({
      status: "tutor_rejected",
      tutor_notes: tutorNotes || "Schedule request rejected by tutor.",
      tutor_approved_by: tutorProfile?.id || null,
      tutor_decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .select();

  const updatedRequest = Array.isArray(data) ? data[0] : data;

  if (!error && updatedRequest) {
    const scheduleText = formatScheduleSlots(request);

    await createScheduleNotification({
      recipientProfileId: request.student_profile_id,
      studentId: request.student_id || null,
      title: "Tutor Rejected Schedule Request",
      message:
        tutorNotes ||
        `Your tutor rejected your schedule request: ${scheduleText}. Please submit another preferred schedule.`,
      createdBy: tutorProfile?.id || null,
    });
  }

  return {
    data: updatedRequest,
    error,
  };
}

export async function approveScheduleRequestForAdmin(
  request,
  adminProfile,
  adminNotes
) {
  if (!supabase) {
    return {
      data: null,
      error: { message: "Supabase is not configured yet." },
    };
  }

  if (!request?.id) {
    return {
      data: null,
      error: { message: "Schedule request was not found." },
    };
  }

  if (request.status !== "tutor_approved") {
    return {
      data: null,
      error: {
        message:
          "Admin can only approve schedules that have already been approved by the tutor.",
      },
    };
  }

  await supabase
    .from("schedule_requests")
    .update({
      status: "superseded",
      updated_at: new Date().toISOString(),
    })
    .eq("student_profile_id", request.student_profile_id)
    .eq("status", "admin_approved")
    .neq("id", request.id);

  const { data, error } = await supabase
    .from("schedule_requests")
    .update({
      status: "admin_approved",
      admin_notes: adminNotes || null,
      approved_by: adminProfile?.id || null,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .select();

  const updatedRequest = Array.isArray(data) ? data[0] : data;

  if (!error && updatedRequest) {
    const scheduleText = formatScheduleSlots(request);

    await createScheduleNotification({
      recipientProfileId: request.student_profile_id,
      studentId: request.student_id || null,
      title: "Schedule Fully Approved",
      message: `Your weekly schedule has been fully approved by admin: ${scheduleText}.`,
      createdBy: adminProfile?.id || null,
    });

    await createScheduleNotification({
      recipientProfileId: request.tutor_profile_id,
      studentId: request.student_id || null,
      title: "Student Schedule Fully Approved",
      message: `${request.student_name || "Student"}'s schedule has been fully approved by admin: ${scheduleText}.`,
      createdBy: adminProfile?.id || null,
    });
  }

  return {
    data: updatedRequest,
    error,
  };
}

export async function rejectScheduleRequestForAdmin(
  request,
  adminProfile,
  adminNotes
) {
  if (!supabase) {
    return {
      data: null,
      error: { message: "Supabase is not configured yet." },
    };
  }

  if (!request?.id) {
    return {
      data: null,
      error: { message: "Schedule request was not found." },
    };
  }

  if (!["pending_tutor", "tutor_approved"].includes(request.status)) {
    return {
      data: null,
      error: {
        message:
          "This schedule request can no longer be rejected by admin at this stage.",
      },
    };
  }

  const { data, error } = await supabase
    .from("schedule_requests")
    .update({
      status: "admin_rejected",
      admin_notes: adminNotes || "Schedule request rejected by admin.",
      approved_by: adminProfile?.id || null,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .select();

  const updatedRequest = Array.isArray(data) ? data[0] : data;

  if (!error && updatedRequest) {
    const scheduleText = formatScheduleSlots(request);

    await createScheduleNotification({
      recipientProfileId: request.student_profile_id,
      studentId: request.student_id || null,
      title: "Schedule Request Rejected by Admin",
      message:
        adminNotes ||
        `Your schedule request was rejected by admin: ${scheduleText}. Please submit another preferred schedule.`,
      createdBy: adminProfile?.id || null,
    });

    await createScheduleNotification({
      recipientProfileId: request.tutor_profile_id,
      studentId: request.student_id || null,
      title: "Student Schedule Rejected by Admin",
      message:
        adminNotes ||
        `${request.student_name || "Student"}'s schedule request was rejected by admin: ${scheduleText}.`,
      createdBy: adminProfile?.id || null,
    });
  }

  return {
    data: updatedRequest,
    error,
  };
}