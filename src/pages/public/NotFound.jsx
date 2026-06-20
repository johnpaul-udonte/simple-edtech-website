import { Link } from "react-router-dom";

function NotFound() {
  return (
    <section className="authPage">
      <div className="authCard statusPageCard">
        <p className="eyebrow">404 Error</p>

        <h1>Page Not Found</h1>

        <p>
          The page you are looking for does not exist, may have been moved, or
          the link may be incorrect.
        </p>

        <div className="statusPageActions">
          <Link className="tableActionBtn" to="/">
            Back to Home
          </Link>

          <Link className="secondaryActionBtn" to="/login">
            Go to Login
          </Link>
        </div>
      </div>
    </section>
  );
}

export default NotFound;