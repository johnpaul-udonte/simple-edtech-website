function AdminCertificates() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Certificate Management</h1>
          <p>
            Generate, approve, release, and export certificate records for
            Excel, Power BI, SQL, and Python.
          </p>
        </div>

        <button>Generate Certificate</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Certificates Earned</p>
          <h2>21</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Approval</p>
          <h2>4</h2>
        </article>

        <article className="dashboardCard">
          <p>Released</p>
          <h2>17</h2>
        </article>

        <article className="dashboardCard">
          <p>Tools Covered</p>
          <h2>4</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Certificate Records</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Certificate</th>
              <th>Completion Status</th>
              <th>Approval</th>
              <th>Release Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Excel Certificate</td>
              <td>Completed</td>
              <td>Approved</td>
              <td>Released</td>
            </tr>

            <tr>
              <td>David Okoro</td>
              <td>Power BI Certificate</td>
              <td>Completed</td>
              <td>Pending</td>
              <td>Not Released</td>
            </tr>

            <tr>
              <td>Faith Emmanuel</td>
              <td>SQL Certificate</td>
              <td>In Progress</td>
              <td>-</td>
              <td>Locked</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminCertificates;