import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAssignedStudents,
  getCurrentTutorRecord,
} from "../../services/tutorService";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function joinList(value) {
  if (!value) return "Not set";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "Not set";
  return String(value);
}

function TutorDashboard() {
  const { profile, session } = useAuth();

  const [tutorRecord, setTutorRecord] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadTutorData() {
    setIsLoading(true);
    setNotice("");

    if (!session?.user?.id) {
      setNotice("No active tutor session found.");
      setIsLoading(false);
      return;
    }

    const { data: tutorData, error: tutorError } =
      await getCurrentTutorRecord(session.user.id);

    if (tutorError) {
      setNotice(tutorError.message || "Could not load tutor record.");
      setIsLoading(false);
      return;
    }

    if (!tutorData?.id) {
      setNotice(
        "No tutor record was found for this login. Please contact admin to complete your tutor setup."
      );
      setIsLoading(false);
      return;
    }

    setTutorRecord(tutorData);

    const { data: assignedStudents, error: studentsError } =
      await getAssignedStudents(tutorData.id);

    if (studentsError) {
      setNotice(studentsError.message || "Could not load assigned students.");
      setIsLoading(false);
      return;
    }

    setStudents(assignedStudents || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadTutorData();
  }, [session?.user?.id]);

  const dashboardStats = useMemo(() => {
    const assignedCount = students.length;

    const restrictedCount = students.filter(
      (student) => student.is_restricted
    ).length;

    const activeCount = assignedCount - restrictedCount;

    const totalCompletedClasses = students.reduce(
      (sum, student) => sum + Number(student.completed_classes || 0),
      0
    );

    const totalOutstandingBalance = students.reduce(
      (sum, student) => sum + Number(student.payment_balance || 0),
      0
    );

    const averageProgress =
      assignedCount > 0
        ? Math.round(
            students.reduce((sum, student) => {
              const total = Number(student.total_paid_classes || 0);
              const completed = Number(student.completed_classes || 0);
              const progress = total > 0 ? (completed / total) * 100 : 0;
              return sum + progress;
            }, 0) / assignedCount
          )
        : 0;

    return {
      assignedCount,
      restrictedCount,
      activeCount,
      totalCompletedClasses,
      totalOutstandingBalance,
      averageProgress,
    };
  }, [students]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading tutor dashboard...</h2>
        <p>Please wait while your assigned students are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Tutor record issue</h2>
        <p>{notice}</p>

        <button type="button" className="tableActionBtn" onClick={loadTutorData}>
          Try Again
        </button>
      </section>
    );
  }

  const tutorCards = [
    { label: "Assigned Students", value: dashboardStats.assignedCount },
    { label: "Active Students", value: dashboardStats.activeCount },
    { label: "Restricted", value: dashboardStats.restrictedCount },
    { label: "Completed Classes", value: dashboardStats.totalCompletedClasses },
    { label: "Average Progress", value: `${dashboardStats.averageProgress}%` },
    {
      label: "Outstanding Balance",
      value: formatMoney(dashboardStats.totalOutstandingBalance),
    },
  ];

  return (
    <section className="tutorDashboardPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Welcome back, {profile?.full_name || "Tutor"}</h1>
          <p>
            Monitor your assigned students, class progress, payment restrictions,
            schedule approvals, assignments, and drills.
          </p>
        </div>

        <button type="button" onClick={loadTutorData}>
          Refresh
        </button>
      </header>

      <section className="tutorProfileOverview">
        <article className="tutorProfileCard">
          <p className="eyebrow">Tutor Profile</p>
          <h2>{tutorRecord?.specialisation || "Specialisation not set"}</h2>

          <div className="tutorProfileMeta">
            <span>
              Tools
              <strong>{joinList(tutorRecord?.tools)}</strong>
            </span>

            <span>
              Teaching Mode
              <strong>{tutorRecord?.teaching_mode || "Not set"}</strong>
            </span>

            <span>
              Experience
              <strong>{tutorRecord?.years_of_experience || 0} year(s)</strong>
            </span>

            <span>
              Status
              <strong>{tutorRecord?.is_active ? "Active" : "Inactive"}</strong>
            </span>
          </div>
        </article>

        <article className="tutorAvailabilityCard">
          <p className="eyebrow">Availability</p>

          <div>
            <span>Days</span>
            <strong>{joinList(tutorRecord?.available_days)}</strong>
          </div>

          <div>
            <span>Times</span>
            <strong>{joinList(tutorRecord?.available_times)}</strong>
          </div>
        </article>
      </section>

      <section className="dashboardGrid tutorDashboardSummaryGrid">
        {tutorCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </section>

      <section className="tutorQuickActions">
        <Link to="/tutor/schedule">Review Schedules</Link>
        <Link to="/tutor/assignments">Manage Assignments</Link>
        <Link to="/tutor/drills">Manage Drills</Link>
        <Link to="/tutor/students">View Students</Link>
      </section>

      <section className="dashboardPanel tutorStudentsPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Assigned Students</h2>
            <p>
              View each student’s course, class progress, remaining classes, and
              access status.
            </p>
          </div>
        </div>

        {students.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No assigned student yet</h3>
            <p>
              Once admin assigns students to you, they will appear here with
              their class and payment status.
            </p>
          </div>
        ) : (
          <div className="tutorStudentsTableWrap">
            <table className="tutorStudentsTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Progress</th>
                  <th>Classes Left</th>
                  <th>Balance</th>
                  <th>Access</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => {
                  const total = Number(student.total_paid_classes || 0);
                  const completed = Number(student.completed_classes || 0);
                  const remaining = Math.max(total - completed, 0);
                  const progress =
                    total > 0 ? Math.round((completed / total) * 100) : 0;

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
                            {completed} / {total} classes
                          </small>
                        </div>
                      </td>

                      <td>{remaining}</td>

                      <td>{formatMoney(student.payment_balance || 0)}</td>

                      <td>
                        <span
                          className={`statusPill ${
                            student.is_restricted ? "urgent" : "approved"
                          }`}
                        >
                          {student.is_restricted ? "Restricted" : "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default TutorDashboard;