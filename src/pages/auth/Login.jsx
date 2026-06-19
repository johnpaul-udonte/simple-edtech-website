import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmail, signOut } from "../../services/authService";
import { getProfileByUserId } from "../../services/profileService";

function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setIsLoading(true);
    setNotice("");

    const { data, error } = await signInWithEmail(email, password);

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    const userId = data?.user?.id;

    if (!userId) {
      setNotice("Login succeeded, but no user ID was returned.");
      setIsLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await getProfileByUserId(userId);

    if (profileError || !profile) {
      await signOut();
      setNotice(
        "Login succeeded, but no matching profile was found. Please create a profile record for this user."
      );
      setIsLoading(false);
      return;
    }

    if (profile.status !== "active") {
      await signOut();
      setNotice(`Your account is currently ${profile.status}. Please contact admin.`);
      setIsLoading(false);
      return;
    }

    if (profile.role === "admin") {
      navigate("/admin/dashboard");
      return;
    }

    if (profile.role === "tutor") {
      navigate("/tutor/dashboard");
      return;
    }

    if (profile.role === "student") {
      navigate("/student/dashboard");
      return;
    }

    await signOut();
    setNotice("Unknown user role. Please contact admin.");
    setIsLoading(false);
  }

  return (
    <main className="authPage">
      <section className="authCard">
        <p className="eyebrow">Portal Login</p>
        <h2>Welcome back</h2>
        <p>Student, tutor, and admin login will connect through Supabase.</p>

        {notice && <div className="formNotice">{notice}</div>}

        <form onSubmit={handleLogin}>
          <label>
            Email Address
            <input
              type="email"
              placeholder="Enter email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>

          <button type="submit" disabled={isLoading}>
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Login;