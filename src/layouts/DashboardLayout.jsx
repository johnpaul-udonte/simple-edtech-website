import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function DashboardLayout({ role }) {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();

  const roleLinks = {
    Student: [
      { label: "Dashboard", path: "/student/dashboard" },
      { label: "Notifications", path: "/student/notifications" },
      { label: "Assignments", path: "/student/assignments" },
      { label: "Schedule", path: "/student/schedule" },
      { label: "Weekly Practice", path: "/student/practice" },
      { label: "Materials", path: "/student/materials" },
      { label: "Certificates", path: "/student/certificates" },
      { label: "Change Password", path: "/student/change-password" },
    ],

    Tutor: [
      { label: "Dashboard", path: "/tutor/dashboard" },
      { label: "Students", path: "/tutor/students" },
      { label: "Assignments", path: "/tutor/assignments" },
      { label: "Quizzes", path: "/tutor/quizzes" },
      { label: "Materials", path: "/tutor/materials" },
      { label: "Announcements", path: "/tutor/announcements" },
      { label: "Schedule", path: "/tutor/schedule" },
    ],

    Admin: [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Applications", path: "/admin/applications" },
      { label: "Login Credentials", path: "/admin/login-credentials" },
      { label: "Students", path: "/admin/students" },
      { label: "Tutors", path: "/admin/tutors" },
      { label: "Schedules", path: "/admin/schedules" },
      { label: "Payments", path: "/admin/payments" },
      { label: "Assignments", path: "/admin/assignments" },
      { label: "Quizzes", path: "/admin/quizzes" },
      { label: "Certificates", path: "/admin/certificates" },
      { label: "Materials", path: "/admin/materials" },
      { label: "Announcements", path: "/admin/announcements" },
      { label: "Reports", path: "/admin/reports" },
    ],
  };

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="dashboardShell">
      <aside className="sidebar">
        <Link to="/" className="dashboardBrand">
          <img src="/images/jlux-logo.png" alt="Jlux Academy Logo" />

          <div>
            <h2>Jlux Academy</h2>
            <p>{role} Portal</p>
          </div>
        </Link>

        {profile && (
          <div className="userMiniCard">
            <p>Logged in as</p>
            <strong>{profile.full_name}</strong>
            <span>{profile.role}</span>
          </div>
        )}

        <nav className="sideNav">
          {(roleLinks[role] || []).map((item) => (
            <NavLink key={item.path} to={item.path}>
              {item.label}
            </NavLink>
          ))}

          <Link to="/">Back to Website</Link>

          <button type="button" onClick={handleLogout} className="logoutBtn">
            Logout
          </button>
        </nav>
      </aside>

      <main className="dashboardMain">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;