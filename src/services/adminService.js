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
      profiles:profiles!students_profile_id_fkey (
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
      profiles:profiles!students_profile_id_fkey (
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
        profiles:profiles!students_profile_id_fkey (
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
          profiles:profiles!students_profile_id_fkey (
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
          profiles:profiles!students_profile_id_fkey (
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

export async function updateClassBookingStatus(bookingId, newStatus, adminUserId) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const allowedStatuses = ["completed", "missed", "cancelled"];

  if (!allowedStatuses.includes(newStatus)) {
    return {
      data: null,
      error: {
        message: "Invalid class status selected.",
      },
    };
  }

  const { data: booking, error: bookingError } = await supabase
    .from("class_bookings")
    .select(
      `
      id,
      status,
      student_id,
      class_slot_id,
      class_slots (
        id,
        booked_count,
        capacity
      ),
      students (
        id,
        completed_classes,
        missed_classes,
        cancelled_classes
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

  if (booking.status === newStatus) {
    return {
      data: booking,
      error: {
        message: `This booking is already marked as ${newStatus}.`,
      },
    };
  }

  const { data: updatedBooking, error: updateError } = await supabase
    .from("class_bookings")
    .update({
      status: newStatus,
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

  const student = booking.students;

  if (student) {
    const studentUpdate = {};

    if (newStatus === "completed") {
      studentUpdate.completed_classes =
        Number(student.completed_classes || 0) + 1;
    }

    if (newStatus === "missed") {
      studentUpdate.missed_classes = Number(student.missed_classes || 0) + 1;
    }

    if (newStatus === "cancelled") {
      studentUpdate.cancelled_classes =
        Number(student.cancelled_classes || 0) + 1;
    }

    if (Object.keys(studentUpdate).length > 0) {
      const { error: studentUpdateError } = await supabase
        .from("students")
        .update(studentUpdate)
        .eq("id", booking.student_id);

      if (studentUpdateError) {
        return {
          data: updatedBooking,
          error: studentUpdateError,
        };
      }
    }
  }

  if (newStatus === "cancelled" && booking.status === "approved") {
    const currentBookedCount = Number(booking.class_slots?.booked_count || 0);
    const capacity = Number(booking.class_slots?.capacity || 1);
    const newBookedCount = Math.max(currentBookedCount - 1, 0);

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
  }

  return {
    data: updatedBooking,
    error: null,
  };
}

export async function getAssignmentsForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: assignments, error } = await supabase
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
        updated_at,
        students (
          id,
          student_code,
          enrolled_course,
          profiles:profiles!students_profile_id_fkey (
            full_name,
            email
          )
        )
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error,
    };
  }

  return {
    data: assignments || [],
    error: null,
  };
}

export async function getReportsForAdmin() {
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
    bookingsResult,
    assignmentsResult,
  ] = await Promise.all([
    supabase
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
      ),

    supabase
      .from("tutors")
      .select(
        `
        id,
        specialisation,
        is_active,
        created_at,
        profiles (
          full_name,
          email,
          status
        ),
        students (
          id,
          completed_classes,
          total_paid_classes,
          payment_balance,
          is_restricted
        )
      `
      ),

    supabase
      .from("payments")
      .select(
        `
        id,
        amount,
        status,
        confirmed_at,
        created_at
      `
      ),

    supabase
      .from("class_bookings")
      .select(
        `
        id,
        status,
        reschedule_count,
        created_at,
        class_slots (
          slot_date,
          start_time,
          end_time
        ),
        students (
          id,
          student_code,
          profiles:profiles!students_profile_id_fkey (
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
        )
      `
      ),

    supabase
      .from("assignments")
      .select(
        `
        id,
        title,
        tool,
        due_date,
        status,
        created_at,
        tutors (
          profiles (
            full_name,
            email
          )
        ),
        assignment_submissions (
          id,
          status,
          score,
          submitted_at,
          students (
            student_code,
            profiles:profiles!students_profile_id_fkey (
              full_name,
              email
            )
          )
        )
      `
      ),
  ]);

  const firstError =
    studentsResult.error ||
    tutorsResult.error ||
    paymentsResult.error ||
    bookingsResult.error ||
    assignmentsResult.error;

  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const students = studentsResult.data || [];
  const tutors = tutorsResult.data || [];
  const payments = paymentsResult.data || [];
  const bookings = bookingsResult.data || [];
  const assignments = assignmentsResult.data || [];

  const totalOutstandingBalance = students.reduce(
    (sum, student) => sum + Number(student.payment_balance || 0),
    0
  );

  const totalCompletedClasses = students.reduce(
    (sum, student) => sum + Number(student.completed_classes || 0),
    0
  );

  const totalPaidClasses = students.reduce(
    (sum, student) => sum + Number(student.total_paid_classes || 0),
    0
  );

  const activeStudents = students.filter((student) => !student.is_restricted);
  const restrictedStudents = students.filter((student) => student.is_restricted);

  const confirmedPayments = payments.filter(
    (payment) => payment.status === "confirmed"
  );

  const pendingPayments = payments.filter(
    (payment) => payment.status === "pending"
  );

  const rejectedPayments = payments.filter(
    (payment) => payment.status === "rejected"
  );

  const totalConfirmedPayment = confirmedPayments.reduce(
    (sum, payment) => sum + Number(payment.amount || 0),
    0
  );

  const courseMap = {};

  students.forEach((student) => {
    const course = student.enrolled_course || "Unassigned Course";

    if (!courseMap[course]) {
      courseMap[course] = {
        course,
        students: 0,
        active: 0,
        restricted: 0,
        completedClasses: 0,
        paidClasses: 0,
        outstandingBalance: 0,
      };
    }

    courseMap[course].students += 1;
    courseMap[course].active += student.is_restricted ? 0 : 1;
    courseMap[course].restricted += student.is_restricted ? 1 : 0;
    courseMap[course].completedClasses += Number(
      student.completed_classes || 0
    );
    courseMap[course].paidClasses += Number(student.total_paid_classes || 0);
    courseMap[course].outstandingBalance += Number(
      student.payment_balance || 0
    );
  });

  const courseReports = Object.values(courseMap);

  const bookingStatusMap = {};

  bookings.forEach((booking) => {
    const status = booking.status || "unknown";
    bookingStatusMap[status] = (bookingStatusMap[status] || 0) + 1;
  });

  const bookingStatusReports = Object.entries(bookingStatusMap).map(
    ([status, count]) => ({
      status,
      count,
    })
  );

  const assignmentReports = assignments.map((assignment) => {
    const submissions = assignment.assignment_submissions || [];
    const graded = submissions.filter(
      (submission) => submission.status === "graded"
    );
    const pending = submissions.filter(
      (submission) => submission.status === "submitted"
    );

    const scores = graded
      .map((submission) => Number(submission.score))
      .filter((score) => !Number.isNaN(score));

    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          )
        : 0;

    return {
      id: assignment.id,
      title: assignment.title,
      tool: assignment.tool,
      dueDate: assignment.due_date,
      status: assignment.status,
      tutorName:
        assignment.tutors?.profiles?.full_name || "Tutor not assigned",
      submissions: submissions.length,
      pending: pending.length,
      graded: graded.length,
      averageScore,
    };
  });

  const tutorReports = tutors.map((tutor) => {
    const assignedStudents = tutor.students || [];

    const completedClasses = assignedStudents.reduce(
      (sum, student) => sum + Number(student.completed_classes || 0),
      0
    );

    const totalStudentBalance = assignedStudents.reduce(
      (sum, student) => sum + Number(student.payment_balance || 0),
      0
    );

    const restrictedAssignedStudents = assignedStudents.filter(
      (student) => student.is_restricted
    ).length;

    return {
      id: tutor.id,
      tutorName: tutor.profiles?.full_name || "Unnamed Tutor",
      email: tutor.profiles?.email || "-",
      specialisation: tutor.specialisation || "Not set",
      isActive: tutor.is_active,
      assignedStudents: assignedStudents.length,
      completedClasses,
      totalStudentBalance,
      restrictedAssignedStudents,
    };
  });

  return {
    data: {
      students,
      tutors,
      payments,
      bookings,
      assignments,
      courseReports,
      bookingStatusReports,
      assignmentReports,
      tutorReports,
      summary: {
        totalStudents: students.length,
        activeStudents: activeStudents.length,
        restrictedStudents: restrictedStudents.length,
        totalTutors: tutors.length,
        activeTutors: tutors.filter((tutor) => tutor.is_active).length,
        totalOutstandingBalance,
        totalCompletedClasses,
        totalPaidClasses,
        totalBookings: bookings.length,
        totalAssignments: assignments.length,
        totalSubmissions: assignments.flatMap(
          (assignment) => assignment.assignment_submissions || []
        ).length,
        totalConfirmedPayment,
        confirmedPayments: confirmedPayments.length,
        pendingPayments: pendingPayments.length,
        rejectedPayments: rejectedPayments.length,
      },
    },
    error: null,
  };
}

export async function getCertificatesForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const [studentsResult, certificatesResult] = await Promise.all([
    supabase
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
        ),
        tutors (
          profiles (
            full_name,
            email
          )
        )
      `
      )
      .order("created_at", { ascending: false }),

    supabase
      .from("certificates")
      .select(
        `
        id,
        student_id,
        title,
        certificate_title,
        course,
        status,
        issued_at,
        issued_by,
        certificate_url,
        notes,
        created_at,
        updated_at
      `
      )
      .order("created_at", { ascending: false }),
  ]);

  const firstError = studentsResult.error || certificatesResult.error;

  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const students = studentsResult.data || [];
  const certificates = certificatesResult.data || [];

  const studentsWithCertificates = students.map((student) => {
    const studentCertificates = certificates.filter(
      (certificate) => certificate.student_id === student.id
    );

    const totalPaidClasses = Number(student.total_paid_classes || 0);
    const completedClasses = Number(student.completed_classes || 0);
    const remainingClasses = Math.max(totalPaidClasses - completedClasses, 0);

    const hasIssuedCertificate = studentCertificates.some(
      (certificate) => certificate.status === "issued"
    );

    const isEligible =
      totalPaidClasses > 0 &&
      completedClasses >= totalPaidClasses &&
      !hasIssuedCertificate;

    return {
      ...student,
      certificates: studentCertificates,
      totalPaidClasses,
      completedClasses,
      remainingClasses,
      hasIssuedCertificate,
      isEligible,
    };
  });

  const eligibleStudents = studentsWithCertificates.filter(
    (student) => student.isEligible
  );

  const issuedCertificates = certificates.filter(
    (certificate) => certificate.status === "issued"
  );

  const pendingCertificates = certificates.filter(
    (certificate) => certificate.status === "pending_approval"
  );

  return {
    data: {
      students: studentsWithCertificates,
      certificates,
      eligibleStudents,
      issuedCertificates,
      pendingCertificates,
      summary: {
        totalStudents: students.length,
        eligibleStudents: eligibleStudents.length,
        totalCertificates: certificates.length,
        issuedCertificates: issuedCertificates.length,
        pendingCertificates: pendingCertificates.length,
      },
    },
    error: null,
  };
}

export async function issueCertificateForStudent(studentId, adminUserId) {
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
      profiles:profiles!students_profile_id_fkey (
        full_name,
        email
      )
    `
    )
    .eq("id", studentId)
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
        message: "Student record could not be found.",
      },
    };
  }

  const totalPaidClasses = Number(student.total_paid_classes || 0);
  const completedClasses = Number(student.completed_classes || 0);

  if (totalPaidClasses <= 0 || completedClasses < totalPaidClasses) {
    return {
      data: null,
      error: {
        message:
          "This student is not yet eligible. Completed classes must be equal to or greater than total paid classes.",
      },
    };
  }

  const { data: existingRows, error: existingError } = await supabase
    .from("certificates")
    .select("id, status")
    .eq("student_id", studentId)
    .eq("course", student.enrolled_course)
    .eq("status", "issued")
    .limit(1);

  if (existingError) {
    return {
      data: null,
      error: existingError,
    };
  }

  const existingCertificate =
    Array.isArray(existingRows) && existingRows.length > 0
      ? existingRows[0]
      : null;

  if (existingCertificate) {
    return {
      data: null,
      error: {
        message: "This student already has an issued certificate for this course.",
      },
    };
  }

  const certificateTitle = `${student.enrolled_course} Certificate of Completion`;

  const { data: insertedRows, error: insertError } = await supabase
    .from("certificates")
    .insert({
      student_id: student.id,
      title: certificateTitle,
      certificate_title: certificateTitle,
      course: student.enrolled_course,
      status: "issued",
      issued_at: new Date().toISOString(),
      issued_by: adminUserId,
      notes: `Certificate issued to ${
        student.profiles?.full_name || "student"
      } after completing ${completedClasses}/${totalPaidClasses} classes.`,
    })
    .select();

  return {
    data: Array.isArray(insertedRows) ? insertedRows[0] : null,
    error: insertError,
  };
}

export async function getMaterialsForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: materials, error } = await supabase
    .from("materials")
    .select(
      `
      id,
      tutor_id,
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
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const allMaterials = materials || [];

  const toolReports = {};

  allMaterials.forEach((material) => {
    const tool = material.tool || "General";

    if (!toolReports[tool]) {
      toolReports[tool] = {
        tool,
        total: 0,
        published: 0,
        draft: 0,
      };
    }

    toolReports[tool].total += 1;

    if (material.status === "published") {
      toolReports[tool].published += 1;
    }

    if (material.status === "draft") {
      toolReports[tool].draft += 1;
    }
  });

  const tutorReports = {};

  allMaterials.forEach((material) => {
    const tutorName =
      material.tutors?.profiles?.full_name || "Tutor not assigned";

    if (!tutorReports[tutorName]) {
      tutorReports[tutorName] = {
        tutorName,
        email: material.tutors?.profiles?.email || "-",
        total: 0,
        published: 0,
        draft: 0,
      };
    }

    tutorReports[tutorName].total += 1;

    if (material.status === "published") {
      tutorReports[tutorName].published += 1;
    }

    if (material.status === "draft") {
      tutorReports[tutorName].draft += 1;
    }
  });

  return {
    data: {
      materials: allMaterials,
      toolReports: Object.values(toolReports),
      tutorReports: Object.values(tutorReports),
      summary: {
        totalMaterials: allMaterials.length,
        publishedMaterials: allMaterials.filter(
          (material) => material.status === "published"
        ).length,
        draftMaterials: allMaterials.filter(
          (material) => material.status === "draft"
        ).length,
        excelMaterials: allMaterials.filter(
          (material) => material.tool === "Excel"
        ).length,
        powerBiMaterials: allMaterials.filter(
          (material) => material.tool === "Power BI"
        ).length,
        sqlMaterials: allMaterials.filter((material) => material.tool === "SQL")
          .length,
        pythonMaterials: allMaterials.filter(
          (material) => material.tool === "Python"
        ).length,
      },
    },
    error: null,
  };
}

export async function getAnnouncementsForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: announcements, error } = await supabase
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

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const allAnnouncements = announcements || [];

  return {
    data: {
      announcements: allAnnouncements,
      summary: {
        totalAnnouncements: allAnnouncements.length,
        publishedAnnouncements: allAnnouncements.filter(
          (item) => item.status === "published"
        ).length,
        draftAnnouncements: allAnnouncements.filter(
          (item) => item.status === "draft"
        ).length,
        highPriorityAnnouncements: allAnnouncements.filter(
          (item) => item.priority === "high"
        ).length,
        urgentAnnouncements: allAnnouncements.filter(
          (item) => item.priority === "urgent"
        ).length,
      },
    },
    error: null,
  };
}

export async function createAnnouncementForAdmin(userId, announcementForm) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data: insertedRows, error: insertError } = await supabase
    .from("announcements")
    .insert({
      title: announcementForm.title,
      body: announcementForm.body,
      audience: announcementForm.audience,
      priority: announcementForm.priority,
      status: announcementForm.status,
      expires_at: announcementForm.expires_at || null,
      author_profile_id: userId,
      tutor_id: null,
      updated_at: new Date().toISOString(),
    })
    .select();

  return {
    data:
      Array.isArray(insertedRows) && insertedRows.length > 0
        ? insertedRows[0]
        : null,
    error: insertError,
  };
}

export async function getQuizzesForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const [questionsResult, attemptsResult] = await Promise.all([
    supabase
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
        difficulty,
        points,
        status,
        created_at,
        tutors (
          profiles (
            full_name,
            email
          )
        )
      `
      )
      .order("created_at", { ascending: false }),

    supabase
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
        tutors (
          profiles (
            full_name,
            email
          )
        )
      `
      )
      .order("submitted_at", { ascending: false }),
  ]);

  const firstError = questionsResult.error || attemptsResult.error;

  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const questions = questionsResult.data || [];
  const attempts = attemptsResult.data || [];

  return {
    data: {
      questions,
      attempts,
      summary: {
        totalQuestions: questions.length,
        publishedQuestions: questions.filter(
          (question) => question.status === "published"
        ).length,
        draftQuestions: questions.filter((question) => question.status === "draft")
          .length,
        totalAttempts: attempts.length,
        averageScore:
          attempts.length > 0
            ? Math.round(
                attempts.reduce(
                  (sum, attempt) => sum + Number(attempt.percentage || 0),
                  0
                ) / attempts.length
              )
            : 0,
        passedAttempts: attempts.filter(
          (attempt) => Number(attempt.percentage || 0) >= 70
        ).length,
      },
    },
    error: null,
  };
}

export async function getStudentControlCenterForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const [studentsResult, attemptsResult, certificatesResult] = await Promise.all([
    supabase
      .from("students")
      .select(
        `
        id,
        profile_id,
        student_code,
        enrolled_course,
        assigned_tutor_id,
        total_paid_classes,
        completed_classes,
        missed_classes,
        cancelled_classes,
        rescheduled_classes,
        payment_balance,
        is_restricted,
        restriction_reason,
        restricted_at,
        unrestricted_at,
        created_at,
        updated_at,
        profiles:profiles!students_profile_id_fkey (
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
      .order("created_at", { ascending: false }),

    supabase
      .from("quiz_attempts")
      .select(
        `
        id,
        student_id,
        percentage,
        score,
        total_points,
        submitted_at
      `
      )
      .order("submitted_at", { ascending: false }),

    supabase
      .from("certificates")
      .select(
        `
        id,
        student_id,
        status,
        issued_at,
        course
      `
      ),
  ]);

  const firstError =
    studentsResult.error || attemptsResult.error || certificatesResult.error;

  if (firstError) {
    return {
      data: null,
      error: firstError,
    };
  }

  const students = studentsResult.data || [];
  const attempts = attemptsResult.data || [];
  const certificates = certificatesResult.data || [];

  const studentsWithControlData = students.map((student) => {
    const studentAttempts = attempts.filter(
      (attempt) => attempt.student_id === student.id
    );

    const studentCertificates = certificates.filter(
      (certificate) => certificate.student_id === student.id
    );

    const totalPaidClasses = Number(student.total_paid_classes || 0);
    const completedClasses = Number(student.completed_classes || 0);
    const remainingClasses = Math.max(totalPaidClasses - completedClasses, 0);
    const paymentBalance = Number(student.payment_balance || 0);

    const averageQuizScore =
      studentAttempts.length > 0
        ? Math.round(
            studentAttempts.reduce(
              (sum, attempt) => sum + Number(attempt.percentage || 0),
              0
            ) / studentAttempts.length
          )
        : 0;

    const latestQuizScore =
      studentAttempts.length > 0
        ? Number(studentAttempts[0].percentage || 0)
        : 0;

    const hasIssuedCertificate = studentCertificates.some(
      (certificate) => certificate.status === "issued"
    );

    return {
      ...student,
      totalPaidClasses,
      completedClasses,
      remainingClasses,
      paymentBalance,
      quizAttempts: studentAttempts,
      certificates: studentCertificates,
      averageQuizScore,
      latestQuizScore,
      hasIssuedCertificate,
      needsPaymentAttention: paymentBalance > 0,
      needsClassAttention: remainingClasses <= 0 && !hasIssuedCertificate,
    };
  });

  return {
    data: {
      students: studentsWithControlData,
      summary: {
        totalStudents: studentsWithControlData.length,
        activeStudents: studentsWithControlData.filter(
          (student) => student.profiles?.status === "active"
        ).length,
        restrictedStudents: studentsWithControlData.filter(
          (student) => student.is_restricted
        ).length,
        studentsWithBalance: studentsWithControlData.filter(
          (student) => student.paymentBalance > 0
        ).length,
        certificateReadyStudents: studentsWithControlData.filter(
          (student) => student.needsClassAttention
        ).length,
        totalOutstandingBalance: studentsWithControlData.reduce(
          (sum, student) => sum + Number(student.paymentBalance || 0),
          0
        ),
      },
    },
    error: null,
  };
}

export async function updateStudentRestrictionForAdmin(
  studentId,
  restrictionData
) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const now = new Date().toISOString();

  const updatePayload = restrictionData.isRestricted
    ? {
        is_restricted: true,
        restriction_reason:
          restrictionData.reason || "Access restricted by admin.",
        restricted_at: now,
        restricted_by: restrictionData.adminUserId,
        unrestricted_at: null,
        unrestricted_by: null,
        updated_at: now,
      }
    : {
        is_restricted: false,
        restriction_reason: null,
        unrestricted_at: now,
        unrestricted_by: restrictionData.adminUserId,
        updated_at: now,
      };

  const { data: updatedRows, error } = await supabase
    .from("students")
    .update(updatePayload)
    .eq("id", studentId)
    .select();

  return {
    data:
      Array.isArray(updatedRows) && updatedRows.length > 0
        ? updatedRows[0]
        : null,
    error,
  };
}

export async function getAdminControlReportsForAdmin() {
  const { data, error } = await getStudentControlCenterForAdmin();

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const students = data?.students || [];

  const courseReports = {};

  students.forEach((student) => {
    const course = student.enrolled_course || "Data Analysis";

    if (!courseReports[course]) {
      courseReports[course] = {
        course,
        totalStudents: 0,
        restrictedStudents: 0,
        studentsWithBalance: 0,
        completedClasses: 0,
        totalPaidClasses: 0,
        outstandingBalance: 0,
        averageQuizScore: 0,
        quizScoreTotal: 0,
        quizScoreCount: 0,
      };
    }

    courseReports[course].totalStudents += 1;
    courseReports[course].completedClasses += Number(
      student.completedClasses || 0
    );
    courseReports[course].totalPaidClasses += Number(
      student.totalPaidClasses || 0
    );
    courseReports[course].outstandingBalance += Number(
      student.paymentBalance || 0
    );

    if (student.is_restricted) {
      courseReports[course].restrictedStudents += 1;
    }

    if (Number(student.paymentBalance || 0) > 0) {
      courseReports[course].studentsWithBalance += 1;
    }

    if (Number(student.averageQuizScore || 0) > 0) {
      courseReports[course].quizScoreTotal += Number(student.averageQuizScore);
      courseReports[course].quizScoreCount += 1;
    }
  });

  const tutorReports = {};

  students.forEach((student) => {
    const tutorName =
      student.tutors?.profiles?.full_name || "Tutor not assigned";

    if (!tutorReports[tutorName]) {
      tutorReports[tutorName] = {
        tutorName,
        email: student.tutors?.profiles?.email || "-",
        totalStudents: 0,
        restrictedStudents: 0,
        studentsWithBalance: 0,
        completedClasses: 0,
        outstandingBalance: 0,
      };
    }

    tutorReports[tutorName].totalStudents += 1;
    tutorReports[tutorName].completedClasses += Number(
      student.completedClasses || 0
    );
    tutorReports[tutorName].outstandingBalance += Number(
      student.paymentBalance || 0
    );

    if (student.is_restricted) {
      tutorReports[tutorName].restrictedStudents += 1;
    }

    if (Number(student.paymentBalance || 0) > 0) {
      tutorReports[tutorName].studentsWithBalance += 1;
    }
  });

  const finalCourseReports = Object.values(courseReports).map((report) => ({
    ...report,
    averageQuizScore:
      report.quizScoreCount > 0
        ? Math.round(report.quizScoreTotal / report.quizScoreCount)
        : 0,
  }));

  return {
    data: {
      summary: data.summary,
      students,
      courseReports: finalCourseReports,
      tutorReports: Object.values(tutorReports),
      attentionStudents: students.filter(
        (student) =>
          student.is_restricted ||
          student.paymentBalance > 0 ||
          student.needsClassAttention
      ),
    },
    error: null,
  };
}

export async function getStudentApplicationsForAdmin() {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data, error } = await supabase
    .from("student_applications")
    .select(
      `
      id,
      full_name,
      email,
      phone,
      date_of_birth,
      gender,
      portrait_path,
      preferred_course,
      learning_mode,
      preferred_class_days,
      preferred_class_time,
      current_skill_level,
      education_level,
      occupation,
      has_laptop,
      learning_goal,
      residential_address,
      emergency_contact_name,
      emergency_contact_phone,
      hear_about_us,
      application_status,
      approved_at,
      approved_by,
      auth_user_id,
      student_id,
      admin_notes,
      created_at,
      updated_at,
      profiles:approved_by (
        full_name,
        email
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error,
    };
  }

  const applications = data || [];

  return {
    data: {
      applications,
      summary: {
        totalApplications: applications.length,
        newApplications: applications.filter(
          (item) => item.application_status === "new"
        ).length,
        approvedApplications: applications.filter(
          (item) => item.application_status === "approved"
        ).length,
        rejectedApplications: applications.filter(
          (item) => item.application_status === "rejected"
        ).length,
      },
    },
    error: null,
  };
}

export async function approveStudentApplicationForAdmin(applicationId, adminNotes) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data, error } = await supabase.functions.invoke(
    "approve-student-application",
    {
      body: {
        applicationId,
        adminNotes: adminNotes || "",
      },
    }
  );

  if (error) {
    let detailedMessage = error.message || "Approval failed.";

    try {
      if (error.context) {
        const errorBody = await error.context.json();

        detailedMessage =
          errorBody?.resendError?.message ||
          errorBody?.resendError?.error ||
          errorBody?.error ||
          JSON.stringify(errorBody);
      }
    } catch {
      detailedMessage = error.message || "Approval failed.";
    }

    return {
      data: null,
      error: {
        message: detailedMessage,
      },
    };
  }

  return {
    data,
    error: null,
  };
}

export async function rejectStudentApplicationForAdmin(applicationId, adminNotes) {
  if (!supabase) {
    return {
      data: null,
      error: {
        message: "Supabase is not configured yet.",
      },
    };
  }

  const { data, error } = await supabase
    .from("student_applications")
    .update({
      application_status: "rejected",
      admin_notes: adminNotes || "Application rejected by admin.",
      updated_at: new Date().toISOString(),
    })
    .eq("id", applicationId)
    .select();

  return {
    data: Array.isArray(data) && data.length > 0 ? data[0] : null,
    error,
  };
}