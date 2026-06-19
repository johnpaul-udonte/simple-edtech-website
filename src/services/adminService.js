import { supabase } from "../lib/supabaseClient";

export async function getAdminDashboardStats() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const [
    studentsResult,
    tutorsResult,
    paymentsResult,
    assignmentsResult,
    certificatesResult,
    classBookingsResult,
  ] = await Promise.all([
    supabase.from("students").select("*", { count: "exact", head: false }),
    supabase.from("tutors").select("*", { count: "exact", head: false }),
    supabase.from("payments").select("*", { count: "exact", head: false }),
    supabase.from("assignments").select("*", { count: "exact", head: false }),
    supabase.from("certificates").select("*", { count: "exact", head: false }),
    supabase.from("class_bookings").select("*", { count: "exact", head: false }),
  ]);

  const firstError =
    studentsResult.error ||
    tutorsResult.error ||
    paymentsResult.error ||
    assignmentsResult.error ||
    certificatesResult.error ||
    classBookingsResult.error;

  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const students = studentsResult.data || [];
  const tutors = tutorsResult.data || [];
  const payments = paymentsResult.data || [];
  const assignments = assignmentsResult.data || [];
  const certificates = certificatesResult.data || [];
  const classBookings = classBookingsResult.data || [];

  const activeStudents = students.filter((student) => !student.is_restricted).length;
  const restrictedStudents = students.filter((student) => student.is_restricted).length;

  const totalPaymentBalance = students.reduce(
    (sum, student) => sum + Number(student.payment_balance || 0),
    0
  );

  const confirmedPayments = payments.filter(
    (payment) => payment.status === "confirmed"
  );

  const totalConfirmedAmount = confirmedPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const pendingCertificates = certificates.filter(
    (certificate) => certificate.status === "pending_approval"
  ).length;

  const completedClasses = classBookings.filter(
    (booking) => booking.status === "completed"
  ).length;

  const missedClasses = classBookings.filter(
    (booking) => booking.status === "missed"
  ).length;

  return {
    data: {
      totalStudents: students.length,
      activeStudents,
      restrictedStudents,
      totalTutors: tutors.length,
      activeTutors: tutors.filter((tutor) => tutor.is_active).length,
      totalPaymentBalance,
      totalConfirmedAmount,
      totalAssignments: assignments.length,
      pendingCertificates,
      completedClasses,
      missedClasses,
    },
    error: null,
  };
}

export async function getRecentStudentsForAdmin() {
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
      payment_balance,
      is_restricted,
      profiles (
        full_name,
        email,
        status
      ),
      tutors (
        profiles (
          full_name
        )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(5);
}

export async function getAllStudentsForAdmin() {
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
      created_at,
      profiles (
        full_name,
        email,
        status
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
    .order("created_at", { ascending: false });
}

export async function getAllTutorsForAdmin() {
  if (!supabase) {
    return {
      data: [],
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  return await supabase
    .from("tutors")
    .select(
      `
      id,
      specialisation,
      bio,
      is_active,
      created_at,
      profiles (
        full_name,
        email,
        status
      ),
      students (
        id,
        student_code,
        completed_classes,
        total_paid_classes,
        payment_balance,
        is_restricted
      )
    `
    )
    .order("created_at", { ascending: false });
}

export async function getPaymentsForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const [studentsResult, paymentsResult] = await Promise.all([
    supabase
      .from("students")
      .select(
        `
        id,
        student_code,
        enrolled_course,
        payment_balance,
        is_restricted,
        profiles (
          full_name,
          email,
          status
        )
      `
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("payments")
      .select(
        `
        id,
        amount,
        status,
        confirmed_at,
        notes,
        created_at,
        students (
          id,
          student_code,
          profiles (
            full_name,
            email
          )
        ),
        profiles:confirmed_by (
          full_name,
          email
        )
      `
      )
      .order("created_at", { ascending: false }),
  ]);

  const firstError = studentsResult.error || paymentsResult.error;

  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const students = studentsResult.data || [];
  const payments = paymentsResult.data || [];

  const totalOutstandingBalance = students.reduce(
    (sum, student) => sum + Number(student.payment_balance || 0),
    0
  );

  const confirmedPayments = payments.filter(
    (payment) => payment.status === "confirmed"
  );

  const pendingPayments = payments.filter(
    (payment) => payment.status === "pending"
  );

  const rejectedPayments = payments.filter(
    (payment) => payment.status === "rejected"
  );

  const totalConfirmedAmount = confirmedPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const restrictedStudents = students.filter(
    (student) => student.is_restricted
  ).length;

  return {
    data: {
      students,
      payments,
      totalOutstandingBalance,
      totalConfirmedAmount,
      confirmedPaymentsCount: confirmedPayments.length,
      pendingPaymentsCount: pendingPayments.length,
      rejectedPaymentsCount: rejectedPayments.length,
      restrictedStudents,
    },
    error: null,
  };
}

export async function getSchedulesForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const [slotsResult, bookingsResult] = await Promise.all([
    supabase
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
      .order("slot_date", { ascending: true }),

    supabase
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
          profiles (
            full_name,
            email
          )
        ),
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
      .order("created_at", { ascending: false }),
  ]);

  const firstError = slotsResult.error || bookingsResult.error;

  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const slots = slotsResult.data || [];
  const bookings = bookingsResult.data || [];

  return {
    data: {
      slots,
      bookings,
      pendingBookings: bookings.filter((booking) => booking.status === "scheduled"),
      approvedBookings: bookings.filter((booking) => booking.status === "approved"),
      completedBookings: bookings.filter((booking) => booking.status === "completed"),
      missedBookings: bookings.filter((booking) => booking.status === "missed"),
      cancelledBookings: bookings.filter((booking) => booking.status === "cancelled"),
      rescheduledBookings: bookings.filter((booking) => booking.status === "rescheduled"),
    },
    error: null,
  };
}

export async function approveClassBooking(bookingId, adminUserId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("class_bookings")
    .select(
      `
      id,
      status,
      class_slot_id,
      class_slots (
        id,
        booked_count,
        capacity
      )
    `
    )
    .eq("id", bookingId)
    .single();

  if (bookingError) {
    return {
      data: null,
      error: bookingError,
    };
  }

  if (booking.status === "approved") {
    return {
      data: booking,
      error: {
        message: "This booking has already been approved.",
      },
    };
  }

  const { data: updatedBooking, error: updateError } = await supabase
    .from("class_bookings")
    .update({
      status: "approved",
      approved_at: new Date().toISOString(),
      admin_approved_by: adminUserId,
    })
    .eq("id", bookingId)
    .select()
    .single();

  if (updateError) {
    return {
      data: null,
      error: updateError,
    };
  }

  const currentBookedCount = Number(booking.class_slots?.booked_count || 0);
  const capacity = Number(booking.class_slots?.capacity || 1);
  const newBookedCount = Math.min(currentBookedCount + 1, capacity);

  const { error: slotUpdateError } = await supabase
    .from("class_slots")
    .update({
      booked_count: newBookedCount,
      is_available: newBookedCount < capacity,
    })
    .eq("id", booking.class_slot_id);

  if (slotUpdateError) {
    return {
      data: updatedBooking,
      error: slotUpdateError,
    };
  }

  return {
    data: updatedBooking,
    error: null,
  };
}