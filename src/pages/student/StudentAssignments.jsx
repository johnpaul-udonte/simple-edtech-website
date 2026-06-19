function StudentAssignments() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Assignments</h1>
          <p>Submit assignments as text, file upload, or external project link.</p>
        </div>
        <button>Submit Assignment</button>
      </div>

      <div className="dashboardPanel">
        <h2>Current Assignments</h2>
        <table>
          <thead>
            <tr>
              <th>Assignment</th>
              <th>Tool</th>
              <th>Deadline</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Excel Sales Dashboard</td>
              <td>Excel</td>
              <td>Friday, 6:00 PM</td>
              <td>Submitted</td>
              <td>Pending</td>
            </tr>
            <tr>
              <td>Power BI KPI Report</td>
              <td>Power BI</td>
              <td>Monday, 8:00 PM</td>
              <td>Open</td>
              <td>-</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default StudentAssignments;