import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import EyePasswordInput from "../../components/EyePasswordInput";

function Login() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setIsLoading(true);
    setNotice("");

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await login(cleanEmail, password);

    if (error) {
      setNotice(error.message || "Invalid login details.");
      setIsLoading(false);
      return;
    }

    const profile = data?.profile;

    if (!profile) {
      await logout();
      setNotice(
        "Login succeeded, but no matching profile was found. Please contact admin."
      );
      setIsLoading(false);
      return;
    }

    if (profile.status !== "active") {
      await logout();
      setNotice(
        `Your account is currently ${profile.status}. Please contact admin.`
      );
      setIsLoading(false);
      return;
    }

    if (profile.role === "admin") {
      navigate("/admin/dashboard", { replace: true });
      return;
    }

    if (profile.role === "tutor") {
      navigate("/tutor/dashboard", { replace: true });
      return;
    }

    if (profile.role === "student") {
      navigate("/student/dashboard", { replace: true });
      return;
    }

    await logout();
    setNotice("Unknown user role. Please contact admin.");
    setIsLoading(false);
  }

  return (
    <main className="authPage">
      <section className="authCard">
        <p className="eyebrow">Portal Login</p>
        <h2>Welcome back</h2>
        <p>
          Sign in to access your Jlux Academy dashboard, learning activities,
          class progress, and account updates.
        </p>

        {notice && <div className="formNotice">{notice}</div>}

        <form onSubmit={handleLogin}>
          <label>
            Email Address
            <input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <EyePasswordInput
            label="Password"
            name="password"
            value={password}
            autoComplete="current-password"
            placeholder="Enter your password"
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Opening Dashboard..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;