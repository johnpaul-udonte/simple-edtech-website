function TutorSchedule() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Upcoming Classes</h1>
          <p>View approved student classes and upcoming sessions. Schedule approval remains an admin responsibility.</p>
        </div>
      </div>

      <div className="dashboardPanel">
        <h2>Class Schedule</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Tool</th>
              <th>Date</th>
              <th>Time</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Power BI</td>
              <td>Tuesday</td>
              <td>7:00 PM - 8:00 PM</td>
              <td>Approved</td>
            </tr>
            <tr>
              <td>David Okoro</td>
              <td>SQL</td>
              <td>Saturday</td>
              <td>10:00 AM - 11:00 AM</td>
              <td>Approved</td>
            </tr>
            <tr>
              <td>Faith Emmanuel</td>
              <td>Python</td>
              <td>Sunday</td>
              <td>4:00 PM - 5:00 PM</td>
              <td>Scheduled</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TutorSchedule;