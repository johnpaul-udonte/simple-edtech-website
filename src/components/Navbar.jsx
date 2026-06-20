import { Link, NavLink } from "react-router-dom";

function Navbar() {
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
        <NavLink to="/courses">Courses</NavLink>
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/faq">FAQ</NavLink>
        <NavLink to="/contact">Contact</NavLink>
      </div>

      <div className="navActions">
        <Link to="/login" className="loginBtn">Login</Link>
        <Link to="/register" className="primaryNavBtn">Register</Link>
      </div>
    </nav>
  );
}

export default Navbar;