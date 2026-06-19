function AdminQuizzes() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Weekly Practice Management</h1>
          <p>
            Create objective questions, manage question banks, track attempts,
            and monitor the 1-hour result release rule.
          </p>
        </div>

        <button>Upload Questions</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Questions</p>
          <h2>240</h2>
        </article>

        <article className="dashboardCard">
          <p>Quiz Attempts</p>
          <h2>118</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Release</p>
          <h2>8</h2>
        </article>

        <article className="dashboardCard">
          <p>Average Score</p>
          <h2>76%</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Recent Practice Attempts</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Tool</th>
              <th>Score</th>
              <th>Submitted</th>
              <th>Result Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Excel</td>
              <td>82%</td>
              <td>Today</td>
              <td>Released</td>
            </tr>

            <tr>
              <td>David Okoro</td>
              <td>Power BI</td>
              <td>68%</td>
              <td>Today</td>
              <td>Pending 1-hour release</td>
            </tr>

            <tr>
              <td>Faith Emmanuel</td>
              <td>SQL</td>
              <td>91%</td>
              <td>Yesterday</td>
              <td>Released</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminQuizzes;