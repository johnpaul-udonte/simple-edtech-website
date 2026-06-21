import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTutorStudentsForCurrentUser } from "../../services/tutorService";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getProgress(student) {
  const total = Number(student.total_paid_classes || 0);
  const completed = Number(student.completed_classes || 0);

  if (total <= 0) return 0;

  return Math.min(Math.round((completed / total) * 100), 100);
}

function TutorStudents() {
  const { session, profile } = useAuth();

  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadTutorStudents() {
    setIsLoading(true);
    setNotice("");

    if (!session?.user?.id) {
      setNotice("No active tutor session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getTutorStudentsForCurrentUser(
      session.user.id
    );

    if (error) {
      setNotice(error.message || "Could not load assigned students.");
      setIsLoading(false);
      return;
    }

    setStudentData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadTutorStudents();
  }, [session?.user?.id]);

  const students = studentData?.students || [];
  const bookings = studentData?.bookings || [];
  const summary = studentData?.summary || {};

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      if (a.is_restricted === b.is_restricted) {
        return (a.profiles?.full_name || "").localeCompare(
          b.profiles?.full_name || ""
        );
      }

      return a.is_restricted ? 1 : -1;
    });
  }, [students]);

  function getStudentBookings(studentId) {
    return bookings.filter((booking) => booking.student_id === studentId);
  }

  function getLatestBooking(studentId) {
    return getStudentBookings(studentId)[0] || null;
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading assigned students...</h2>
        <p>Please wait while your student records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Tutor students issue</h2>
        <p>{notice}</p>

        <button type="button" className="tableActionBtn" onClick={loadTutorStudents}>
          Try Again
        </button>
      </section>
    );
  }

  const tutorCards = [
    {
      label: "Assigned Students",
      value: summary.totalStudents || students.length,
    },
    {
      label: "Active Students",
      value: summary.activeStudents || 0,
    },
    {
      label: "Restricted",
      value: summary.restrictedStudents || 0,
    },
    {
      label: "Completed Classes",
      value: summary.totalCompletedClasses || 0,
    },
    {
      label: "Outstanding Balance",
      value: formatMoney(summary.totalOutstandingBalance || 0),
    },
    {
      label: "Total Bookings",
      value: summary.totalBookings || bookings.length,
    },
    {
      label: "Specialisation",
      value: studentData?.tutor?.specialisation || "Not set",
    },
  ];

  return (
    <section className="tutorStudentsPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>My Students</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. Monitor assigned students,
            class progress, payment balance, access status, and latest class
            activity.
          </p>
        </div>

        <button type="button" onClick={loadTutorStudents}>
          Refresh
        </button>
      </header>

      <section className="dashboardGrid tutorStudentsSummaryGrid">
        {tutorCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </section>

      <section className="dashboardPanel tutorStudentsMainPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Assigned Students</h2>
            <p>
              Use this table to quickly check progress, balance, restrictions,
              and recent class activity.
            </p>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No assigned student yet</h3>
            <p>
              Once admin assigns students to you, they will appear here with
              their course and progress details.
            </p>
          </div>
        ) : (
          <div className="tutorStudentsFullTableWrap">
            <table className="tutorStudentsFullTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Progress</th>
                  <th>Classes</th>
                  <th>Balance</th>
                  <th>Access</th>
                  <th>Latest Class</th>
                </tr>
              </thead>

              <tbody>
                {sortedStudents.map((student) => {
                  const total = Number(student.total_paid_classes || 0);
                  const completed = Number(student.completed_classes || 0);
                  const remaining = Math.max(total - completed, 0);
                  const progress = getProgress(student);
                  const latestBooking = getLatestBooking(student.id);

                  return (
                    <tr key={student.id}>
                      <td>
                        <strong>
                          {student.profiles?.full_name || "Unnamed Student"}
                        </strong>
                        <small>{student.student_code || "-"}</small>
                      </td>

                      <td>{student.profiles?.email || "-"}</td>

                      <td>{student.enrolled_course || "Data Analysis"}</td>

                      <td>
                        <div className="studentProgressCell">
                          <strong>{progress}%</strong>

                          <div className="miniProgressTrack">
                            <div
                              className="miniProgressFill"
                              style={{ width: `${progress}%` }}
                            />
                          </div>

                          <small>
                            {completed} of {total} classes
                          </small>
                        </div>
                      </td>

                      <td>
                        <strong>{remaining}</strong>
                        <small>classes left</small>
                      </td>

                      <td>
                        <strong>{formatMoney(student.payment_balance || 0)}</strong>
                      </td>

                      <td>
                        <span
                          className={`statusPill ${
                            student.is_restricted ? "urgent" : "approved"
                          }`}
                        >
                          {student.is_restricted ? "Restricted" : "Active"}
                        </span>
                      </td>

                      <td>
                        {latestBooking ? (
                          <div className="latestBookingCell">
                            <span className={`statusPill ${latestBooking.status}`}>
                              {latestBooking.status}
                            </span>

                            <small>
                              {formatDate(latestBooking.class_slots?.slot_date)}
                            </small>

                            <small>
                              {latestBooking.class_slots?.start_time || "-"} -{" "}
                              {latestBooking.class_slots?.end_time || "-"}
                            </small>

                            {latestBooking.class_slots?.topic && (
                              <small>{latestBooking.class_slots.topic}</small>
                            )}
                          </div>
                        ) : (
                          <span className="mutedText">No booking yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboardPanel tutorStudentsRulePanel">
        <h2>Student Monitoring Rules</h2>
        <p>
          Students marked as <strong>Restricted</strong> may have payment or
          admin access restrictions. Progress is calculated as completed classes
          divided by total paid classes.
        </p>
      </section>
    </section>
  );
}

export default TutorStudents;