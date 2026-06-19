function StudentCertificates() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Certificates</h1>
          <p>View certificate status for Excel, Power BI, SQL, and Python.</p>
        </div>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Excel Certificate</p>
          <h2>Earned</h2>
        </article>
        <article className="dashboardCard">
          <p>Power BI Certificate</p>
          <h2>In Progress</h2>
        </article>
        <article className="dashboardCard">
          <p>SQL Certificate</p>
          <h2>Locked</h2>
        </article>
        <article className="dashboardCard">
          <p>Python Certificate</p>
          <h2>Locked</h2>
        </article>
      </div>
    </section>
  );
}

export default StudentCertificates;