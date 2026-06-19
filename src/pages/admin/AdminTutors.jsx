function AdminTutors() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Tutor Management</h1>
          <p>
            Create tutors, assign students, deactivate tutors, and review tutor workload.
          </p>
        </div>

        <button>Create Tutor</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Tutors</p>
          <h2>5</h2>
        </article>

        <article className="dashboardCard">
          <p>Active Tutors</p>
          <h2>4</h2>
        </article>

        <article className="dashboardCard">
          <p>Assigned Students</p>
          <h2>42</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Reviews</p>
          <h2>9</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Tutors</h2>

        <table>
          <thead>
            <tr>
              <th>Tutor</th>
              <th>Specialisation</th>
              <th>Students Assigned</th>
              <th>Upcoming Classes</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mr John</td>
              <td>Excel, Power BI</td>
              <td>18</td>
              <td>6</td>
              <td>Active</td>
            </tr>

            <tr>
              <td>Mrs Grace</td>
              <td>SQL, Python</td>
              <td>14</td>
              <td>4</td>
              <td>Active</td>
            </tr>

            <tr>
              <td>Mr Daniel</td>
              <td>Power BI</td>
              <td>10</td>
              <td>3</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminTutors;