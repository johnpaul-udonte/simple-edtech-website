import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentAssignmentsForCurrentUser,
  submitAssignmentForStudent,
} from "../../services/studentService";

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

function StudentAssignments() {
  const { session, profile } = useAuth();

  const [assignmentData, setAssignmentData] = useState({
    assignments: [],
    student: null,
  });
  const [submissionForms, setSubmissionForms] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [submittingId, setSubmittingId] = useState("");

  async function loadStudentAssignments() {
    setIsLoading(true);
    setNotice("");
    setActionError("");

    if (!session?.user?.id) {
      setNotice("No active student session found. Please log in again.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getStudentAssignmentsForCurrentUser(
      session.user.id
    );

    if (error) {
      setNotice(error.message || "Could not load assignments.");
      setIsLoading(false);
      return;
    }

    setAssignmentData({
      assignments: Array.isArray(data?.assignments) ? data.assignments : [],
      student: data?.student || null,
    });

    setIsLoading(false);
  }

  useEffect(() => {
    loadStudentAssignments();
  }, [session?.user?.id]);

  function handleSubmissionChange(assignmentId, field, value) {
    setSubmissionForms((current) => ({
      ...current,
      [assignmentId]: {
        ...current[assignmentId],
        [field]: value,
      },
    }));
  }

  async function handleSubmitAssignment(assignment) {
    setSuccessMessage("");
    setActionError("");
    setSubmittingId(assignment.id);

    const userId = session?.user?.id;

    if (!userId) {
      setActionError("Student session not found. Please log in again.");
      setSubmittingId("");
      return;
    }

    const form = submissionForms[assignment.id] || {};
    const submissionText = form.submission_text || "";
    const submissionLink = form.submission_link || "";

    if (!submissionText.trim() && !submissionLink.trim()) {
      setActionError("Please enter a submission note or paste a work link.");
      setSubmittingId("");
      return;
    }

    const { error } = await submitAssignmentForStudent(userId, assignment.id, {
      submission_text: submissionText,
      submission_link: submissionLink,
    });

    if (error) {
      setActionError(error.message || "Could not submit assignment.");
      setSubmittingId("");
      return;
    }

    setSuccessMessage("Assignment submitted successfully.");
    setSubmissionForms({});
    await loadStudentAssignments();
    setSubmittingId("");
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading assignments...</h2>
        <p>Please wait while your assignments are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <>
        <header className="dashboardHeader">
          <div>
            <p className="eyebrow">Student Assignments</p>
            <h1>My Assignments</h1>
            <p>
              Something stopped your assignments from loading. Use refresh, and
              if it continues, we will check the assignment service file.
            </p>
          </div>

          <button type="button" onClick={loadStudentAssignments}>
            Refresh
          </button>
        </header>

        <section className="dashboardPanel">
          <h2>Assignment Issue</h2>
          <p>{notice}</p>
        </section>
      </>
    );
  }

  const assignments = assignmentData?.assignments || [];

  const publishedAssignments = assignments.filter(
    (assignment) => assignment.status === "published"
  );

  const closedAssignments = assignments.filter(
    (assignment) => assignment.status === "closed"
  );

  const submittedAssignments = assignments.filter(
    (assignment) => assignment.student_submission
  );

  const pendingAssignments = assignments.filter(
    (assignment) =>
      assignment.status !== "closed" && !assignment.student_submission
  );

  return (
    <section className="studentAssignmentPage">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Assignments</p>
          <h1>My Assignments</h1>
          <p>
            Welcome, {profile?.full_name || "Student"}. View your assignments,
            submit your work, and track tutor feedback.
          </p>
        </div>

        <button type="button" onClick={loadStudentAssignments}>
          Refresh
        </button>
      </header>

      {successMessage && (
        <div className="successNotice">
          <strong>Success:</strong> {successMessage}
        </div>
      )}

      {actionError && (
        <div className="errorNotice">
          <strong>Error:</strong> {actionError}
        </div>
      )}

      <section className="assignmentSummaryGrid">
        <article className="dashboardCard">
          <p>Total</p>
          <h2>{assignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{publishedAssignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Submitted</p>
          <h2>{submittedAssignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending</p>
          <h2>{pendingAssignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Closed</p>
          <h2>{closedAssignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Student Code</p>
          <h2>{assignmentData?.student?.student_code || "N/A"}</h2>
        </article>

        <article className="dashboardCard wideAssignmentCard">
          <p>Course</p>
          <h2>{assignmentData?.student?.enrolled_course || "Data Analysis"}</h2>
        </article>
      </section>

      <section className="dashboardPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Assignment List</h2>
            <p>Submit your work using a note, project link, or both.</p>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No assignment yet</h3>
            <p>
              No assignment has been published for you yet. Once your tutor or
              admin publishes one, it will appear here.
            </p>
          </div>
        ) : (
          <div className="assignmentStack">
            {assignments.map((assignment) => {
              const submission = assignment.student_submission;
              const isClosed = assignment.status === "closed";
              const isSubmitting = submittingId === assignment.id;

              return (
                <article className="assignmentBox" key={assignment.id}>
                  <div className="assignmentTop">
                    <div>
                      <h3>{assignment.title}</h3>
                      <p>{assignment.description || "No description provided."}</p>
                    </div>

                    <span className={`statusPill ${assignment.status}`}>
                      {assignment.status}
                    </span>
                  </div>

                  <div className="assignmentMeta">
                    <span>Tool: {assignment.tool || "General"}</span>
                    <span>Due: {formatDate(assignment.due_date)}</span>
                    <span>
                      Tutor:{" "}
                      {assignment.tutors?.profiles?.full_name ||
                        assignment.tutor_name ||
                        "Tutor not assigned"}
                    </span>
                  </div>

                  {submission ? (
                    <div className="submissionSummary">
                      <h4>Your Submission</h4>

                      <p>
                        <strong>Status:</strong>{" "}
                        <span className={`statusPill ${submission.status}`}>
                          {submission.status}
                        </span>
                      </p>

                      <p>
                        <strong>Submitted:</strong>{" "}
                        {formatDateTime(submission.submitted_at)}
                      </p>

                      {submission.submission_text && (
                        <p>
                          <strong>Note:</strong> {submission.submission_text}
                        </p>
                      )}

                      {submission.submission_link && (
                        <p>
                          <strong>Link:</strong>{" "}
                          <a
                            href={submission.submission_link}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open submitted work
                          </a>
                        </p>
                      )}

                      <p>
                        <strong>Score:</strong>{" "}
                        {submission.score ?? "Not graded yet"}
                      </p>

                      <p>
                        <strong>Feedback:</strong>{" "}
                        {submission.feedback || "No feedback yet"}
                      </p>
                    </div>
                  ) : (
                    <p className="mutedText">You have not submitted this yet.</p>
                  )}

                  {!isClosed ? (
                    <form
                      className="portalForm submissionForm"
                      onSubmit={(event) => {
                        event.preventDefault();
                        handleSubmitAssignment(assignment);
                      }}
                    >
                      <label>
                        Submission Note
                        <textarea
                          rows="3"
                          value={
                            submissionForms[assignment.id]?.submission_text || ""
                          }
                          onChange={(event) =>
                            handleSubmissionChange(
                              assignment.id,
                              "submission_text",
                              event.target.value
                            )
                          }
                          placeholder="Write a short note about your submission."
                        />
                      </label>

                      <label>
                        Submission Link
                        <input
                          type="url"
                          value={
                            submissionForms[assignment.id]?.submission_link || ""
                          }
                          onChange={(event) =>
                            handleSubmissionChange(
                              assignment.id,
                              "submission_link",
                              event.target.value
                            )
                          }
                          placeholder="Paste Google Drive, OneDrive, GitHub, or project link"
                        />
                      </label>

                      <button
                        className="tableActionBtn"
                        type="submit"
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? "Submitting..."
                          : submission
                          ? "Update Submission"
                          : "Submit Assignment"}
                      </button>
                    </form>
                  ) : (
                    <p className="mutedText">
                      This assignment is closed and can no longer be submitted.
                    </p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

export default StudentAssignments;