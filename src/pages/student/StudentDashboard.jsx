import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getCurrentStudentRecord } from "../../services/studentService";

import StudentAnnouncementPanel from "../../components/StudentAnnouncementPanel";
import StudentRestrictionBanner from "../../components/StudentRestrictionBanner";

function StudentDashboard() {
  const { profile, session } = useAuth();

  const [studentRecord, setStudentRecord] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadStudentRecord() {
      if (!session?.user?.id) {
        setNotice("No active student session found.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getCurrentStudentRecord(session.user.id);

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setStudentRecord(data);
      setIsLoading(false);
    }

    loadStudentRecord();
  }, [session]);

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
      </section>
    );
  }

  const totalPaidClasses = studentRecord?.total_paid_classes || 0;
  const completedClasses = studentRecord?.completed_classes || 0;
  const remainingClasses = Math.max(totalPaidClasses - completedClasses, 0);

  const tutorName =
    studentRecord?.tutors?.profiles?.full_name || "Tutor not assigned";

  const paymentBalance = Number(studentRecord?.payment_balance || 0);

  const studentCards = [
    { label: "Enrolled Course", value: studentRecord?.enrolled_course || "Data Analysis" },
    { label: "Student Code", value: studentRecord?.student_code || "N/A" },
    { label: "Total Paid Classes", value: totalPaidClasses },
    { label: "Classes Completed", value: completedClasses },
    { label: "Classes Remaining", value: remainingClasses },
    { label: "Missed Classes", value: studentRecord?.missed_classes || 0 },
    { label: "Cancelled Classes", value: studentRecord?.cancelled_classes || 0 },
    { label: "Rescheduled Classes", value: studentRecord?.rescheduled_classes || 0 },
    {
      label: "Payment Balance",
      value: `₦${paymentBalance.toLocaleString()}`,
    },
    {
      label: "Access Status",
      value: studentRecord?.is_restricted ? "Restricted" : "Active",
    },
    { label: "Assigned Tutor", value: tutorName },
    { label: "Certificates Earned", value: "Coming Soon" },
  ];

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Welcome back, {profile?.full_name || "Student"}</h1>
          <p>
            Track your real class balance, payment balance, tutor assignment,
            attendance status, assignments, practice tests, and certificates.
          </p>
        </div>

        <button>Choose Weekly Schedule</button>
      </div>
       <StudentAnnouncementPanel />
       <StudentRestrictionBanner />
      <div className="dashboardGrid">
        {studentCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </div>

      <div className="dashboardPanel">
        <h2>Class Balance Logic</h2>
        <p>
          You paid for {totalPaidClasses} classes and have completed{" "}
          {completedClasses}. Your remaining class balance is{" "}
          {remainingClasses}. Missed and cancelled classes are tracked separately.
        </p>
      </div>
    </section>
  );
}

export default StudentDashboard;