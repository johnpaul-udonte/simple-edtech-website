import { Link } from "react-router-dom";

function Unauthorized() {
  return (
    <section className="authPage">
      <div className="authCard statusPageCard">
        <p className="eyebrow">Access Denied</p>

        <h1>Unauthorized Access</h1>

        <p>
          You are logged in, but your account role does not have permission to
          open this page.
        </p>

        <div className="statusPageActions">
          <Link className="tableActionBtn" to="/login">
            Go to Login
          </Link>

          <Link className="secondaryActionBtn" to="/">
            Back to Website
          </Link>
        </div>
      </div>
    </section>
  );
}

export default Unauthorized;