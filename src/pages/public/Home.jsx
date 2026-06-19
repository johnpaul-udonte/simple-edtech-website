const tools = [
  {
    title: "Excel",
    text: "Master formulas, pivot tables, dashboards, and business reporting.",
  },
  {
    title: "Power BI",
    text: "Build interactive dashboards and transform raw data into insights.",
  },
  {
    title: "SQL",
    text: "Query databases, clean data, and analyse real business records.",
  },
  {
    title: "Python",
    text: "Automate analysis, clean datasets, and work with practical data projects.",
  },
];

const dashboardCards = [
  "Course Progress",
  "Classes Remaining",
  "Upcoming Class",
  "Payment Balance",
  "Assignment Status",
  "Weekly Practice Score",
];

function Home() {
  return (
    <>
      <header className="homeHero">
        <section className="hero">
          <div className="heroText">
            <p className="eyebrow">Premium Data Skills Academy</p>
            <h2>Learn practical data skills with structure, coaching, and accountability.</h2>
            <p className="heroDescription">
              Jlux Academy helps beginners, professionals, undergraduates, NYSC members,
              and business owners learn Excel, Power BI, SQL, and Python through guided
              private coaching and a modern student portal experience.
            </p>

            <div className="heroActions">
              <a href="/register" className="primaryBtn">Start Learning</a>
              <a href="/courses" className="secondaryBtn">View Courses</a>
            </div>

            <div className="trustRow">
              <span>Excel</span>
              <span>Power BI</span>
              <span>SQL</span>
              <span>Python</span>
            </div>
          </div>

          <div className="heroCard">
            <div className="portalTop">
              <span>Student Portal Preview</span>
              <strong>72%</strong>
            </div>

            <div className="progressBlock">
              <p>Overall Course Progress</p>
              <div className="progressTrack">
                <div className="progressFill"></div>
              </div>
            </div>

            <div className="miniGrid">
              {dashboardCards.map((card) => (
                <div className="miniCard" key={card}>
                  <span>{card}</span>
                  <strong>Active</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
      </header>

      <main>
        <section className="section">
          <div className="sectionHeader">
            <p className="eyebrow">Tool-Based Learning</p>
            <h2>Courses built around real business data skills</h2>
            <p>
              Learn the exact tools needed for business reporting, automation,
              dashboarding, and decision-making.
            </p>
          </div>

          <div className="courseGrid">
            {tools.map((tool) => (
              <article className="courseCard" key={tool.title}>
                <div className="courseIcon">{tool.title[0]}</div>
                <h3>{tool.title}</h3>
                <p>{tool.text}</p>
                <a href="/courses">Explore {tool.title}</a>
              </article>
            ))}
          </div>
        </section>

        <section className="portalSection">
          <div>
            <p className="eyebrow">Learning Management Portal</p>
            <h2>Student, Tutor, and Admin dashboards</h2>
            <p>
              The full LMS will include student progress tracking, assignment submission,
              weekly practice tests, schedule booking, payment balance, attendance,
              certificates, and admin approvals.
            </p>
          </div>

          <div className="portalCards">
            <div>
              <h3>Student Portal</h3>
              <p>Track progress, submit assignments, book classes, and view certificates.</p>
            </div>
            <div>
              <h3>Tutor Portal</h3>
              <p>Review students, mark assignments, give feedback, and manage materials.</p>
            </div>
            <div>
              <h3>Admin Portal</h3>
              <p>Approve schedules, manage payments, students, tutors, classes, and reports.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="sectionHeader">
            <p className="eyebrow">How Learning Works</p>
            <h2>A guided path from beginner to job-ready</h2>
          </div>

          <div className="steps">
            <div>
              <span>01</span>
              <h3>Enroll</h3>
              <p>Admin creates your student record and confirms your payment manually.</p>
            </div>
            <div>
              <span>02</span>
              <h3>Book Classes</h3>
              <p>Students choose two weekly 1-hour sessions from available slots.</p>
            </div>
            <div>
              <span>03</span>
              <h3>Learn & Submit</h3>
              <p>Complete lessons, submit assignments, and take weekly practice tests.</p>
            </div>
            <div>
              <span>04</span>
              <h3>Get Certified</h3>
              <p>Earn certificates for Excel, Power BI, SQL, and Python as you complete tools.</p>
            </div>
          </div>
        </section>

        <section className="cta">
          <h2>Ready to build serious data skills?</h2>
          <p>
            Join Jlux Academy and learn through structure, coaching, accountability,
            and real business projects.
          </p>
          <a href="/contact" className="primaryBtn">Contact Jlux Academy</a>
        </section>
      </main>
    </>
  );
}

export default Home;