import { useEffect, useMemo, useState } from "react";
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

function getAssignmentStatusLabel(status) {
  const labels = {
    published: "Published",
    draft: "Draft",
    closed: "Closed",
  };

  return labels[status] || status || "-";
}

function getSubmissionStatusLabel(status) {
  const labels = {
    submitted: "Submitted",
    graded: "Graded",
  };

  return labels[status] || status || "Not Submitted";
}

function getStatusClass(status) {
  if (["published", "graded"].includes(status)) return "issued";
  if (["submitted", "draft"].includes(status)) return "pending";
  if (status === "closed") return "urgent";
  return "pending";
}

function StudentAssignments() {
  const { session, profile } = useAuth();

  const [assignmentData, setAssignmentData] = useState({
    assignments: [],
    student: null,
  });
  const [submissionForms, setSubmissionForms] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
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

  const assignments = useMemo(() => {
    return assignmentData?.assignments || [];
  }, [assignmentData]);

  const summary = useMemo(() => {
    const submittedAssignments = assignments.filter(
      (assignment) => assignment.student_submission
    );

    const gradedAssignments = assignments.filter(
      (assignment) => assignment.student_submission?.status === "graded"
    );

    const pendingAssignments = assignments.filter(
      (assignment) =>
        assignment.status !== "closed" && !assignment.student_submission
    );

    return {
      total: assignments.length,
      published: assignments.filter(
        (assignment) => assignment.status === "published"
      ).length,
      submitted: submittedAssignments.length,
      pending: pendingAssignments.length,
      graded: gradedAssignments.length,
      closed: assignments.filter((assignment) => assignment.status === "closed")
        .length,
    };
  }, [assignments]);

  const filteredAssignments = useMemo(() => {
    if (activeFilter === "all") return assignments;

    if (activeFilter === "pending") {
      return assignments.filter(
        (assignment) =>
          assignment.status !== "closed" && !assignment.student_submission
      );
    }

    if (activeFilter === "submitted") {
      return assignments.filter(
        (assignment) => assignment.student_submission?.status === "submitted"
      );
    }

    if (activeFilter === "graded") {
      return assignments.filter(
        (assignment) => assignment.student_submission?.status === "graded"
      );
    }

    if (activeFilter === "closed") {
      return assignments.filter((assignment) => assignment.status === "closed");
    }

    return assignments;
  }, [assignments, activeFilter]);

  function handleSubmissionChange(assignmentId, field, value) {
    setSuccessMessage("");
    setActionError("");

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
      <section className="studentAssignmentPage">
        <header className="dashboardHeader compactDashboardHeader">
          <div>
            <p className="eyebrow">Student Assignments</p>
            <h1>My Assignments</h1>
            <p>
              Something stopped your assignments from loading. Refresh the page
              and try again.
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
      </section>
    );
  }

  return (
    <section className="studentAssignmentPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Student Assignments</p>
          <h1>My Assignments</h1>
          <p>
            Welcome, {profile?.full_name || "Student"}. View assignments, submit
            your work, and track tutor scores and feedback.
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

      <section className="studentAssignmentSummaryGrid">
        <article className="dashboardCard">
          <p>Total</p>
          <h2>{summary.total}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{summary.published}</h2>
        </article>

        <article className="dashboardCard">
          <p>Submitted</p>
          <h2>{summary.submitted}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending</p>
          <h2>{summary.pending}</h2>
        </article>

        <article className="dashboardCard">
          <p>Graded</p>
          <h2>{summary.graded}</h2>
        </article>

        <article className="dashboardCard">
          <p>Closed</p>
          <h2>{summary.closed}</h2>
        </article>

        <article className="dashboardCard studentAssignmentInfoCard">
          <p>Student Code</p>
          <h2>{assignmentData?.student?.student_code || "N/A"}</h2>
        </article>

        <article className="dashboardCard studentAssignmentInfoCard">
          <p>Course</p>
          <h2>{assignmentData?.student?.enrolled_course || "Data Analysis"}</h2>
        </article>
      </section>

      <section className="studentAssignmentFilterBar">
        <button
          type="button"
          className={activeFilter === "all" ? "active" : ""}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>

        <button
          type="button"
          className={activeFilter === "pending" ? "active" : ""}
          onClick={() => setActiveFilter("pending")}
        >
          Pending
        </button>

        <button
          type="button"
          className={activeFilter === "submitted" ? "active" : ""}
          onClick={() => setActiveFilter("submitted")}
        >
          Submitted
        </button>

        <button
          type="button"
          className={activeFilter === "graded" ? "active" : ""}
          onClick={() => setActiveFilter("graded")}
        >
          Graded
        </button>

        <button
          type="button"
          className={activeFilter === "closed" ? "active" : ""}
          onClick={() => setActiveFilter("closed")}
        >
          Closed
        </button>
      </section>

      <section className="dashboardPanel studentAssignmentMainPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Assignment List</h2>
            <p>
              Submit your work using a note, project link, or both. Your tutor
              will review, score, and provide feedback.
            </p>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No assignment found</h3>
            <p>
              No assignment matches this filter yet. Published assignments will
              appear here once assigned to you.
            </p>
          </div>
        ) : (
          <div className="studentAssignmentStack">
            {filteredAssignments.map((assignment) => {
              const submission = assignment.student_submission;
              const isClosed = assignment.status === "closed";
              const isSubmitting = submittingId === assignment.id;

              return (
                <article className="studentAssignmentBox" key={assignment.id}>
                  <div className="studentAssignmentTop">
                    <div>
                      <p className="eyebrow">{assignment.tool || "General"}</p>
                      <h3>{assignment.title}</h3>
                      <p>{assignment.description || "No description provided."}</p>
                    </div>

                    <span
                      className={`statusPill ${getStatusClass(
                        assignment.status
                      )}`}
                    >
                      {getAssignmentStatusLabel(assignment.status)}
                    </span>
                  </div>

                  <div className="studentAssignmentMetaGrid">
                    <span>
                      <strong>Tool:</strong> {assignment.tool || "General"}
                    </span>

                    <span>
                      <strong>Due:</strong> {formatDate(assignment.due_date)}
                    </span>

                    <span>
                      <strong>Tutor:</strong>{" "}
                      {assignment.tutors?.profiles?.full_name ||
                        assignment.tutor_name ||
                        "Tutor not assigned"}
                    </span>

                    <span>
                      <strong>Submission:</strong>{" "}
                      {submission
                        ? getSubmissionStatusLabel(submission.status)
                        : "Not Submitted"}
                    </span>
                  </div>

                  {submission ? (
                    <div className="studentSubmissionSummary">
                      <h4>Your Submission</h4>

                      <div className="studentSubmissionGrid">
                        <p>
                          <strong>Status:</strong>{" "}
                          <span
                            className={`statusPill ${getStatusClass(
                              submission.status
                            )}`}
                          >
                            {getSubmissionStatusLabel(submission.status)}
                          </span>
                        </p>

                        <p>
                          <strong>Submitted:</strong>{" "}
                          {formatDateTime(submission.submitted_at)}
                        </p>

                        <p>
                          <strong>Score:</strong>{" "}
                          {submission.score ?? "Not graded yet"}
                        </p>

                        <p>
                          <strong>Feedback:</strong>{" "}
                          {submission.feedback || "No feedback yet"}
                        </p>
                      </div>

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
                    </div>
                  ) : (
                    <div className="studentSubmissionEmpty">
                      <strong>Not submitted yet</strong>
                      <p>Use the form below to submit your work.</p>
                    </div>
                  )}

                  {!isClosed ? (
                    <form
                      className="portalForm studentSubmissionForm"
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
                    <div className="studentSubmissionClosed">
                      This assignment is closed and can no longer be submitted.
                    </div>
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