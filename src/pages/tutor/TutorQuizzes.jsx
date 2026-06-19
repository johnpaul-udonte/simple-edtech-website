function TutorQuizzes() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Weekly Practice Questions</h1>
          <p>Create multiple-choice questions, group them by tool/module/topic, and review students’ quiz performance.</p>
        </div>

        <button>Create Question</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Questions</p>
          <h2>120</h2>
        </article>

        <article className="dashboardCard">
          <p>Excel Questions</p>
          <h2>35</h2>
        </article>

        <article className="dashboardCard">
          <p>Power BI Questions</p>
          <h2>30</h2>
        </article>

        <article className="dashboardCard">
          <p>SQL/Python Questions</p>
          <h2>55</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Recent Practice Performance</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Tool</th>
              <th>Score</th>
              <th>Result Release</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Excel</td>
              <td>82%</td>
              <td>Released</td>
            </tr>
            <tr>
              <td>David Okoro</td>
              <td>Power BI</td>
              <td>68%</td>
              <td>Released</td>
            </tr>
            <tr>
              <td>Faith Emmanuel</td>
              <td>SQL</td>
              <td>91%</td>
              <td>Pending 1-hour release</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default TutorQuizzes;