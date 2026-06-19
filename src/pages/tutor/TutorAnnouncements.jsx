function TutorAnnouncements() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Announcements & Class Notes</h1>
          <p>Send class notes, reminders, learning tips, and announcements to assigned students.</p>
        </div>

        <button>Send Announcement</button>
      </div>

      <div className="dashboardPanel">
        <h2>Recent Announcements</h2>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Audience</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Power BI dashboard assignment reminder</td>
              <td>Assigned Students</td>
              <td>Today</td>
              <td>Sent</td>
            </tr>
            <tr>
              <td>Excel practice test opens this weekend</td>
              <td>Excel Students</td>
              <td>Yesterday</td>
              <td>Sent</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TutorAnnouncements;