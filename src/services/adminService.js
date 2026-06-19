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