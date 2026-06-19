import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createAssignmentForTutor,
  getTutorAssignmentsForCurrentUser,
  gradeAssignmentSubmission,
} from "../../services/tutorService";

function TutorAssignments() {
  const { session, profile } = useAuth();

  const [assignmentData, setAssignmentData] = useState(null);
  const [gradingForms, setGradingForms] = useState({});
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
    if (!session?.user?.id) {
      setNotice("No active tutor session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getTutorAssignmentsForCurrentUser(
      session.user.id
    );

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setAssignmentData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadTutorAssignments();
  }, [session]);

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
      setActionError(error.message);
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

    const { error } = await gradeAssignmentSubmission(userId, submission.id, {
      score,
      feedback,
    });

    if (error) {
      setActionError(error.message);
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

  const assignments = assignmentData?.assignments || [];

  const publishedAssignments = assignments.filter(
    (assignment) => assignment.status === "published"
  );

  const draftAssignments = assignments.filter(
    (assignment) => assignment.status === "draft"
  );

  const closedAssignments = assignments.filter(
    (assignment) => assignment.status === "closed"
  );

  const allSubmissions = assignments.flatMap((assignment) =>
    (assignment.assignment_submissions || []).map((submission) => ({
      ...submission,
      assignment_title: assignment.title,
      assignment_tool: assignment.tool,
    }))
  );

  const pendingSubmissions = allSubmissions.filter(
    (submission) => submission.status === "submitted"
  );

  const gradedSubmissions = allSubmissions.filter(
    (submission) => submission.status === "graded"
  );

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Assignments</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. Create assignments, view
            submitted work, grade students, and give feedback.
          </p>
        </div>

        <button>Create Assignment</button>
      </div>

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

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Assignments</p>
          <h2>{assignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{publishedAssignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Drafts</p>
          <h2>{draftAssignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Closed</p>
          <h2>{closedAssignments.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Total Submissions</p>
          <h2>{allSubmissions.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Grading</p>
          <h2>{pendingSubmissions.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Graded</p>
          <h2>{gradedSubmissions.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Specialisation</p>
          <h2>{assignmentData?.tutor?.specialisation || "Not set"}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Create New Assignment</h2>

        <form className="portalForm" onSubmit={handleCreateAssignment}>
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
      </div>

      <div className="dashboardPanel">
        <h2>Assignment List</h2>

        {assignments.length === 0 ? (
          <p>No assignments have been created yet.</p>
        ) : (
          <table>
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
              {assignments.map((assignment) => {
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
                      <br />
                      <small>{assignment.description || "No description"}</small>
                    </td>

                    <td>{assignment.tool || "General"}</td>

                    <td>{assignment.due_date || "-"}</td>

                    <td>
                      <span className={`statusPill ${assignment.status}`}>
                        {assignment.status}
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
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Grade Submissions</h2>

        {allSubmissions.length === 0 ? (
          <p>No student submissions yet.</p>
        ) : (
          <div className="assignmentStack">
            {allSubmissions.map((submission) => {
              const isGrading = gradingId === submission.id;

              return (
                <article className="assignmentBox" key={submission.id}>
                  <div className="assignmentTop">
                    <div>
                      <h3>{submission.assignment_title}</h3>
                      <p>
                        {submission.students?.profiles?.full_name || "Student"}{" "}
                        | {submission.students?.student_code || "-"}
                      </p>
                    </div>

                    <span className={`statusPill ${submission.status}`}>
                      {submission.status}
                    </span>
                  </div>

                  <div className="assignmentMeta">
                    <span>Tool: {submission.assignment_tool || "General"}</span>
                    <span>
                      Submitted:{" "}
                      {submission.submitted_at
                        ? new Date(submission.submitted_at).toLocaleString()
                        : "-"}
                    </span>
                    <span>Score: {submission.score ?? "Not graded"}</span>
                  </div>

                  <div className="submissionSummary">
                    <h4>Student Work</h4>

                    <p>
                      <strong>Note:</strong>{" "}
                      {submission.submission_text || "No note submitted."}
                    </p>

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
                      <strong>Current Feedback:</strong>{" "}
                      {submission.feedback || "No feedback yet."}
                    </p>
                  </div>

                  <form
                    className="portalForm submissionForm"
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
                        <input
                          type="text"
                          value="graded"
                          readOnly
                        />
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
      </div>
    </section>
  );
}

export default TutorAssignments;