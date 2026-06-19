function StudentSchedule() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Schedule Booking</h1>
          <p>Choose two 1-hour class sessions per week from available slots.</p>
        </div>
        <button>Request Schedule</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Classes Completed</p>
          <h2>7</h2>
        </article>
        <article className="dashboardCard">
          <p>Classes Remaining</p>
          <h2>17</h2>
        </article>
        <article className="dashboardCard">
          <p>Reschedules Used</p>
          <h2>1 / 3</h2>
        </article>
        <article className="dashboardCard">
          <p>Pending Approval</p>
          <h2>2</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Available Class Slots</h2>
        <table>
          <thead>
            <tr>
              <th>Day</th>
              <th>Time</th>
              <th>Tutor</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tuesday</td>
              <td>7:00 PM - 8:00 PM</td>
              <td>Assigned Tutor</td>
              <td>Available</td>
            </tr>
            <tr>
              <td>Saturday</td>
              <td>10:00 AM - 11:00 AM</td>
              <td>Assigned Tutor</td>
              <td>Available</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default StudentSchedule;