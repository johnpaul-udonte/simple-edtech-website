import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createAssignmentForTutor,
  getTutorAssignmentsForCurrentUser,
  gradeAssignmentSubmission,
} from "../../services/tutorService";

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

function getStatusLabel(status) {
  const labels = {
    published: "Published",
    draft: "Draft",
    closed: "Closed",
    submitted: "Submitted",
    graded: "Graded",
  };

  return labels[status] || status || "-";
}

function getStatusClass(status) {
  if (["published", "graded"].includes(status)) return "issued";
  if (["draft", "submitted"].includes(status)) return "pending";
  if (status === "closed") return "urgent";
  return "pending";
}

function TutorAssignments() {
  const { session, profile } = useAuth();

  const [assignmentData, setAssignmentData] = useState(null);
  const [gradingForms, setGradingForms] = useState({});
  const [activeAssignmentFilter, setActiveAssignmentFilter] = useState("all");
  const [activeSubmissionFilter, setActiveSubmissionFilter] = useState("all");
  const [showCreateForm, setShowCreateForm] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [gradingId, setGradingId] = useState("");

  const [assignmentForm, setAssignmentForm] = useState({
    title: "",
    description: "",
    tool: "Excel",
    due_date: "",
    status: "published",
  });

  async function loadTutorAssignments() {
    setIsLoading(true);
    setNotice("");
    setActionError("");

    if (!session?.user?.id) {
      setNotice("No active tutor session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getTutorAssignmentsForCurrentUser(
      session.user.id
    );

    if (error) {
      setNotice(error.message || "Could not load tutor assignments.");
      setIsLoading(false);
      return;
    }

    setAssignmentData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadTutorAssignments();
  }, [session?.user?.id]);

  const assignments = useMemo(() => {
    return assignmentData?.assignments || [];
  }, [assignmentData]);

  const allSubmissions = useMemo(() => {
    return assignments.flatMap((assignment) =>
      (assignment.assignment_submissions || []).map((submission) => ({
        ...submission,
        assignment_title: assignment.title,
        assignment_tool: assignment.tool,
      }))
    );
  }, [assignments]);

  const summary = useMemo(() => {
    return {
      totalAssignments: assignments.length,
      published: assignments.filter(
        (assignment) => assignment.status === "published"
      ).length,
      drafts: assignments.filter((assignment) => assignment.status === "draft")
        .length,
      closed: assignments.filter((assignment) => assignment.status === "closed")
        .length,
      totalSubmissions: allSubmissions.length,
      pendingGrading: allSubmissions.filter(
        (submission) => submission.status === "submitted"
      ).length,
      graded: allSubmissions.filter((submission) => submission.status === "graded")
        .length,
    };
  }, [assignments, allSubmissions]);

  const filteredAssignments = useMemo(() => {
    if (activeAssignmentFilter === "all") return assignments;

    return assignments.filter(
      (assignment) => assignment.status === activeAssignmentFilter
    );
  }, [assignments, activeAssignmentFilter]);

  const filteredSubmissions = useMemo(() => {
    if (activeSubmissionFilter === "all") return allSubmissions;

    return allSubmissions.filter(
      (submission) => submission.status === activeSubmissionFilter
    );
  }, [allSubmissions, activeSubmissionFilter]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setAssignmentForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleGradeChange(submissionId, field, value) {
    setGradingForms((current) => ({
      ...current,
      [submissionId]: {
        ...current[submissionId],
        [field]: value,
      },
    }));
  }

  async function handleCreateAssignment(event) {
    event.preventDefault();

    setSuccessMessage("");
    setActionError("");

    if (!assignmentForm.title.trim()) {
      setActionError("Assignment title is required.");
      return;
    }

    if (!assignmentForm.due_date) {
      setActionError("Due date is required.");
      return;
    }

    const userId = session?.user?.id;

    if (!userId) {
      setActionError("Tutor session not found. Please log in again.");
      return;
    }

    setIsCreating(true);

    const { error } = await createAssignmentForTutor(userId, assignmentForm);

    if (error) {
      setActionError(error.message || "Could not create assignment.");
      setIsCreating(false);
      return;
    }

    setSuccessMessage("Assignment created successfully.");

    setAssignmentForm({
      title: "",
      description: "",
      tool: "Excel",
      due_date: "",
      status: "published",
    });

    await loadTutorAssignments();
    setIsCreating(false);
  }

  async function handleGradeSubmission(submission) {
    setSuccessMessage("");
    setActionError("");
    setGradingId(submission.id);

    const userId = session?.user?.id;

    if (!userId) {
      setActionError("Tutor session not found. Please log in again.");
      setGradingId("");
      return;
    }

    const form = gradingForms[submission.id] || {};
    const score = form.score ?? submission.score ?? "";
    const feedback = form.feedback ?? submission.feedback ?? "";

    if (score !== "" && (Number(score) < 0 || Number(score) > 100)) {
      setActionError("Score must be between 0 and 100.");
      setGradingId("");
      return;
    }

    const { error } = await gradeAssignmentSubmission(userId, submission.id, {
      score,
      feedback,
    });

    if (error) {
      setActionError(error.message || "Could not save grade.");
      setGradingId("");
      return;
    }

    setSuccessMessage("Submission graded successfully.");
    setGradingForms({});
    await loadTutorAssignments();
    setGradingId("");
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading assignments...</h2>
        <p>Please wait while your assignments and submissions are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Assignment issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  return (
    <section className="tutorAssignmentsPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Assignments</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. Create assignments, review
            submitted work, grade students, and give clear feedback.
          </p>
        </div>

        <div className="headerActionGroup">
          <button type="button" onClick={() => setShowCreateForm((value) => !value)}>
            {showCreateForm ? "Hide Form" : "Create Assignment"}
          </button>

          <button type="button" className="headerSecondaryBtn" onClick={loadTutorAssignments}>
            Refresh
          </button>
        </div>
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

      <section className="tutorAssignmentsSummaryGrid">
        <article className="dashboardCard">
          <p>Total Assignments</p>
          <h2>{summary.totalAssignments}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{summary.published}</h2>
        </article>

        <article className="dashboardCard">
          <p>Drafts</p>
          <h2>{summary.drafts}</h2>
        </article>

        <article className="dashboardCard">
          <p>Closed</p>
          <h2>{summary.closed}</h2>
        </article>

        <article className="dashboardCard">
          <p>Total Submissions</p>
          <h2>{summary.totalSubmissions}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Grading</p>
          <h2>{summary.pendingGrading}</h2>
        </article>

        <article className="dashboardCard">
          <p>Graded</p>
          <h2>{summary.graded}</h2>
        </article>

        <article className="dashboardCard">
          <p>Specialisation</p>
          <h2>{assignmentData?.tutor?.specialisation || "Not set"}</h2>
        </article>
      </section>

      {showCreateForm && (
        <section className="dashboardPanel tutorAssignmentCreatePanel">
          <div className="panelHeaderRow">
            <div>
              <h2>Create New Assignment</h2>
              <p>
                Add a task for your assigned students. Published assignments can
                be seen by students immediately.
              </p>
            </div>
          </div>

          <form className="portalForm tutorAssignmentForm" onSubmit={handleCreateAssignment}>
            <div className="formGrid">
              <label>
                Assignment Title
                <input
                  type="text"
                  name="title"
                  value={assignmentForm.title}
                  onChange={handleFormChange}
                  placeholder="Example: Excel Sales Analysis Assignment"
                />
              </label>

              <label>
                Tool
                <select
                  name="tool"
                  value={assignmentForm.tool}
                  onChange={handleFormChange}
                >
                  <option value="Excel">Excel</option>
                  <option value="Power BI">Power BI</option>
                  <option value="SQL">SQL</option>
                  <option value="Python">Python</option>
                  <option value="General">General</option>
                </select>
              </label>

              <label>
                Due Date
                <input
                  type="date"
                  name="due_date"
                  value={assignmentForm.due_date}
                  onChange={handleFormChange}
                />
              </label>

              <label>
                Status
                <select
                  name="status"
                  value={assignmentForm.status}
                  onChange={handleFormChange}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                </select>
              </label>
            </div>

            <label>
              Description / Instruction
              <textarea
                name="description"
                value={assignmentForm.description}
                onChange={handleFormChange}
                rows="5"
                placeholder="Explain what the student should do and submit."
              />
            </label>

            <button className="tableActionBtn" type="submit" disabled={isCreating}>
              {isCreating ? "Creating..." : "Create Assignment"}
            </button>
          </form>
        </section>
      )}

      <section className="tutorAssignmentFilterBar">
        <button
          type="button"
          className={activeAssignmentFilter === "all" ? "active" : ""}
          onClick={() => setActiveAssignmentFilter("all")}
        >
          All Assignments
        </button>

        <button
          type="button"
          className={activeAssignmentFilter === "published" ? "active" : ""}
          onClick={() => setActiveAssignmentFilter("published")}
        >
          Published
        </button>

        <button
          type="button"
          className={activeAssignmentFilter === "draft" ? "active" : ""}
          onClick={() => setActiveAssignmentFilter("draft")}
        >
          Drafts
        </button>

        <button
          type="button"
          className={activeAssignmentFilter === "closed" ? "active" : ""}
          onClick={() => setActiveAssignmentFilter("closed")}
        >
          Closed
        </button>
      </section>

      <section className="dashboardPanel tutorAssignmentTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Assignment List</h2>
            <p>
              Monitor assignment status, due dates, submissions, pending grading,
              and graded work.
            </p>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No assignment found</h3>
            <p>No assignment matches this filter yet.</p>
          </div>
        ) : (
          <div className="tutorAssignmentTableWrap">
            <table className="tutorAssignmentTable">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Tool</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th>Submissions</th>
                  <th>Pending</th>
                  <th>Graded</th>
                </tr>
              </thead>

              <tbody>
                {filteredAssignments.map((assignment) => {
                  const submissions = assignment.assignment_submissions || [];
                  const pending = submissions.filter(
                    (submission) => submission.status === "submitted"
                  );
                  const graded = submissions.filter(
                    (submission) => submission.status === "graded"
                  );

                  return (
                    <tr key={assignment.id}>
                      <td>
                        <strong>{assignment.title}</strong>
                        <small>{assignment.description || "No description"}</small>
                      </td>

                      <td>{assignment.tool || "General"}</td>

                      <td>{formatDate(assignment.due_date)}</td>

                      <td>
                        <span className={`statusPill ${getStatusClass(assignment.status)}`}>
                          {getStatusLabel(assignment.status)}
                        </span>
                      </td>

                      <td>{submissions.length}</td>
                      <td>{pending.length}</td>
                      <td>{graded.length}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="tutorSubmissionFilterBar">
        <button
          type="button"
          className={activeSubmissionFilter === "all" ? "active" : ""}
          onClick={() => setActiveSubmissionFilter("all")}
        >
          All Submissions
        </button>

        <button
          type="button"
          className={activeSubmissionFilter === "submitted" ? "active" : ""}
          onClick={() => setActiveSubmissionFilter("submitted")}
        >
          Pending Grading
        </button>

        <button
          type="button"
          className={activeSubmissionFilter === "graded" ? "active" : ""}
          onClick={() => setActiveSubmissionFilter("graded")}
        >
          Graded
        </button>
      </section>

      <section className="dashboardPanel tutorSubmissionPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Grade Submissions</h2>
            <p>
              Review student work, open submitted links, enter scores, and send
              feedback.
            </p>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No submission found</h3>
            <p>No student submission matches this filter yet.</p>
          </div>
        ) : (
          <div className="tutorSubmissionStack">
            {filteredSubmissions.map((submission) => {
              const isGrading = gradingId === submission.id;

              return (
                <article className="tutorSubmissionBox" key={submission.id}>
                  <div className="tutorSubmissionTop">
                    <div>
                      <p className="eyebrow">{submission.assignment_tool || "General"}</p>
                      <h3>{submission.assignment_title}</h3>
                      <p>
                        {submission.students?.profiles?.full_name || "Student"}{" "}
                        | {submission.students?.student_code || "-"}
                      </p>
                    </div>

                    <span className={`statusPill ${getStatusClass(submission.status)}`}>
                      {getStatusLabel(submission.status)}
                    </span>
                  </div>

                  <div className="tutorSubmissionMetaGrid">
                    <span>
                      <strong>Submitted:</strong>{" "}
                      {formatDateTime(submission.submitted_at)}
                    </span>
                    <span>
                      <strong>Score:</strong>{" "}
                      {submission.score ?? "Not graded"}
                    </span>
                    <span>
                      <strong>Status:</strong> {getStatusLabel(submission.status)}
                    </span>
                  </div>

                  <div className="tutorSubmissionContent">
                    <h4>Student Work</h4>

                    <p>
                      <strong>Note:</strong>{" "}
                      {submission.submission_text || "No note submitted."}
                    </p>

                    {submission.submission_link ? (
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
                    ) : (
                      <p>
                        <strong>Link:</strong> No submission link provided.
                      </p>
                    )}

                    <p>
                      <strong>Current Feedback:</strong>{" "}
                      {submission.feedback || "No feedback yet."}
                    </p>
                  </div>

                  <form
                    className="portalForm tutorSubmissionForm"
                    onSubmit={(event) => {
                      event.preventDefault();
                      handleGradeSubmission(submission);
                    }}
                  >
                    <div className="formGrid">
                      <label>
                        Score / 100
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={
                            gradingForms[submission.id]?.score ??
                            submission.score ??
                            ""
                          }
                          onChange={(event) =>
                            handleGradeChange(
                              submission.id,
                              "score",
                              event.target.value
                            )
                          }
                          placeholder="Example: 85"
                        />
                      </label>

                      <label>
                        Status
                        <input type="text" value="graded" readOnly />
                      </label>
                    </div>

                    <label>
                      Feedback
                      <textarea
                        rows="4"
                        value={
                          gradingForms[submission.id]?.feedback ??
                          submission.feedback ??
                          ""
                        }
                        onChange={(event) =>
                          handleGradeChange(
                            submission.id,
                            "feedback",
                            event.target.value
                          )
                        }
                        placeholder="Give clear feedback to the student."
                      />
                    </label>

                    <button
                      className="tableActionBtn"
                      type="submit"
                      disabled={isGrading}
                    >
                      {isGrading ? "Saving Grade..." : "Save Grade"}
                    </button>
                  </form>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}

export default TutorAssignments;