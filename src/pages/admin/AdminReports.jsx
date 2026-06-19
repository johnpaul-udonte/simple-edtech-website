function AdminReports() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Reports & Analytics</h1>
          <p>
            Export student progress, class balance, payments, assignments,
            quiz results, certificates, and tutor performance reports.
          </p>
        </div>

        <button>Export CSV</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Students Report</p>
          <h2>Ready</h2>
        </article>

        <article className="dashboardCard">
          <p>Payments Report</p>
          <h2>Ready</h2>
        </article>

        <article className="dashboardCard">
          <p>Assignment Report</p>
          <h2>Ready</h2>
        </article>

        <article className="dashboardCard">
          <p>Certificate Report</p>
          <h2>Ready</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Platform Analytics</h2>

        <table>
          <thead>
            <tr>
              <th>Report</th>
              <th>Description</th>
              <th>Format</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Student Progress</td>
              <td>Tracks progress by course, tool, class balance, and assignment status.</td>
              <td>CSV / Excel</td>
              <td>Available</td>
            </tr>

            <tr>
              <td>Payment Balance</td>
              <td>Shows confirmed payments, balances, overdue students, and restrictions.</td>
              <td>CSV / Excel</td>
              <td>Available</td>
            </tr>

            <tr>
              <td>Class Attendance</td>
              <td>Tracks scheduled, completed, missed, cancelled, and rescheduled classes.</td>
              <td>CSV / Excel</td>
              <td>Available</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminReports;