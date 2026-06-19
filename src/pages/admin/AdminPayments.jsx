function AdminPayments() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Payment Management</h1>
          <p>
            Manually confirm payments, add payment records, track balances, and restrict
            overdue students.
          </p>
        </div>

        <button>Add Payment Record</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Confirmed</p>
          <h2>₦2.4M</h2>
        </article>

        <article className="dashboardCard">
          <p>Outstanding Balance</p>
          <h2>₦650K</h2>
        </article>

        <article className="dashboardCard">
          <p>Overdue Students</p>
          <h2>7</h2>
        </article>

        <article className="dashboardCard">
          <p>Manual Confirmations</p>
          <h2>31</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Payment Records</h2>

        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Amount Paid</th>
              <th>Balance</th>
              <th>Confirmation</th>
              <th>Access Status</th>
            </tr>
          </thead>

          <tbody>
            <tr>
              <td>Mary Adams</td>
              <td>₦105,000</td>
              <td>₦45,000</td>
              <td>Confirmed</td>
              <td>Active</td>
            </tr>

            <tr>
              <td>David Okoro</td>
              <td>₦70,000</td>
              <td>₦80,000</td>
              <td>Confirmed</td>
              <td>Restricted</td>
            </tr>

            <tr>
              <td>Faith Emmanuel</td>
              <td>₦150,000</td>
              <td>₦0</td>
              <td>Confirmed</td>
              <td>Active</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default AdminPayments;