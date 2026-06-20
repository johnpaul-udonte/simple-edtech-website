import { useEffect, useState } from "react";
import {
  approveStudentApplicationForAdmin,
  getStudentApplicationsForAdmin,
  rejectStudentApplicationForAdmin,
} from "../../services/adminService";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function yesNo(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "-";
}

function getEmailErrorText(emailError) {
  if (!emailError) return "No email error was returned.";

  if (typeof emailError === "string") {
    return emailError;
  }

  return (
    emailError.message ||
    emailError.error ||
    emailError.name ||
    JSON.stringify(emailError)
  );
}

function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState(null);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");
  const [approvalResult, setApprovalResult] = useState(null);

  async function loadApplications() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await getStudentApplicationsForAdmin();

    if (error) {
      setErrorMessage(error.message);
      setIsLoading(false);
      return;
    }

    setApplications(data?.applications || []);
    setSummary(data?.summary || null);
    setIsLoading(false);
  }

  useEffect(() => {
    loadApplications();
  }, []);

  function openApplication(application) {
    setSelectedApplication(application);
    setAdminNotes(application.admin_notes || "");
    setNotice("");
    setErrorMessage("");
  }

  function clearApprovalResult() {
    setApprovalResult(null);
  }

  async function copyLoginDetails() {
    if (!approvalResult) return;

    const loginText = `Jlux Academy Student Login Details

Student Name: ${approvalResult.studentName || "-"}
Email: ${approvalResult.loginEmail || "-"}
Temporary Password: ${approvalResult.temporaryPassword || "-"}
Login Link: ${approvalResult.loginUrl || "-"}

Please change your password after logging in.`;

    try {
      await navigator.clipboard.writeText(loginText);
      setNotice(
        "Login details copied. You can now send them to the student manually."
      );
    } catch {
      setErrorMessage(
        "Could not copy automatically. Please highlight and copy the login details manually."
      );
    }
  }

  async function handleApprove(application) {
    const confirmed = window.confirm(
      `Approve ${application.full_name}? This will create the student login account and attempt to send the student an email.`
    );

    if (!confirmed) return;

    setProcessingId(application.id);
    setNotice("");
    setErrorMessage("");
    setApprovalResult(null);

    const { data, error } = await approveStudentApplicationForAdmin(
      application.id,
      adminNotes
    );

    if (error) {
      setErrorMessage(error.message || "Approval failed.");
      setProcessingId("");
      return;
    }

    const rawResult = data?.data || data || {};

    const normalizedResult = {
      studentName: application.full_name,
      loginEmail: rawResult.loginEmail || application.email || "-",
      temporaryPassword:
        rawResult.temporaryPassword || "Temporary password was not returned.",
      loginUrl: rawResult.loginUrl || `${window.location.origin}/login`,
      emailSent: rawResult.emailSent === true,
      emailError: rawResult.emailError || null,
      emailResult: rawResult.emailResult || null,
      userAlreadyExisted: rawResult.userAlreadyExisted === true,
      message: rawResult.message || "Student approved successfully.",
    };

    setApprovalResult(normalizedResult);

    window.alert(
      `Student Approved Successfully!

Student: ${normalizedResult.studentName}
Email: ${normalizedResult.loginEmail}
Temporary Password: ${normalizedResult.temporaryPassword}
Login Link: ${normalizedResult.loginUrl}

Email Sent: ${normalizedResult.emailSent ? "Yes" : "No"}

Copy these details now if email was not sent.`
    );

    if (normalizedResult.emailSent) {
      setNotice(
        `${application.full_name} has been approved. Login details were sent by email.`
      );
    } else {
      setNotice(
        `${application.full_name} has been approved, but email was not sent. Copy the login details below and send them manually.`
      );
    }

    setProcessingId("");
    setSelectedApplication(null);
    setAdminNotes("");

    await loadApplications();

    setApprovalResult(normalizedResult);

    setTimeout(() => {
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }, 100);
  }

  async function handleReject(application) {
    const confirmed = window.confirm(
      `Reject ${application.full_name}'s application?`
    );

    if (!confirmed) return;

    setProcessingId(application.id);
    setNotice("");
    setErrorMessage("");
    setApprovalResult(null);

    const { error } = await rejectStudentApplicationForAdmin(
      application.id,
      adminNotes
    );

    if (error) {
      setErrorMessage(error.message || "Rejection failed.");
      setProcessingId("");
      return;
    }

    setNotice(`${application.full_name}'s application has been rejected.`);

    setProcessingId("");
    setSelectedApplication(null);
    setAdminNotes("");
    await loadApplications();
  }

  return (
    <>
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Applications</p>
          <h1>Student Applications</h1>
          <p>
            Review student registration submissions and approve them before they
            can access the Jlux Academy student portal.
          </p>
        </div>

        <button type="button" onClick={loadApplications}>
          Refresh
        </button>
      </header>

      {notice && <div className="successNotice">{notice}</div>}
      {errorMessage && <div className="errorNotice">{errorMessage}</div>}

      {approvalResult && (
        <section
          className="dashboardPanel"
          style={{
            border: "2px solid #0b4ea2",
            background: "#f8fbff",
          }}
        >
          <div className="panelHeaderRow">
            <div>
              <h2>Student Login Details</h2>
              <p>
                Copy these details and send them to the student manually if the
                email was not delivered.
              </p>
            </div>

            <button
              type="button"
              className="tableActionBtn"
              onClick={clearApprovalResult}
            >
              Hide
            </button>
          </div>

          <div className="applicationReviewGrid">
            <div>
              <h3>Login Credentials</h3>

              <p>
                <strong>Student Name:</strong>{" "}
                {approvalResult.studentName || "-"}
              </p>

              <p>
                <strong>Email:</strong> {approvalResult.loginEmail || "-"}
              </p>

              <p>
                <strong>Temporary Password:</strong>{" "}
                <span style={{ fontWeight: 900, color: "#0b4ea2" }}>
                  {approvalResult.temporaryPassword || "-"}
                </span>
              </p>

              <p>
                <strong>Login Link:</strong>{" "}
                {approvalResult.loginUrl ? (
                  <a
                    href={approvalResult.loginUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {approvalResult.loginUrl}
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>

            <div>
              <h3>Email Status</h3>

              <p>
                <strong>Email Sent:</strong>{" "}
                {approvalResult.emailSent ? "Yes" : "No"}
              </p>

              <p>
                <strong>Existing User Reused:</strong>{" "}
                {approvalResult.userAlreadyExisted ? "Yes" : "No"}
              </p>

              {!approvalResult.emailSent && (
                <div className="errorNotice">
                  <strong>Email Error:</strong>{" "}
                  {getEmailErrorText(approvalResult.emailError)}
                </div>
              )}
            </div>
          </div>

          <div className="tableActionGroup">
            <button
              type="button"
              className="tableActionBtn restoreBtn"
              onClick={copyLoginDetails}
            >
              Copy Login Details
            </button>

            {approvalResult.loginUrl && (
              <a
                href={approvalResult.loginUrl}
                target="_blank"
                rel="noreferrer"
                className="tableActionBtn"
              >
                Open Login Page
              </a>
            )}
          </div>
        </section>
      )}

      {summary && (
        <section className="dashboardGrid">
          <article className="dashboardCard">
            <p>Total Applications</p>
            <h2>{summary.totalApplications}</h2>
          </article>

          <article className="dashboardCard">
            <p>New Applications</p>
            <h2>{summary.newApplications}</h2>
          </article>

          <article className="dashboardCard">
            <p>Approved</p>
            <h2>{summary.approvedApplications}</h2>
          </article>

          <article className="dashboardCard">
            <p>Rejected</p>
            <h2>{summary.rejectedApplications}</h2>
          </article>
        </section>
      )}

      <section className="dashboardPanel">
        <h2>Application List</h2>

        {isLoading ? (
          <p>Loading applications...</p>
        ) : applications.length === 0 ? (
          <p>No student application has been submitted yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Applicant</th>
                <th>Course</th>
                <th>Mode</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {applications.map((application) => (
                <tr key={application.id}>
                  <td>
                    <strong>{application.full_name}</strong>
                    <br />
                    <small>{application.email}</small>
                  </td>

                  <td>{application.preferred_course || "-"}</td>
                  <td>{application.learning_mode || "-"}</td>
                  <td>{application.phone || "-"}</td>

                  <td>
                    <span
                      className={`statusPill ${
                        application.application_status || "new"
                      }`}
                    >
                      {application.application_status || "new"}
                    </span>
                  </td>

                  <td>{formatDateTime(application.created_at)}</td>

                  <td>
                    <button
                      type="button"
                      className="tableActionBtn"
                      onClick={() => openApplication(application)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedApplication && (
        <section className="dashboardPanel applicationReviewPanel">
          <div className="panelHeaderRow">
            <div>
              <h2>Review Application</h2>
              <p>
                Check the applicant details before approving student portal
                access.
              </p>
            </div>

            <button
              type="button"
              className="tableActionBtn"
              onClick={() => setSelectedApplication(null)}
            >
              Close
            </button>
          </div>

          <div className="applicationReviewGrid">
            <div>
              <h3>Personal Information</h3>
              <p>
                <strong>Full Name:</strong> {selectedApplication.full_name}
              </p>
              <p>
                <strong>Email:</strong> {selectedApplication.email}
              </p>
              <p>
                <strong>Phone:</strong> {selectedApplication.phone}
              </p>
              <p>
                <strong>Date of Birth:</strong>{" "}
                {formatDate(selectedApplication.date_of_birth)}
              </p>
              <p>
                <strong>Gender:</strong> {selectedApplication.gender || "-"}
              </p>
              <p>
                <strong>Residential Address:</strong>{" "}
                {selectedApplication.residential_address || "-"}
              </p>
            </div>

            <div>
              <h3>Learning Details</h3>
              <p>
                <strong>Preferred Course:</strong>{" "}
                {selectedApplication.preferred_course || "-"}
              </p>
              <p>
                <strong>Learning Mode:</strong>{" "}
                {selectedApplication.learning_mode || "-"}
              </p>
              <p>
                <strong>Preferred Days:</strong>{" "}
                {(selectedApplication.preferred_class_days || []).join(", ") ||
                  "-"}
              </p>
              <p>
                <strong>Preferred Time:</strong>{" "}
                {selectedApplication.preferred_class_time || "-"}
              </p>
              <p>
                <strong>Skill Level:</strong>{" "}
                {selectedApplication.current_skill_level || "-"}
              </p>
              <p>
                <strong>Education Level:</strong>{" "}
                {selectedApplication.education_level || "-"}
              </p>
              <p>
                <strong>Occupation:</strong>{" "}
                {selectedApplication.occupation || "-"}
              </p>
              <p>
                <strong>Has Laptop:</strong>{" "}
                {yesNo(selectedApplication.has_laptop)}
              </p>
            </div>

            <div>
              <h3>Emergency Details</h3>
              <p>
                <strong>Emergency Contact:</strong>{" "}
                {selectedApplication.emergency_contact_name || "-"}
              </p>
              <p>
                <strong>Emergency Phone:</strong>{" "}
                {selectedApplication.emergency_contact_phone || "-"}
              </p>
              <p>
                <strong>Heard About Us:</strong>{" "}
                {selectedApplication.hear_about_us || "-"}
              </p>
              <p>
                <strong>Submitted:</strong>{" "}
                {formatDateTime(selectedApplication.created_at)}
              </p>
              <p>
                <strong>Approved:</strong>{" "}
                {formatDateTime(selectedApplication.approved_at)}
              </p>
            </div>

            <div>
              <h3>Learning Goal</h3>
              <p>{selectedApplication.learning_goal || "-"}</p>
            </div>
          </div>

          <label className="adminNotesBox">
            Admin Notes
            <textarea
              rows="4"
              value={adminNotes}
              placeholder="Add approval/rejection notes here..."
              onChange={(event) => setAdminNotes(event.target.value)}
            />
          </label>

          <div className="tableActionGroup">
            <button
              type="button"
              className="tableActionBtn restoreBtn"
              disabled={
                processingId === selectedApplication.id ||
                selectedApplication.application_status === "approved"
              }
              onClick={() => handleApprove(selectedApplication)}
            >
              {processingId === selectedApplication.id
                ? "Processing..."
                : "Approve Student"}
            </button>

            <button
              type="button"
              className="tableActionBtn dangerBtn"
              disabled={
                processingId === selectedApplication.id ||
                selectedApplication.application_status === "approved" ||
                selectedApplication.application_status === "rejected"
              }
              onClick={() => handleReject(selectedApplication)}
            >
              Reject Application
            </button>
          </div>
        </section>
      )}
    </>
  );
}

export default AdminApplications;