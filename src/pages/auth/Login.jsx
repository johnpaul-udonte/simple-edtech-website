import { useState } from "react";
import { signInWithEmail } from "../../services/authService";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  async function handleLogin(event) {
    event.preventDefault();
    setIsLoading(true);
    setNotice("");

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setNotice("Login successful. Role-based redirect will be added next.");
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