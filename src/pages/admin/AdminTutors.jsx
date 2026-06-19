import { useEffect, useState } from "react";
import { getAllTutorsForAdmin } from "../../services/adminService";

function AdminTutors() {
  const [tutors, setTutors] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadTutors() {
      const { data, error } = await getAllTutorsForAdmin();

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setTutors(data || []);
      setIsLoading(false);
    }

    loadTutors();
  }, []);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading tutors...</h2>
        <p>Please wait while tutor records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Tutor management issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const totalTutors = tutors.length;
  const activeTutors = tutors.filter((tutor) => tutor.is_active).length;

  const totalAssignedStudents = tutors.reduce(
    (sum, tutor) => sum + Number(tutor.students?.length || 0),
    0
  );

  const restrictedStudents = tutors.reduce((sum, tutor) => {
    const restricted = tutor.students?.filter((student) => student.is_restricted).length || 0;
    return sum + restricted;
  }, 0);

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Tutor Management</h1>
          <p>
            View real tutor records, assigned students, tutor workload, and tutor
            account status from Supabase.
          </p>
        </div>

        <button>Create Tutor</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Tutors</p>
          <h2>{totalTutors}</h2>
        </article>

        <article className="dashboardCard">
          <p>Active Tutors</p>
          <h2>{activeTutors}</h2>
        </article>

        <article className="dashboardCard">
          <p>Assigned Students</p>
          <h2>{totalAssignedStudents}</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted Students</p>
          <h2>{restrictedStudents}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Tutors</h2>

        {tutors.length === 0 ? (
          <p>No tutors have been created yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tutor</th>
                <th>Email</th>
                <th>Specialisation</th>
                <th>Students Assigned</th>
                <th>Completed Classes</th>
                <th>Student Balance</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {tutors.map((tutor) => {
                const students = tutor.students || [];

                const completedClasses = students.reduce(
                  (sum, student) => sum + Number(student.completed_classes || 0),
                  0
                );

                const totalStudentBalance = students.reduce(
                  (sum, student) => sum + Number(student.payment_balance || 0),
                  0
                );

                return (
                  <tr key={tutor.id}>
                    <td>{tutor.profiles?.full_name || "Unnamed Tutor"}</td>
                    <td>{tutor.profiles?.email || "-"}</td>
                    <td>{tutor.specialisation || "Not set"}</td>
                    <td>{students.length}</td>
                    <td>{completedClasses}</td>
                    <td>₦{totalStudentBalance.toLocaleString()}</td>
                    <td>{tutor.is_active ? "Active" : "Inactive"}</td>
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

export default AdminTutors;