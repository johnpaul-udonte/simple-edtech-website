const studentCards = [
  { label: "Course Progress", value: "72%" },
  { label: "Excel Progress", value: "85%" },
  { label: "Power BI Progress", value: "60%" },
  { label: "SQL Progress", value: "45%" },
  { label: "Python Progress", value: "20%" },
  { label: "Classes Completed", value: "7" },
  { label: "Classes Remaining", value: "17" },
  { label: "Payment Balance", value: "₦45,000" },
  { label: "Assignment Status", value: "Submitted" },
  { label: "Weekly Practice Score", value: "82%" },
  { label: "Tutor Feedback", value: "Good progress" },
  { label: "Certificates Earned", value: "1" },
];

function StudentDashboard() {
  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Welcome back, Student</h1>
          <p>
            Track your classes, assignments, weekly practice, payment balance,
            and certificates.
          </p>
        </div>

        <button>Choose Weekly Schedule</button>
      </div>

      <div className="dashboardGrid">
        {studentCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </div>

      <div className="dashboardPanel">
        <h2>Upcoming Class</h2>
        <p>Power BI Dashboard Design — Saturday, 10:00 AM — Awaiting admin approval.</p>
      </div>
    </section>
  );
}

export default StudentDashboard;