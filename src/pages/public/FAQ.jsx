const faqs = [
  {
    question: "Is Jlux Academy for beginners?",
    answer: "Yes. The programme is designed for beginners, NYSC members, undergraduates, business owners, and working professionals.",
  },
  {
    question: "Do students get certificates?",
    answer: "Yes. Certificates are planned for Excel, Power BI, SQL, and Python completion.",
  },
  {
    question: "Can students choose class schedules?",
    answer: "Yes. Students will choose weekly class slots, subject to admin approval.",
  },
];

function FAQ() {
  return (
    <main className="page">
      <section className="pageHeader">
        <p className="eyebrow">FAQ</p>
        <h2>Common questions.</h2>
      </section>

      <section className="faqList">
        {faqs.map((faq) => (
          <article className="simpleCard" key={faq.question}>
            <h3>{faq.question}</h3>
            <p>{faq.answer}</p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default FAQ;