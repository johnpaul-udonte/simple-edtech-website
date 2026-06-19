const adminCards = [
  { label: "Total Students", value: "42" },
  { label: "Active Tutors", value: "5" },
  { label: "Pending Schedules", value: "13" },
  { label: "Overdue Payments", value: "7" },
  { label: "Open Assignments", value: "16" },
  { label: "Certificates Pending", value: "4" },
  { label: "Completed Classes", value: "218" },
  { label: "Missed Classes", value: "11" },
];

function AdminDashboard() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Admin Dashboard</h1>
          <p>
            Manage students, tutors, schedules, class balances, payments,
            assignments, quizzes, certificates, and reports.
          </p>
        </div>

        <button>Create Student</button>
      </div>

      <div className="dashboardGrid">
        {adminCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </div>

      <div className="dashboardPanel">
        <h2>Pending Schedule Approvals</h2>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Requested Slot</th>
              <th>Status</th>
              <th>Reschedules Used</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Faith E.</td>
              <td>Tuesday, 7:00 PM</td>
              <td>Pending Approval</td>
              <td>1 / 3</td>
            </tr>
            <tr>
              <td>John U.</td>
              <td>Saturday, 10:00 AM</td>
              <td>Pending Approval</td>
              <td>0 / 3</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminDashboard;