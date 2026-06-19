import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAdminDashboardStats,
  getRecentStudentsForAdmin,
} from "../../services/adminService";

function AdminDashboard() {
  const { profile } = useAuth();

  const [stats, setStats] = useState(null);
  const [recentStudents, setRecentStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadAdminDashboard() {
      const { data: statsData, error: statsError } =
        await getAdminDashboardStats();

      if (statsError) {
        setNotice(statsError.message);
        setIsLoading(false);
        return;
      }

      const { data: studentsData, error: studentsError } =
        await getRecentStudentsForAdmin();

      if (studentsError) {
        setNotice(studentsError.message);
        setIsLoading(false);
        return;
      }

      setStats(statsData);
      setRecentStudents(studentsData || []);
      setIsLoading(false);
    }

    loadAdminDashboard();
  }, []);

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
      </section>
    );
  }

  const adminCards = [
    { label: "Total Students", value: stats?.totalStudents || 0 },
    { label: "Active Students", value: stats?.activeStudents || 0 },
    { label: "Restricted Students", value: stats?.restrictedStudents || 0 },
    { label: "Active Tutors", value: stats?.activeTutors || 0 },
    {
      label: "Confirmed Payments",
      value: `₦${Number(stats?.totalConfirmedAmount || 0).toLocaleString()}`,
    },
    {
      label: "Outstanding Balance",
      value: `₦${Number(stats?.totalPaymentBalance || 0).toLocaleString()}`,
    },
    { label: "Assignments", value: stats?.totalAssignments || 0 },
    { label: "Pending Certificates", value: stats?.pendingCertificates || 0 },
    { label: "Completed Classes", value: stats?.completedClasses || 0 },
    { label: "Missed Classes", value: stats?.missedClasses || 0 },
  ];

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Welcome back, {profile?.full_name || "Admin"}</h1>
          <p>
            Monitor real platform activity across students, tutors, payments,
            classes, assignments, certificates, and access restrictions.
          </p>
        </div>

        <button>Create Student</button>
      </div>

      <div className="dashboardGrid">
        {adminCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </div>

      <div className="dashboardPanel">
        <h2>Recent Students</h2>

        {recentStudents.length === 0 ? (
          <p>No students have been created yet.</p>
        ) : (
          <table>
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
              {recentStudents.map((student) => {
                const total = Number(student.total_paid_classes || 0);
                const completed = Number(student.completed_classes || 0);
                const remaining = Math.max(total - completed, 0);

                return (
                  <tr key={student.id}>
                    <td>{student.profiles?.full_name || "Unnamed Student"}</td>
                    <td>{student.profiles?.email || "-"}</td>
                    <td>{student.enrolled_course}</td>
                    <td>
                      {student.tutors?.profiles?.full_name ||
                        "Tutor not assigned"}
                    </td>
                    <td>{remaining}</td>
                    <td>
                      ₦{Number(student.payment_balance || 0).toLocaleString()}
                    </td>
                    <td>{student.is_restricted ? "Restricted" : "Active"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminDashboard;