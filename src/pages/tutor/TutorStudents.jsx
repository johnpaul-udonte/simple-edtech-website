import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTutorStudentsForCurrentUser } from "../../services/tutorService";

function TutorStudents() {
  const { session, profile } = useAuth();

  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadTutorStudents() {
      if (!session?.user?.id) {
        setNotice("No active tutor session found.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getTutorStudentsForCurrentUser(
        session.user.id
      );

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setStudentData(data);
      setIsLoading(false);
    }

    loadTutorStudents();
  }, [session]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading assigned students...</h2>
        <p>Please wait while your student records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Tutor students issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const students = studentData?.students || [];
  const bookings = studentData?.bookings || [];

  const activeStudents = students.filter((student) => !student.is_restricted);
  const restrictedStudents = students.filter((student) => student.is_restricted);

  const totalCompletedClasses = students.reduce(
    (sum, student) => sum + Number(student.completed_classes || 0),
    0
  );

  const totalOutstandingBalance = students.reduce(
    (sum, student) => sum + Number(student.payment_balance || 0),
    0
  );

  function getStudentBookings(studentId) {
    return bookings.filter((booking) => booking.student_id === studentId);
  }

  function getLatestBooking(studentId) {
    return getStudentBookings(studentId)[0] || null;
  }

  function getProgress(student) {
    const total = Number(student.total_paid_classes || 0);
    const completed = Number(student.completed_classes || 0);

    if (total <= 0) {
      return 0;
    }

    return Math.round((completed / total) * 100);
  }

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>My Students</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. View your assigned
            students, progress, class balance, access status, and latest class
            activity.
          </p>
        </div>

        <button>Message Students</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Assigned Students</p>
          <h2>{students.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Active Students</p>
          <h2>{activeStudents.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted Students</p>
          <h2>{restrictedStudents.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Completed Classes</p>
          <h2>{totalCompletedClasses}</h2>
        </article>

        <article className="dashboardCard">
          <p>Outstanding Balance</p>
          <h2>₦{totalOutstandingBalance.toLocaleString()}</h2>
        </article>

        <article className="dashboardCard">
          <p>Total Bookings</p>
          <h2>{bookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Specialisation</p>
          <h2>{studentData?.tutor?.specialisation || "Not set"}</h2>
        </article>
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
                <th>Classes</th>
                <th>Balance</th>
                <th>Access</th>
                <th>Latest Class</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const total = Number(student.total_paid_classes || 0);
                const completed = Number(student.completed_classes || 0);
                const remaining = Math.max(total - completed, 0);
                const progress = getProgress(student);
                const latestBooking = getLatestBooking(student.id);

                return (
                  <tr key={student.id}>
                    <td>
                      {student.profiles?.full_name || "Unnamed Student"}
                      <br />
                      <small>{student.student_code || "-"}</small>
                    </td>

                    <td>{student.profiles?.email || "-"}</td>

                    <td>{student.enrolled_course || "Data Analysis"}</td>

                    <td>
                      <strong>{progress}%</strong>
                      <div className="progressTrack">
                        <div
                          className="progressFill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </td>

                    <td>
                      {completed} / {total}
                      <br />
                      <small>{remaining} remaining</small>
                    </td>

                    <td>
                      ₦{Number(student.payment_balance || 0).toLocaleString()}
                    </td>

                    <td>
                      <span
                        className={`statusPill ${
                          student.is_restricted ? "cancelled" : "approved"
                        }`}
                      >
                        {student.is_restricted ? "Restricted" : "Active"}
                      </span>
                    </td>

                    <td>
                      {latestBooking ? (
                        <>
                          <span className={`statusPill ${latestBooking.status}`}>
                            {latestBooking.status}
                          </span>
                          <br />
                          <small>
                            {latestBooking.class_slots?.slot_date || "-"} |{" "}
                            {latestBooking.class_slots?.start_time || "-"} -{" "}
                            {latestBooking.class_slots?.end_time || "-"}
                          </small>
                        </>
                      ) : (
                        <span className="mutedText">No booking yet</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Student Monitoring Rules</h2>
        <p>
          Students with payment or admin restrictions will show as{" "}
          <strong>Restricted</strong>. Class progress is calculated from completed
          classes divided by total paid classes.
        </p>
      </div>
    </section>
  );
}

export default TutorStudents;