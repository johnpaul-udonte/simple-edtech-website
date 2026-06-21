import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminDashboardStats,
  getRecentStudentsForAdmin,
} from "../../services/adminService";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getStatusClass(isRestricted) {
  return isRestricted ? "urgent" : "issued";
}

function getClassesLeft(student) {
  const total = Number(student.total_paid_classes || 0);
  const completed = Number(student.completed_classes || 0);
  return Math.max(total - completed, 0);
}

function AdminDashboard() {
  const { profile } = useAuth();

  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadAdminDashboard() {
    setIsLoading(true);
    setNotice("");

    const { data: statsData, error: statsError } =
      await getAdminDashboardStats();

    if (statsError) {
      setNotice(statsError.message || "Could not load admin dashboard stats.");
      setIsLoading(false);
      return;
    }

    const { data: studentsData, error: studentsError } =
      await getRecentStudentsForAdmin();

    if (studentsError) {
      setNotice(studentsError.message || "Could not load recent students.");
      setIsLoading(false);
      return;
    }

    setStats(statsData);
    setRecentStudents(studentsData || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadAdminDashboard();
  }, []);

  const adminCards = useMemo(() => {
    return [
      { label: "Total Students", value: stats?.totalStudents || 0 },
      { label: "Active Students", value: stats?.activeStudents || 0 },
      { label: "Restricted Students", value: stats?.restrictedStudents || 0 },
      { label: "Active Tutors", value: stats?.activeTutors || 0 },
      {
        label: "Confirmed Payments",
        value: formatMoney(stats?.totalConfirmedAmount || 0),
        wide: true,
      },
      {
        label: "Outstanding Balance",
        value: formatMoney(stats?.totalPaymentBalance || 0),
        wide: true,
      },
      { label: "Assignments", value: stats?.totalAssignments || 0 },
      { label: "Pending Certificates", value: stats?.pendingCertificates || 0 },
      { label: "Completed Classes", value: stats?.completedClasses || 0 },
      { label: "Missed Classes", value: stats?.missedClasses || 0 },
    ];
  }, [stats]);

  const riskSummary = useMemo(() => {
    const studentsWithBalance = recentStudents.filter(
      (student) => Number(student.payment_balance || 0) > 0
    ).length;

    const restrictedRecent = recentStudents.filter(
      (student) => student.is_restricted
    ).length;

    const studentsWithoutTutor = recentStudents.filter(
      (student) => !student.tutors?.profiles?.full_name
    ).length;

    return {
      studentsWithBalance,
      restrictedRecent,
      studentsWithoutTutor,
    };
  }, [recentStudents]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading admin dashboard...</h2>
        <p>Please wait while Jlux Academy analytics are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Admin dashboard issue</h2>
        <p>{notice}</p>
        <button type="button" className="tableActionBtn" onClick={loadAdminDashboard}>
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="adminDashboardPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Welcome back, {profile?.full_name || "Admin"}</h1>
          <p>
            Monitor live platform activity across students, tutors, payments,
            classes, assignments, certificates, schedules, and access
            restrictions.
          </p>
        </div>

        <div className="headerActionGroup">
          <button type="button" onClick={loadAdminDashboard}>
            Refresh
          </button>

          <Link to="/admin/students" className="headerSecondaryBtn">
            Manage Students
          </Link>
        </div>
      </header>

      <section className="adminDashboardSummaryGrid">
        {adminCards.map((card) => (
          <article
            className={`dashboardCard ${card.wide ? "moneyDashboardCard" : ""}`}
            key={card.label}
          >
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </section>

      <section className="dashboardPanel adminDashboardRiskPanel adminDashboardAttentionOnly">
        <div className="panelHeaderRow">
          <div>
            <h2>Admin Attention</h2>
            <p>Key areas that may need quick review.</p>
          </div>
        </div>

        <div className="adminRiskGrid">
          <div>
            <p>Recent Students With Balance</p>
            <h3>{riskSummary.studentsWithBalance}</h3>
          </div>

          <div>
            <p>Restricted Recent Students</p>
            <h3>{riskSummary.restrictedRecent}</h3>
          </div>

          <div>
            <p>Students Without Tutor</p>
            <h3>{riskSummary.studentsWithoutTutor}</h3>
          </div>
        </div>
      </section>

      <section className="dashboardPanel adminDashboardTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Recent Students</h2>
            <p>
              Check recently created students, assigned tutors, remaining
              classes, payment balance, and access status.
            </p>
          </div>

          <Link to="/admin/students" className="tableActionBtn">
            View All Students
          </Link>
        </div>

        {recentStudents.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No students yet</h3>
            <p>No students have been created on the platform yet.</p>
          </div>
        ) : (
          <div className="adminDashboardTableWrap">
            <table className="adminDashboardTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Tutor</th>
                  <th>Classes Left</th>
                  <th>Balance</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentStudents.map((student) => (
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
                      {student.tutors?.profiles?.full_name ||
                        "Tutor not assigned"}
                    </td>

                    <td>{getClassesLeft(student)}</td>

                    <td>{formatMoney(student.payment_balance || 0)}</td>

                    <td>
                      <span
                        className={`statusPill ${getStatusClass(
                          student.is_restricted
                        )}`}
                      >
                        {student.is_restricted ? "Restricted" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default AdminDashboard;