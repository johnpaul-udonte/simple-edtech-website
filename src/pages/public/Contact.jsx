function Contact() {
  return (
    <main className="page">
      <section className="pageHeader">
        <p className="eyebrow">Contact</p>
        <h2>Speak with Jlux Academy.</h2>
        <p>
          Use this page later for enquiry forms, WhatsApp links, business email,
          and student support requests.
        </p>
      </section>

      <section className="formCard">
        <label>
          Full Name
          <input type="text" placeholder="Enter your name" />
        </label>

        <label>
          Email Address
          <input type="email" placeholder="Enter your email" />
        </label>

        <label>
          Message
          <textarea placeholder="How can we help?" rows="5"></textarea>
        </label>

        <button>Send Message</button>
      </section>
    </main>
  );
}

export default Contact;