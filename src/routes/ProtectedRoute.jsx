import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ allowedRole, children }) {
  const auth = useAuth();

  const session = auth?.session;
  const profile = auth?.profile;
  const isLoading = auth?.isLoading || auth?.loading || false;

  if (isLoading) {
    return (
      <section className="dashboardPanel routeLoadingPanel">
        <h2>Checking your access...</h2>
        <p>Please wait while your account permission is verified.</p>
      </section>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (!profile) {
    return (
      <section className="dashboardPanel routeLoadingPanel">
        <h2>Profile issue</h2>
        <p>
          Login succeeded, but no matching profile was found. Please contact
          Jlux Academy admin.
        </p>
      </section>
    );
  }

  if (allowedRole && profile.role !== allowedRole) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

export default ProtectedRoute;