import { Link, NavLink, Outlet } from "react-router-dom";

function DashboardLayout({ role }) {
  const roleLinks = {
    Student: [
      { label: "Dashboard", path: "/student/dashboard" },
      { label: "Assignments", path: "/student/assignments" },
      { label: "Schedule", path: "/student/schedule" },
      { label: "Weekly Practice", path: "/student/practice" },
      { label: "Materials", path: "/student/materials" },
      { label: "Certificates", path: "/student/certificates" },
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

        <nav className="sideNav">
          {(roleLinks[role] || []).map((item) => (
            <NavLink key={item.path} to={item.path}>
              {item.label}
            </NavLink>
          ))}

          <Link to="/">Back to Website</Link>
        </nav>
      </aside>

      <main className="dashboardMain">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;