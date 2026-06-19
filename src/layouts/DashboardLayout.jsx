import { Link, Outlet } from "react-router-dom";

function DashboardLayout({ role }) {
  return (
    <div className="dashboardShell">
      <aside className="sidebar">
        <div className="dashboardBrand">
          <img src="/images/jlux-logo.png" alt="Jlux Academy Logo" />
          <div>
            <h2>Jlux Academy</h2>
            <p>{role} Portal</p>
          </div>
        </div>

        <nav className="sideNav">
          <Link to="/">Public Website</Link>
          <Link to="/student/dashboard">Student Dashboard</Link>
          <Link to="/tutor/dashboard">Tutor Dashboard</Link>
          <Link to="/admin/dashboard">Admin Dashboard</Link>
        </nav>
      </aside>

      <main className="dashboardMain">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;