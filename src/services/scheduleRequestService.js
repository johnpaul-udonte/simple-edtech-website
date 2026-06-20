import { supabase } from "../lib/supabaseClient";

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

  const cleanSlots = requestedSlots.map((slot) => ({
    day: String(slot.day).trim(),
    time: String(slot.time).trim(),
  }));

  const requestedDays = cleanSlots.map((slot) => slot.day);
  const requestedTime = cleanSlots
    .map((slot) => `${slot.day}: ${slot.time}`)
    .join(" | ");

  const { data: studentRows } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profile.id)
    .limit(1);

  const student = Array.isArray(studentRows) ? studentRows[0] : null;

  const { data, error } = await supabase
    .from("schedule_requests")
    .insert({
      student_profile_id: profile.id,
      student_id: student?.id || null,
      student_name: profile.full_name,
      student_email: profile.email,
      requested_days: requestedDays,
      requested_time: requestedTime,
      requested_slots: cleanSlots,
      learning_mode: learningMode || "Online",
      request_notes: requestNotes || null,
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .select();

  return {
    data: Array.isArray(data) ? data[0] : data,
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

  await supabase
    .from("schedule_requests")
    .update({
      status: "superseded",
      updated_at: new Date().toISOString(),
    })
    .eq("student_profile_id", request.student_profile_id)
    .eq("status", "approved")
    .neq("id", request.id);

  const { data, error } = await supabase
    .from("schedule_requests")
    .update({
      status: "approved",
      admin_notes: adminNotes || null,
      approved_by: adminProfile?.id || null,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .select();

  if (!error) {
    const scheduleText = formatScheduleSlots(request);

    await supabase.from("student_notifications").insert({
      recipient_profile_id: request.student_profile_id,
      student_id: request.student_id || null,
      title: "Schedule Approved",
      message: `Your weekly schedule has been approved: ${scheduleText}.`,
      category: "schedule",
      is_read: false,
      created_by: adminProfile?.id || null,
    });
  }

  return {
    data: Array.isArray(data) ? data[0] : data,
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

  const { data, error } = await supabase
    .from("schedule_requests")
    .update({
      status: "rejected",
      admin_notes: adminNotes || "Schedule request rejected by admin.",
      approved_by: adminProfile?.id || null,
      decided_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", request.id)
    .select();

  if (!error) {
    const scheduleText = formatScheduleSlots(request);

    await supabase.from("student_notifications").insert({
      recipient_profile_id: request.student_profile_id,
      student_id: request.student_id || null,
      title: "Schedule Request Rejected",
      message:
        adminNotes ||
        `Your schedule request was rejected: ${scheduleText}. Please submit another preferred schedule.`,
      category: "schedule",
      is_read: false,
      created_by: adminProfile?.id || null,
    });
  }

  return {
    data: Array.isArray(data) ? data[0] : data,
    error,
  };
}