const tutorCards = [
  { label: "Assigned Students", value: "18" },
  { label: "Assignments Pending", value: "9" },
  { label: "Marked Assignments", value: "34" },
  { label: "Upcoming Classes", value: "6" },
  { label: "Quiz Questions Created", value: "120" },
  { label: "Materials Uploaded", value: "24" },
];

function TutorDashboard() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Tutor Dashboard</h1>
          <p>
            Manage assigned students, mark assignments, review quiz performance,
            upload materials, and send class notes.
          </p>
        </div>

        <button>Upload Material</button>
      </div>

      <div className="dashboardGrid">
        {tutorCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </div>

      <div className="dashboardPanel">
        <h2>Recent Assignment Submissions</h2>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Module</th>
              <th>Status</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Mary A.</td>
              <td>Excel</td>
              <td>Submitted</td>
              <td>Pending</td>
            </tr>
            <tr>
              <td>David O.</td>
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

export default TutorDashboard;