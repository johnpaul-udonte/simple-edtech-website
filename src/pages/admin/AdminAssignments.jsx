import { useEffect, useMemo, useState } from "react";
import { getAssignmentsForAdmin } from "../../services/adminService";

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

function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [activeAssignmentFilter, setActiveAssignmentFilter] = useState("all");
  const [activeSubmissionFilter, setActiveSubmissionFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadAssignments() {
    setIsLoading(true);
    setNotice("");

    const { data, error } = await getAssignmentsForAdmin();

    if (error) {
      setNotice(error.message || "Could not load assignments.");
      setIsLoading(false);
      return;
    }

    setAssignments(data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadAssignments();
  }, []);

  const allSubmissions = useMemo(() => {
    return assignments.flatMap((assignment) =>
      (assignment.assignment_submissions || []).map((submission) => ({
        ...submission,
        assignment_title: assignment.title,
        assignment_tool: assignment.tool,
        assignment_due_date: assignment.due_date,
        assignment_status: assignment.status,
        tutor_name:
          assignment.tutors?.profiles?.full_name || "Tutor not assigned",
        tutor_email: assignment.tutors?.profiles?.email || "-",
      }))
    );
  }, [assignments]);

  const summary = useMemo(() => {
    const publishedAssignments = assignments.filter(
      (assignment) => assignment.status === "published"
    );

    const draftAssignments = assignments.filter(
      (assignment) => assignment.status === "draft"
    );

    const closedAssignments = assignments.filter(
      (assignment) => assignment.status === "closed"
    );

    const submittedSubmissions = allSubmissions.filter(
      (submission) => submission.status === "submitted"
    );

    const gradedSubmissions = allSubmissions.filter(
      (submission) => submission.status === "graded"
    );

    const scores = gradedSubmissions
      .map((submission) => Number(submission.score))
      .filter((score) => !Number.isNaN(score));

    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length
          )
        : 0;

    const today = new Date().toISOString().slice(0, 10);

    const overdueAssignments = assignments.filter((assignment) => {
      return (
        assignment.due_date &&
        assignment.due_date < today &&
        assignment.status === "published"
      );
    });

    return {
      totalAssignments: assignments.length,
      published: publishedAssignments.length,
      drafts: draftAssignments.length,
      closed: closedAssignments.length,
      totalSubmissions: allSubmissions.length,
      pendingGrading: submittedSubmissions.length,
      graded: gradedSubmissions.length,
      averageScore,
      overdue: overdueAssignments.length,
    };
  }, [assignments, allSubmissions]);

  const filteredAssignments = useMemo(() => {
    if (activeAssignmentFilter === "all") return assignments;

    if (activeAssignmentFilter === "overdue") {
      const today = new Date().toISOString().slice(0, 10);

      return assignments.filter(
        (assignment) =>
          assignment.due_date &&
          assignment.due_date < today &&
          assignment.status === "published"
      );
    }

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

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading assignments...</h2>
        <p>Please wait while assignment records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Admin assignment issue</h2>
        <p>{notice}</p>
        <button type="button" className="tableActionBtn" onClick={loadAssignments}>
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="adminAssignmentsPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Assignment Monitoring</h1>
          <p>
            Monitor tutor-created assignments, student submissions, pending
            grading, scores, feedback, and overdue assignment activity.
          </p>
        </div>

        <div className="headerActionGroup">
          <button type="button" onClick={loadAssignments}>
            Refresh
          </button>

          <button
            type="button"
            className="headerSecondaryBtn"
            onClick={() => window.print()}
          >
            Print Report
          </button>
        </div>
      </header>

      <section className="adminAssignmentsSummaryGrid">
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
          <p>Average Score</p>
          <h2>{summary.averageScore}%</h2>
        </article>

        <article className="dashboardCard">
          <p>Overdue Published</p>
          <h2>{summary.overdue}</h2>
        </article>
      </section>

      <section className="adminAssignmentFilterBar">
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

        <button
          type="button"
          className={activeAssignmentFilter === "overdue" ? "active" : ""}
          onClick={() => setActiveAssignmentFilter("overdue")}
        >
          Overdue
        </button>
      </section>

      <section className="dashboardPanel adminAssignmentTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Assignment List</h2>
            <p>
              Review all assignments created by tutors, their due dates,
              submission counts, and grading progress.
            </p>
          </div>
        </div>

        {filteredAssignments.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No assignment found</h3>
            <p>No assignment matches this filter yet.</p>
          </div>
        ) : (
          <div className="adminAssignmentTableWrap">
            <table className="adminAssignmentTable">
              <thead>
                <tr>
                  <th>Assignment</th>
                  <th>Tutor</th>
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
                        <small>
                          {assignment.description || "No description"}
                        </small>
                      </td>

                      <td>
                        <strong>
                          {assignment.tutors?.profiles?.full_name ||
                            "Tutor not assigned"}
                        </strong>
                        <small>{assignment.tutors?.profiles?.email || "-"}</small>
                      </td>

                      <td>{assignment.tool || "General"}</td>

                      <td>{formatDate(assignment.due_date)}</td>

                      <td>
                        <span
                          className={`statusPill ${getStatusClass(
                            assignment.status
                          )}`}
                        >
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

      <section className="adminSubmissionFilterBar">
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

      <section className="dashboardPanel adminSubmissionTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Submission Monitoring</h2>
            <p>
              View student submissions, submitted links, tutor feedback, and
              grading status.
            </p>
          </div>
        </div>

        {filteredSubmissions.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No submission found</h3>
            <p>No submission matches this filter yet.</p>
          </div>
        ) : (
          <div className="adminSubmissionTableWrap">
            <table className="adminSubmissionTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Assignment</th>
                  <th>Tutor</th>
                  <th>Tool</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Submitted At</th>
                  <th>Work Link</th>
                  <th>Feedback</th>
                </tr>
              </thead>

              <tbody>
                {filteredSubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td>
                      <strong>
                        {submission.students?.profiles?.full_name || "Student"}
                      </strong>
                      <small>{submission.students?.student_code || "-"}</small>
                    </td>

                    <td>
                      <strong>{submission.assignment_title}</strong>
                      <small>Due: {formatDate(submission.assignment_due_date)}</small>
                    </td>

                    <td>
                      <strong>{submission.tutor_name}</strong>
                      <small>{submission.tutor_email || "-"}</small>
                    </td>

                    <td>{submission.assignment_tool || "General"}</td>

                    <td>
                      <span
                        className={`statusPill ${getStatusClass(
                          submission.status
                        )}`}
                      >
                        {getStatusLabel(submission.status)}
                      </span>
                    </td>

                    <td>{submission.score ?? "Not graded"}</td>

                    <td>{formatDateTime(submission.submitted_at)}</td>

                    <td>
                      {submission.submission_link ? (
                        <a
                          href={submission.submission_link}
                          target="_blank"
                          rel="noreferrer"
                          className="tableLink"
                        >
                          Open Work
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{submission.feedback || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboardPanel adminAssignmentRulesPanel">
        <h2>Admin Assignment Rules</h2>
        <p>
          Assignments created by tutors appear here automatically. Submissions
          marked as <strong>Submitted</strong> are awaiting tutor grading.
          Submissions marked as <strong>Graded</strong> already have scores and
          feedback visible to the student.
        </p>
      </section>
    </section>
  );
}

export default AdminAssignments;