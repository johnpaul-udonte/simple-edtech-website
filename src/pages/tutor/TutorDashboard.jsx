import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAssignedStudents,
  getCurrentTutorRecord,
} from "../../services/tutorService";

function TutorDashboard() {
  const { profile, session } = useAuth();

  const [tutorRecord, setTutorRecord] = useState(null);
  const [students, setStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadTutorData() {
      if (!session?.user?.id) {
        setNotice("No active tutor session found.");
        setIsLoading(false);
        return;
      }

      const { data: tutorData, error: tutorError } =
        await getCurrentTutorRecord(session.user.id);

      if (tutorError) {
        setNotice(tutorError.message);
        setIsLoading(false);
        return;
      }

      setTutorRecord(tutorData);

      const { data: assignedStudents, error: studentsError } =
        await getAssignedStudents(tutorData.id);

      if (studentsError) {
        setNotice(studentsError.message);
        setIsLoading(false);
        return;
      }

      setStudents(assignedStudents || []);
      setIsLoading(false);
    }

    loadTutorData();
  }, [session]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading tutor dashboard...</h2>
        <p>Please wait while your assigned students are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Tutor record issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const assignedCount = students.length;
  const restrictedCount = students.filter((student) => student.is_restricted).length;
  const activeCount = assignedCount - restrictedCount;

  const totalCompletedClasses = students.reduce(
    (sum, student) => sum + Number(student.completed_classes || 0),
    0
  );

  const averageProgress =
    assignedCount > 0
      ? Math.round(
          students.reduce((sum, student) => {
            const total = Number(student.total_paid_classes || 0);
            const completed = Number(student.completed_classes || 0);
            const progress = total > 0 ? (completed / total) * 100 : 0;
            return sum + progress;
          }, 0) / assignedCount
        )
      : 0;

  const tutorCards = [
    { label: "Assigned Students", value: assignedCount },
    { label: "Active Students", value: activeCount },
    { label: "Restricted Students", value: restrictedCount },
    { label: "Completed Classes", value: totalCompletedClasses },
    { label: "Average Progress", value: `${averageProgress}%` },
    { label: "Specialisation", value: tutorRecord?.specialisation || "Not set" },
  ];

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Welcome back, {profile?.full_name || "Tutor"}</h1>
          <p>
            View your assigned students, class progress, payment restrictions,
            and learning activity.
          </p>
        </div>

        <button>Upload Material</button>
      </div>

      <div className="dashboardGrid">
        {tutorCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </div>

      <div className="dashboardPanel">
        <h2>Assigned Students</h2>

        {students.length === 0 ? (
          <p>No students have been assigned to you yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Progress</th>
                <th>Classes Left</th>
                <th>Access</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const total = Number(student.total_paid_classes || 0);
                const completed = Number(student.completed_classes || 0);
                const remaining = Math.max(total - completed, 0);
                const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

                return (
                  <tr key={student.id}>
                    <td>{student.profiles?.full_name || "Unnamed Student"}</td>
                    <td>{student.profiles?.email || "-"}</td>
                    <td>{student.enrolled_course}</td>
                    <td>{progress}%</td>
                    <td>{remaining}</td>
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

export default TutorDashboard;