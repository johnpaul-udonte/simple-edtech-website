import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

function ResetPassword() {
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleResetPassword(event) {
    event.preventDefault();

    setNotice("");
    setError("");

    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });

    if (updateError) {
      setError(updateError.message || "Could not update password.");
      setIsSaving(false);
      return;
    }

    await supabase.auth.signOut();

    setNotice("Password updated successfully. You can now login.");
    setIsSaving(false);

    setTimeout(() => {
      navigate("/login");
    }, 1500);
  }

  return (
    <section className="authPage">
      <div className="authCard">
        <p className="eyebrow">Password Reset</p>
        <h1>Set New Password</h1>
        <p>Enter your new password below.</p>

        {notice && <div className="successNotice">{notice}</div>}
        {error && <div className="errorNotice">{error}</div>}

        <form onSubmit={handleResetPassword}>
          <label>
            New Password
            <input
              type="password"
              value={password}
              placeholder="Enter new password"
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          <label>
            Confirm New Password
            <input
              type="password"
              value={confirmPassword}
              placeholder="Confirm new password"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </label>

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Update Password"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ResetPassword;