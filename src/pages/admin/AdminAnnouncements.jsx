function AdminAnnouncements() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Announcements</h1>
          <p>
            Send announcements to all students, selected students, tutors,
            or specific course groups.
          </p>
        </div>

        <button>Send Announcement</button>
      </div>

      <div className="dashboardPanel">
        <h2>Announcement Log</h2>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Audience</th>
              <th>Created By</th>
              <th>Date</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Weekly practice reminder</td>
              <td>All Students</td>
              <td>Admin</td>
              <td>Today</td>
              <td>Sent</td>
            </tr>

            <tr>
              <td>Power BI assignment update</td>
              <td>Power BI Students</td>
              <td>Tutor</td>
              <td>Yesterday</td>
              <td>Sent</td>
            </tr>

            <tr>
              <td>Payment balance reminder</td>
              <td>Students With Balance</td>
              <td>Admin</td>
              <td>This Week</td>
              <td>Scheduled</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminAnnouncements;