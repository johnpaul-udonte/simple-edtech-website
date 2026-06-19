function Login() {
  return (
    <main className="authPage">
      <section className="authCard">
        <p className="eyebrow">Portal Login</p>
        <h2>Welcome back</h2>
        <p>Student, tutor, and admin login will connect to Supabase later.</p>

        <form>
          <label>
            Email Address
            <input type="email" placeholder="Enter email" />
          </label>

          <label>
            Password
            <input type="password" placeholder="Enter password" />
          </label>

          <button type="button">Login</button>
        </form>
      </section>
    </main>
  );
}

export default Login;