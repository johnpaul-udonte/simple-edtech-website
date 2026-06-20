import { Link } from "react-router-dom";

const pricingPlans = [
  {
    title: "Full Data Analysis Training",
    price: "₦120,000",
    description: "Complete practical training in Excel, Power BI, SQL, and Python.",
    tag: "Best Value",
    featured: true,
  },
  {
    title: "Excel Training",
    price: "₦40,000",
    description: "Master formulas, dashboards, pivot tables, reporting, and analysis.",
    tag: "Beginner Friendly",
  },
  {
    title: "Power BI Training",
    price: "₦40,000",
    description: "Build clean dashboards, transform data, model data, and create reports.",
    tag: "Dashboard Focused",
  },
  {
    title: "SQL Training",
    price: "₦40,000",
    description: "Learn database querying, joins, filtering, grouping, and reporting logic.",
    tag: "Data Querying",
  },
  {
    title: "Python Training",
    price: "₦50,000",
    description: "Learn Python for data cleaning, analysis, automation, and reporting.",
    tag: "Automation Ready",
  },
  {
    title: "Excel + Power BI + SQL",
    price: "₦120,000",
    description: "A strong analyst package for reporting, dashboards, and database querying.",
    tag: "Analyst Combo",
  },
];

function Pricing() {
  return (
    <main className="page">
      <section className="pageHeader pricingHeader">
        <p className="eyebrow">Pricing</p>
        <h2>Choose the right data training plan.</h2>
        <p>
          Start with one tool or take the full Data Analysis package. Payment is
          confirmed by admin, and students can view amount paid and balance
          inside their student portal after enrolment.
        </p>
      </section>

      <section className="pricingGrid">
        {pricingPlans.map((plan) => (
          <article
            className={`pricingCard ${plan.featured ? "featuredPricingCard" : ""}`}
            key={plan.title}
          >
            <div className="pricingTopRow">
              <span>{plan.tag}</span>
            </div>

            <h3>{plan.title}</h3>
            <strong>{plan.price}</strong>
            <p>{plan.description}</p>

            <Link to="/register" className="pricingActionBtn">
              Register Now
            </Link>
          </article>
        ))}
      </section>

      <section className="pricingNoteBox">
        <h3>Payment Tracking Included</h3>
        <p>
          After enrolment, admin can record how much a student has paid and the
          outstanding balance. The student will be able to see this inside their
          portal.
        </p>
      </section>
    </main>
  );
}

export default Pricing;