function AdminAssignments() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Assignment Management</h1>
          <p>
            Create assignments, monitor submissions, track late warnings,
            close overdue work, and review tutor marking activity.
          </p>
        </div>

        <button>Create Assignment</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Open Assignments</p>
          <h2>16</h2>
        </article>

        <article className="dashboardCard">
          <p>Submitted</p>
          <h2>29</h2>
        </article>

        <article className="dashboardCard">
          <p>Late Warnings</p>
          <h2>6</h2>
        </article>

        <article className="dashboardCard">
          <p>Closed / Not Collected</p>
          <h2>3</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Assignment Submissions</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Assignment</th>
              <th>Tool</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Excel Sales Dashboard</td>
              <td>Excel</td>
              <td>Submitted</td>
              <td>Pending</td>
            </tr>

            <tr>
              <td>David Okoro</td>
              <td>SQL Query Task</td>
              <td>SQL</td>
              <td>Late Warning</td>
              <td>-</td>
            </tr>

            <tr>
              <td>Faith Emmanuel</td>
              <td>Power BI KPI Report</td>
              <td>Power BI</td>
              <td>Marked</td>
              <td>88%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminAssignments;