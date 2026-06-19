function TutorAssignments() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Assignment Marking</h1>
          <p>Review student submissions, add scores, give written feedback, and request one resubmission where necessary.</p>
        </div>

        <button>Create Assignment</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Pending Review</p>
          <h2>9</h2>
        </article>

        <article className="dashboardCard">
          <p>Marked This Week</p>
          <h2>14</h2>
        </article>

        <article className="dashboardCard">
          <p>Late Warnings</p>
          <h2>3</h2>
        </article>

        <article className="dashboardCard">
          <p>Resubmissions</p>
          <h2>2</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Recent Submissions</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Assignment</th>
              <th>Submission Type</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Excel Sales Dashboard</td>
              <td>File Upload</td>
              <td>Submitted</td>
              <td>Pending</td>
            </tr>
            <tr>
              <td>David Okoro</td>
              <td>SQL Query Task</td>
              <td>External Link</td>
              <td>Resubmission Required</td>
              <td>55%</td>
            </tr>
            <tr>
              <td>Faith Emmanuel</td>
              <td>Power BI Report</td>
              <td>File Upload</td>
              <td>Marked</td>
              <td>88%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TutorAssignments;