import { useEffect, useState } from "react";
import { getAssignmentsForAdmin } from "../../services/adminService";

function AdminAssignments() {
  const [assignments, setAssignments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadAssignments() {
      const { data, error } = await getAssignmentsForAdmin();

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setAssignments(data || []);
      setIsLoading(false);
    }

    loadAssignments();
  }, []);

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
      </section>
    );
  }

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
      assignment_due_date: assignment.due_date,
      tutor_name: assignment.tutors?.profiles?.full_name || "Tutor not assigned",
    }))
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
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

  const today = new Date().toISOString().slice(0, 10);

  const overdueAssignments = assignments.filter((assignment) => {
    return (
      assignment.due_date &&
      assignment.due_date < today &&
      assignment.status === "published"
    );
  });

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Assignment Monitoring</h1>
          <p>
            Monitor tutor-created assignments, student submissions, pending
            grading, scores, feedback, and overdue assignment activity.
          </p>
        </div>

        <button>Export Report</button>
      </div>

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
          <h2>{submittedSubmissions.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Graded</p>
          <h2>{gradedSubmissions.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Average Score</p>
          <h2>{averageScore}%</h2>
        </article>

        <article className="dashboardCard">
          <p>Overdue Published</p>
          <h2>{overdueAssignments.length}</h2>
        </article>
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

                    <td>
                      {assignment.tutors?.profiles?.full_name ||
                        "Tutor not assigned"}
                      <br />
                      <small>
                        {assignment.tutors?.profiles?.email || "-"}
                      </small>
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
        <h2>Submission Monitoring</h2>

        {allSubmissions.length === 0 ? (
          <p>No assignment submissions yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Assignment</th>
                <th>Tutor</th>
                <th>Tool</th>
                <th>Status</th>
                <th>Score</th>
                <th>Submitted At</th>
                <th>Feedback</th>
              </tr>
            </thead>

            <tbody>
              {allSubmissions.map((submission) => (
                <tr key={submission.id}>
                  <td>
                    {submission.students?.profiles?.full_name || "Student"}
                    <br />
                    <small>{submission.students?.student_code || "-"}</small>
                  </td>

                  <td>{submission.assignment_title}</td>

                  <td>{submission.tutor_name}</td>

                  <td>{submission.assignment_tool || "General"}</td>

                  <td>
                    <span className={`statusPill ${submission.status}`}>
                      {submission.status}
                    </span>
                  </td>

                  <td>{submission.score ?? "Not graded"}</td>

                  <td>
                    {submission.submitted_at
                      ? new Date(submission.submitted_at).toLocaleString()
                      : "-"}
                  </td>

                  <td>{submission.feedback || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Admin Assignment Rules</h2>
        <p>
          Assignments created by tutors appear here automatically. Submissions
          with status <strong>submitted</strong> are awaiting tutor grading.
          Submissions marked as <strong>graded</strong> have scores and feedback
          visible to the student.
        </p>
      </div>
    </section>
  );
}

export default AdminAssignments;