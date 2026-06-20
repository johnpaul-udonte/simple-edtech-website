import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();

  function getDashboardPath() {
    if (profile?.role === "admin") return "/admin/dashboard";
    if (profile?.role === "tutor") return "/tutor/dashboard";
    if (profile?.role === "student") return "/student/dashboard";

    return "/login";
  }

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">
        <img
          src="/images/jlux-logo.png"
          alt="Jlux Academy Logo"
          className="brandLogo"
        />

        <div>
          <h1>Jlux Academy</h1>
          <p>EdTech Training Platform</p>
        </div>
      </Link>

      <div className="navLinks">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/faq">FAQ</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </div>

      <div className="navActions">
        {profile ? (
          <>
            <Link to={getDashboardPath()} className="loginBtn">
              Dashboard
            </Link>

            <button
              type="button"
              className="primaryNavBtn navLogoutBtn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="loginBtn">
              Login
            </Link>

            <Link to="/register" className="primaryNavBtn">
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;