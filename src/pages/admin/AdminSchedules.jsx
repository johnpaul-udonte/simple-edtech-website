function AdminSchedules() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Schedule Approval</h1>
          <p>
            Approve student-selected class slots, prevent overbooking, track reschedules,
            and manage class statuses.
          </p>
        </div>

        <button>Create Class Slot</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Pending Approvals</p>
          <h2>13</h2>
        </article>

        <article className="dashboardCard">
          <p>Approved Classes</p>
          <h2>28</h2>
        </article>

        <article className="dashboardCard">
          <p>Reschedules This Month</p>
          <h2>7</h2>
        </article>

        <article className="dashboardCard">
          <p>Missed Classes</p>
          <h2>11</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Pending Schedule Requests</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Requested Slot</th>
              <th>Tutor</th>
              <th>Reschedules Used</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Tuesday, 7:00 PM</td>
              <td>Mr John</td>
              <td>1 / 3</td>
              <td>Pending</td>
            </tr>

            <tr>
              <td>David Okoro</td>
              <td>Saturday, 10:00 AM</td>
              <td>Mrs Grace</td>
              <td>0 / 3</td>
              <td>Pending</td>
            </tr>

            <tr>
              <td>Faith Emmanuel</td>
              <td>Thursday, 6:00 PM</td>
              <td>Mr Daniel</td>
              <td>2 / 3</td>
              <td>Pending</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminSchedules;