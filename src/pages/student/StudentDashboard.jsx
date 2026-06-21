import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getCurrentStudentRecord } from "../../services/studentService";

import StudentAnnouncementPanel from "../../components/StudentAnnouncementPanel";
import StudentRestrictionBanner from "../../components/StudentRestrictionBanner";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function StudentDashboard() {
  const { profile, session } = useAuth();

  const [studentRecord, setStudentRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadStudentRecord() {
    setIsLoading(true);
    setNotice("");

    if (!session?.user?.id) {
      setNotice("No active student session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getCurrentStudentRecord(session.user.id);

    if (error) {
      setNotice(error.message || "Could not load student record.");
      setIsLoading(false);
      return;
    }

    setStudentRecord(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStudentRecord();
  }, [session?.user?.id]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading student dashboard...</h2>
        <p>Please wait while your Jlux Academy records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Student record issue</h2>
        <p>{notice}</p>

        <button type="button" className="tableActionBtn" onClick={loadStudentRecord}>
          Try Again
        </button>
      </section>
    );
  }

  const totalPaidClasses = Number(studentRecord?.total_paid_classes || 0);
  const completedClasses = Number(studentRecord?.completed_classes || 0);
  const remainingClasses = Math.max(totalPaidClasses - completedClasses, 0);

  const courseFee = Number(studentRecord?.course_fee || 0);
  const amountPaid = Number(studentRecord?.amount_paid || 0);
  const paymentBalance = Number(studentRecord?.payment_balance || 0);

  const paymentRate =
    courseFee > 0 ? Math.min(Math.round((amountPaid / courseFee) * 100), 100) : 0;

  const tutorName =
    studentRecord?.tutors?.profiles?.full_name || "Tutor not assigned";

  const accessStatus = studentRecord?.is_restricted ? "Restricted" : "Active";

  const studentCards = [
    {
      label: "Enrolled Course",
      value: studentRecord?.enrolled_course || "Data Analysis",
    },
    {
      label: "Student Code",
      value: studentRecord?.student_code || "N/A",
    },
    {
      label: "Assigned Tutor",
      value: tutorName,
    },
    {
      label: "Access Status",
      value: accessStatus,
    },
    {
      label: "Paid Classes",
      value: totalPaidClasses,
    },
    {
      label: "Completed",
      value: completedClasses,
    },
    {
      label: "Remaining",
      value: remainingClasses,
    },
    {
      label: "Missed",
      value: studentRecord?.missed_classes || 0,
    },
  ];

  return (
    <section className="studentDashboardPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Welcome back, {profile?.full_name || "Student"}</h1>
          <p>
            Track your class balance, payment balance, tutor assignment,
            attendance status, assignments, drills, and certificates.
          </p>
        </div>

        <Link to="/student/schedule" className="headerSecondaryBtn">
          Choose Weekly Schedule
        </Link>
      </header>

      <StudentRestrictionBanner />

      <StudentAnnouncementPanel />

      <section className="studentPaymentOverview">
        <div className="studentPaymentMain">
          <p className="eyebrow">Payment Overview</p>
          <h2>{formatMoney(paymentBalance)}</h2>
          <p>Balance remaining</p>

          <div className="studentPaymentProgress">
            <div
              className="studentPaymentProgressFill"
              style={{ width: `${paymentRate}%` }}
            ></div>
          </div>

          <small>{paymentRate}% of course fee paid</small>
        </div>

        <div className="studentPaymentBreakdown">
          <article>
            <span>Course Fee</span>
            <strong>{formatMoney(courseFee)}</strong>
          </article>

          <article>
            <span>Amount Paid</span>
            <strong>{formatMoney(amountPaid)}</strong>
          </article>

          <article>
            <span>Balance</span>
            <strong>{formatMoney(paymentBalance)}</strong>
          </article>

          <article>
            <span>Status</span>
            <strong>{paymentBalance > 0 ? "Balance Due" : "Cleared"}</strong>
          </article>
        </div>
      </section>

      <section className="studentDashboardGrid">
        {studentCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </section>

      <section className="dashboardPanel studentClassLogicPanel">
        <div>
          <h2>Class Balance</h2>
          <p>
            You paid for <strong>{totalPaidClasses}</strong> classes and have
            completed <strong>{completedClasses}</strong>. Your remaining class
            balance is <strong>{remainingClasses}</strong>. Missed, cancelled,
            and rescheduled classes are tracked separately.
          </p>
        </div>

        <div className="classLogicStats">
          <span>Missed: {studentRecord?.missed_classes || 0}</span>
          <span>Cancelled: {studentRecord?.cancelled_classes || 0}</span>
          <span>Rescheduled: {studentRecord?.rescheduled_classes || 0}</span>
        </div>
      </section>
    </section>
  );
}

export default StudentDashboard;