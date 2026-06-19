const courses = ["Excel", "Power BI", "SQL", "Python"];

function Courses() {
  return (
    <main className="page">
      <section className="pageHeader">
        <p className="eyebrow">Courses</p>
        <h2>Learn data analysis tool by tool.</h2>
        <p>
          Each course is designed to help students build practical confidence with
          real datasets, assignments, practice questions, and tutor feedback.
        </p>
      </section>

      <section className="simpleGrid">
        {courses.map((course) => (
          <article className="simpleCard" key={course}>
            <h3>{course}</h3>
            <p>
              Practical lessons, assignments, weekly practice, materials, and
              certificate tracking for {course}.
            </p>
          </article>
        ))}
      </section>
    </main>
  );
}

export default Courses;