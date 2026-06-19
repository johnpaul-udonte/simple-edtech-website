function Register() {
  return (
    <main className="authPage">
      <section className="authCard">
        <p className="eyebrow">Student Registration</p>
        <h2>Create your student interest profile</h2>
        <p>
          Full student enrolment will still require admin confirmation before portal access.
        </p>

        <form>
          <label>
            Full Name
            <input type="text" placeholder="Enter full name" />
          </label>

          <label>
            Email Address
            <input type="email" placeholder="Enter email" />
          </label>

          <label>
            Preferred Course
            <select>
              <option>Data Analysis</option>
              <option>Excel</option>
              <option>Power BI</option>
              <option>SQL</option>
              <option>Python</option>
            </select>
          </label>

          <button type="button">Submit Interest</button>
        </form>
      </section>
    </main>
  );
}

export default Register;