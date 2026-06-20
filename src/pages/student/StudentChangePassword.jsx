import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { changeMyStudentPassword } from "../../services/studentPasswordService";

function StudentChangePassword() {
  const { profile } = useAuth();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    setNotice("");
    setErrorMessage("");

    if (!currentPassword || !newPassword || !confirmPassword) {
      setErrorMessage("Please fill all password fields.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("New password and confirmation password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setErrorMessage("New password must be different from current password.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await changeMyStudentPassword({
      profile,
      currentPassword,
      newPassword,
    });

    if (error) {
      setErrorMessage(error.message || "Password change failed.");
      setIsSubmitting(false);
      return;
    }

    setNotice(
      "Password changed successfully. Your new login credential has been updated in admin records."
    );

    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setIsSubmitting(false);
  }

  return (
    <>
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Account Security</p>
          <h1>Change Password</h1>
          <p>
            Change your student portal password. Your latest password will be
            available to admin for support and access management.
          </p>
        </div>
      </header>

      {notice && <div className="successNotice">{notice}</div>}
      {errorMessage && <div className="errorNotice">{errorMessage}</div>}

      <section className="dashboardPanel">
        <h2>Update Login Password</h2>

        <form className="passwordForm" onSubmit={handleSubmit}>
          <label className="passwordField">
            Current Password
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              autoComplete="current-password"
              placeholder="Enter your current password"
              onChange={(event) => setCurrentPassword(event.target.value)}
            />

            <button
              type="button"
              className="passwordToggleButton"
              onClick={() => setShowCurrentPassword((current) => !current)}
            >
              {showCurrentPassword ? "Hide Current Password" : "Show Current Password"}
            </button>
          </label>

          <label className="passwordField">
            New Password
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              autoComplete="new-password"
              placeholder="Enter your new password"
              onChange={(event) => setNewPassword(event.target.value)}
            />

            <button
              type="button"
              className="passwordToggleButton"
              onClick={() => setShowNewPassword((current) => !current)}
            >
              {showNewPassword ? "Hide New Password" : "Show New Password"}
            </button>
          </label>

          <label className="passwordField">
            Confirm New Password
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              autoComplete="new-password"
              placeholder="Re-enter your new password"
              onChange={(event) => setConfirmPassword(event.target.value)}
            />

            <button
              type="button"
              className="passwordToggleButton"
              onClick={() => setShowConfirmPassword((current) => !current)}
            >
              {showConfirmPassword
                ? "Hide Confirm Password"
                : "Show Confirm Password"}
            </button>
          </label>

          <p className="passwordHelp">
            Password must be at least 8 characters and should contain uppercase,
            lowercase, and numbers.
          </p>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Changing Password..." : "Change Password"}
          </button>
        </form>
      </section>
    </>
  );
}

export default StudentChangePassword;