function TutorStudents() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Assigned Students</h1>
          <p>
            View assigned students, their progress, class balance, assignment
            status, quiz performance, and learning activity.
          </p>
        </div>

        <button>Export Students</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Assigned Students</p>
          <h2>18</h2>
        </article>

        <article className="dashboardCard">
          <p>Active Students</p>
          <h2>15</h2>
        </article>

        <article className="dashboardCard">
          <p>Students Behind</p>
          <h2>3</h2>
        </article>

        <article className="dashboardCard">
          <p>Average Progress</p>
          <h2>68%</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Student List</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Progress</th>
              <th>Classes Left</th>
              <th>Assignment Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Data Analysis</td>
              <td>72%</td>
              <td>17</td>
              <td>Submitted</td>
            </tr>

            <tr>
              <td>David Okoro</td>
              <td>Data Analysis</td>
              <td>58%</td>
              <td>20</td>
              <td>Open</td>
            </tr>

            <tr>
              <td>Faith Emmanuel</td>
              <td>Data Analysis</td>
              <td>83%</td>
              <td>9</td>
              <td>Marked</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TutorStudents;