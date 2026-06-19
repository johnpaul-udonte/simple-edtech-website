function StudentPractice() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Weekly Practice</h1>
          <p>Take timed objective practice tests. Results are released after 1 hour.</p>
        </div>
        <button>Start Practice</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Current Week Score</p>
          <h2>82%</h2>
        </article>
        <article className="dashboardCard">
          <p>Attempts Stored</p>
          <h2>6</h2>
        </article>
        <article className="dashboardCard">
          <p>Result Release</p>
          <h2>1 Hour</h2>
        </article>
        <article className="dashboardCard">
          <p>Correction Status</p>
          <h2>Released</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Practice History</h2>
        <table>
          <thead>
            <tr>
              <th>Week</th>
              <th>Tool</th>
              <th>Score</th>
              <th>Result Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Week 1</td>
              <td>Excel</td>
              <td>78%</td>
              <td>Released</td>
            </tr>
            <tr>
              <td>Week 2</td>
              <td>Power BI</td>
              <td>82%</td>
              <td>Released</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default StudentPractice;