import { Link } from "react-router-dom";

const tools = [
  {
    title: "Excel",
    text: "Build reports, clean data, use formulas, pivot tables, and dashboards.",
  },
  {
    title: "Power BI",
    text: "Turn raw records into interactive dashboards and business insights.",
  },
  {
    title: "SQL",
    text: "Query databases, join tables, filter records, and answer data questions.",
  },
  {
    title: "Python",
    text: "Clean data, automate tasks, analyse datasets, and build practical projects.",
  },
];

const dashboardCards = [
  "Progress",
  "Classes Left",
  "Schedule",
  "Balance",
  "Assignments",
  "Drills",
];

const dataFacts = [
  {
    title: "Data tells the story",
    text: "Every sale, payment, customer, and complaint produces useful information.",
  },
  {
    title: "Dashboards save time",
    text: "A good dashboard helps managers see what is working and what needs attention.",
  },
  {
    title: "SQL is a data language",
    text: "Many business reports start from asking the database the right question.",
  },
  {
    title: "Python automates work",
    text: "Python helps reduce repetitive spreadsheet work and manual reporting.",
  },
];

const dataQuotes = [
  "Without data, you are only guessing.",
  "Good data skills turn confusion into clear decisions.",
  "A dashboard is only powerful when it answers a real business question.",
];

const pricingSnapshot = [
  { course: "Full Data Analysis", fee: "₦120,000" },
  { course: "Excel", fee: "₦40,000" },
  { course: "Power BI", fee: "₦40,000" },
  { course: "SQL", fee: "₦40,000" },
  { course: "Python", fee: "₦50,000" },
  { course: "Excel + Power BI + SQL", fee: "₦120,000" },
];

function Home() {
  return (
    <>
      <header className="homeHero compactHomeHero">
        <section className="hero">
          <div className="heroText">
            <p className="eyebrow">Premium Data Skills Academy</p>

            <h2>
              Learn practical data skills with coaching, structure, and
              accountability.
            </h2>

            <p className="heroDescription">
              Jlux Academy helps students, professionals, NYSC members, business
              owners, and career switchers learn Excel, Power BI, SQL, and Python
              with a guided portal experience.
            </p>

            <div className="heroActions">
              <Link to="/register" className="primaryBtn">
                Start Learning
              </Link>

              <Link to="/courses" className="secondaryBtn">
                View Courses
              </Link>
            </div>

            <div className="trustRow">
              <span>Excel</span>
              <span>Power BI</span>
              <span>SQL</span>
              <span>Python</span>
            </div>
          </div>

          <div className="heroCard compactPortalPreview">
            <div className="portalTop">
              <span>Student Portal</span>
              <strong>72%</strong>
            </div>

            <div className="progressBlock">
              <p>Course Progress</p>
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
        <section className="dataQuoteStrip">
          {dataQuotes.map((quote) => (
            <article key={quote}>
              <span>“</span>
              <p>{quote}</p>
            </article>
          ))}
        </section>

        <section className="section compactSection">
          <div className="sectionHeader compactSectionHeader">
            <p className="eyebrow">Tool-Based Learning</p>
            <h2>Courses built around real business data skills</h2>
            <p>
              Learn the tools needed for reporting, automation, dashboards, and
              decision-making.
            </p>
          </div>

          <div className="courseGrid compactCourseGrid">
            {tools.map((tool) => (
              <article className="courseCard compactCourseCard" key={tool.title}>
                <div className="courseIcon">{tool.title[0]}</div>
                <h3>{tool.title}</h3>
                <p>{tool.text}</p>
                <Link to="/courses">Explore {tool.title}</Link>
              </article>
            ))}
          </div>
        </section>

        <section className="dataFactsSection">
          <div className="sectionHeader compactSectionHeader">
            <p className="eyebrow">Data Facts</p>
            <h2>Why data skills matter</h2>
          </div>

          <div className="dataFactsGrid">
            {dataFacts.map((fact) => (
              <article key={fact.title}>
                <h3>{fact.title}</h3>
                <p>{fact.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="portalSection compactPortalSection">
          <div>
            <p className="eyebrow">Learning Management Portal</p>
            <h2>Student, Tutor, and Admin dashboards</h2>
            <p>
              Track progress, manage schedules, approve learning activities,
              record payments, upload certificates, and monitor student growth.
            </p>
          </div>

          <div className="portalCards compactPortalCards">
            <div>
              <h3>Student Portal</h3>
              <p>
                View progress, book classes, submit assignments, see balance,
                receive certificates, and take drills.
              </p>
            </div>

            <div>
              <h3>Tutor Portal</h3>
              <p>
                View assigned students, approve schedules, review assignments,
                and monitor learning progress.
              </p>
            </div>

            <div>
              <h3>Admin Portal</h3>
              <p>
                Approve students, tutors, schedules, payments, certificates,
                assignments, and reports.
              </p>
            </div>
          </div>
        </section>

        <section className="section compactSection">
          <div className="sectionHeader compactSectionHeader">
            <p className="eyebrow">Pricing Snapshot</p>
            <h2>Clear training fees</h2>
          </div>

          <div className="homePricingGrid">
            {pricingSnapshot.map((item) => (
              <article key={item.course}>
                <span>{item.course}</span>
                <strong>{item.fee}</strong>
              </article>
            ))}
          </div>

          <div className="homeCenterAction">
            <Link to="/pricing" className="primaryBtn">
              View Full Pricing
            </Link>
          </div>
        </section>

        <section className="section compactSection">
          <div className="sectionHeader compactSectionHeader">
            <p className="eyebrow">How Learning Works</p>
            <h2>A guided path from beginner to confident analyst</h2>
          </div>

          <div className="steps compactSteps">
            <div>
              <span>01</span>
              <h3>Register</h3>
              <p>Apply as a student or tutor and wait for admin approval.</p>
            </div>

            <div>
              <span>02</span>
              <h3>Book Classes</h3>
              <p>Students choose two weekly 1-hour sessions.</p>
            </div>

            <div>
              <span>03</span>
              <h3>Learn & Submit</h3>
              <p>Attend classes, submit assignments, and complete drills.</p>
            </div>

            <div>
              <span>04</span>
              <h3>Get Certified</h3>
              <p>Download certificates after completing approved courses.</p>
            </div>
          </div>
        </section>

        <section className="cta compactCta">
          <h2>Ready to build serious data skills?</h2>
          <p>
            Join Jlux Academy and learn through structure, coaching,
            accountability, and real business projects.
          </p>

          <Link to="/contact" className="primaryBtn">
            Contact Jlux Academy
          </Link>
        </section>
      </main>
    </>
  );
}

export default Home;