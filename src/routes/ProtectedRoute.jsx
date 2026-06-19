import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRole, children }) {
  const { isAuthenticated, isLoadingAuth, profile } = useAuth();

  if (isLoadingAuth) {
    return (
      <main className="authPage">
        <section className="authCard">
          <p className="eyebrow">Loading Portal</p>
          <h2>Checking access...</h2>
          <p>Please wait while Jlux Academy verifies your session.</p>
        </section>
      </main>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <main className="authPage">
        <section className="authCard">
          <p className="eyebrow">Profile Missing</p>
          <h2>Access cannot be verified</h2>
          <p>
            You are logged in, but your Jlux Academy profile could not be loaded.
            Please contact admin.
          </p>
        </section>
      </main>
    );
  }

  if (profile.role !== allowedRole) {
    return (
      <main className="authPage">
        <section className="authCard">
          <p className="eyebrow">Wrong Portal</p>
          <h2>Redirect needed</h2>
          <p>
            You are logged in as {profile.role}, but this page is for {allowedRole}.
          </p>
        </section>
      </main>
    );
  }

  return children;
}

export default ProtectedRoute;