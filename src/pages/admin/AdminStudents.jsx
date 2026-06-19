import { useEffect, useState } from "react";
import { getAllStudentsForAdmin } from "../../services/adminService";

function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadStudents() {
      const { data, error } = await getAllStudentsForAdmin();

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setStudents(data || []);
      setIsLoading(false);
    }

    loadStudents();
  }, []);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading students...</h2>
        <p>Please wait while student records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Student management issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const totalStudents = students.length;
  const activeStudents = students.filter((student) => !student.is_restricted).length;
  const restrictedStudents = students.filter((student) => student.is_restricted).length;

  const totalOutstandingBalance = students.reduce(
    (sum, student) => sum + Number(student.payment_balance || 0),
    0
  );

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Student Management</h1>
          <p>
            View real student records, tutor assignments, class balances, payment
            balances, and access status from Supabase.
          </p>
        </div>

        <button>Create Student</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Students</p>
          <h2>{totalStudents}</h2>
        </article>

        <article className="dashboardCard">
          <p>Active Students</p>
          <h2>{activeStudents}</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted Students</p>
          <h2>{restrictedStudents}</h2>
        </article>

        <article className="dashboardCard">
          <p>Outstanding Balance</p>
          <h2>₦{totalOutstandingBalance.toLocaleString()}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Students</h2>

        {students.length === 0 ? (
          <p>No students have been created yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Student Code</th>
                <th>Course</th>
                <th>Tutor</th>
                <th>Classes</th>
                <th>Balance</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const total = Number(student.total_paid_classes || 0);
                const completed = Number(student.completed_classes || 0);
                const remaining = Math.max(total - completed, 0);

                return (
                  <tr key={student.id}>
                    <td>{student.profiles?.full_name || "Unnamed Student"}</td>
                    <td>{student.profiles?.email || "-"}</td>
                    <td>{student.student_code || "-"}</td>
                    <td>{student.enrolled_course || "Data Analysis"}</td>
                    <td>
                      {student.tutors?.profiles?.full_name ||
                        "Tutor not assigned"}
                    </td>
                    <td>
                      {completed} / {total}
                      <br />
                      <small>{remaining} remaining</small>
                    </td>
                    <td>₦{Number(student.payment_balance || 0).toLocaleString()}</td>
                    <td>{student.is_restricted ? "Restricted" : "Active"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminStudents;