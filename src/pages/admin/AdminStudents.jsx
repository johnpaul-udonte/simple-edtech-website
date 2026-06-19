function AdminStudents() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Student Management</h1>
          <p>
            Create, edit, suspend, restrict, reactivate, and monitor all student accounts.
          </p>
        </div>

        <button>Create Student</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Students</p>
          <h2>42</h2>
        </article>

        <article className="dashboardCard">
          <p>Active Students</p>
          <h2>35</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted Students</p>
          <h2>5</h2>
        </article>

        <article className="dashboardCard">
          <p>Suspended Students</p>
          <h2>2</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Students</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Tutor</th>
              <th>Payment Balance</th>
              <th>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>Data Analysis</td>
              <td>Mr John</td>
              <td>₦45,000</td>
              <td>Active</td>
            </tr>

            <tr>
              <td>David Okoro</td>
              <td>Data Analysis</td>
              <td>Mrs Grace</td>
              <td>₦80,000</td>
              <td>Restricted</td>
            </tr>

            <tr>
              <td>Faith Emmanuel</td>
              <td>Data Analysis</td>
              <td>Mr John</td>
              <td>₦0</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminStudents;