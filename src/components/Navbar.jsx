import { useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const navigate = useNavigate();
  const { profile, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  function getDashboardPath() {
    if (profile?.role === "admin") return "/admin/dashboard";
    if (profile?.role === "tutor") return "/tutor/dashboard";
    if (profile?.role === "student") return "/student/dashboard";
    return "/login";
  }

  function closeMenu() {
    setIsMenuOpen(false);
  }

  async function handleLogout() {
    await logout();
    setIsMenuOpen(false);
    navigate("/login");
  }

  return (
    <nav className={`navbar ${isMenuOpen ? "mobileMenuOpen" : ""}`}>
      <div className="navbarTopRow">
        <Link to="/" className="brand" onClick={closeMenu}>
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

        <button
          type="button"
          className="mobileMenuToggle"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-label="Toggle navigation menu"
        >
          {isMenuOpen ? "×" : "☰"}
        </button>
      </div>

      <div className="navLinks">
        <NavLink to="/" onClick={closeMenu}>
          Home
        </NavLink>

        <NavLink to="/courses" onClick={closeMenu}>
          Courses
        </NavLink>

        <NavLink to="/pricing" onClick={closeMenu}>
          Pricing
        </NavLink>

        <NavLink to="/faq" onClick={closeMenu}>
          FAQ
        </NavLink>

        <NavLink to="/contact" onClick={closeMenu}>
          Contact
        </NavLink>
      </div>

      <div className="navActions">
        {profile ? (
          <>
            <Link to={getDashboardPath()} className="loginBtn" onClick={closeMenu}>
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
            <Link to="/login" className="loginBtn" onClick={closeMenu}>
              Login
            </Link>

            <Link to="/register" className="primaryNavBtn" onClick={closeMenu}>
              Register
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;