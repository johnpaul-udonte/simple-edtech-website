import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getStudentScheduleForCurrentUser } from "../../services/studentService";

function StudentSchedule() {
  const { session, profile } = useAuth();

  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadStudentSchedule() {
      if (!session?.user?.id) {
        setNotice("No active student session found.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getStudentScheduleForCurrentUser(
        session.user.id
      );

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setScheduleData(data);
      setIsLoading(false);
    }

    loadStudentSchedule();
  }, [session]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading your schedule...</h2>
        <p>Please wait while your class bookings are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Schedule issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const bookings = scheduleData?.bookings || [];

  const scheduledBookings = bookings.filter(
    (booking) => booking.status === "scheduled"
  );

  const approvedBookings = bookings.filter(
    (booking) => booking.status === "approved"
  );

  const completedBookings = bookings.filter(
    (booking) => booking.status === "completed"
  );

  const missedBookings = bookings.filter(
    (booking) => booking.status === "missed"
  );

  const cancelledBookings = bookings.filter(
    (booking) => booking.status === "cancelled"
  );

  const rescheduledBookings = bookings.filter(
    (booking) => booking.status === "rescheduled"
  );

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>My Class Schedule</h1>
          <p>
            Welcome, {profile?.full_name || "Student"}. View your pending,
            approved, completed, missed, cancelled, and rescheduled classes.
          </p>
        </div>

        <button>Request New Class</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Bookings</p>
          <h2>{bookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Approval</p>
          <h2>{scheduledBookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Approved Classes</p>
          <h2>{approvedBookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Completed Classes</p>
          <h2>{completedBookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Missed Classes</p>
          <h2>{missedBookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Cancelled Classes</p>
          <h2>{cancelledBookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Rescheduled Classes</p>
          <h2>{rescheduledBookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Student Code</p>
          <h2>{scheduleData?.student?.student_code || "N/A"}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>My Bookings</h2>

        {bookings.length === 0 ? (
          <p>
            You do not have any class bookings yet. Once you request a class or
            admin assigns one, it will appear here.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Tutor</th>
                <th>Status</th>
                <th>Reschedules</th>
                <th>Approved By</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>{booking.class_slots?.slot_date || "-"}</td>

                  <td>
                    {booking.class_slots?.start_time || "-"} -{" "}
                    {booking.class_slots?.end_time || "-"}
                  </td>

                  <td>
                    {booking.tutors?.profiles?.full_name || "Tutor not assigned"}
                  </td>

                  <td>
                    <span className={`statusPill ${booking.status}`}>
                      {booking.status}
                    </span>
                  </td>

                  <td>{booking.reschedule_count} / 3</td>

                  <td>{booking.profiles?.full_name || "-"}</td>

                  <td>{booking.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Schedule Rules</h2>
        <p>
          Classes that show as <strong>scheduled</strong> are waiting for admin
          approval. Once approved, they become active classes. Completed, missed,
          and cancelled classes are final records.
        </p>
      </div>
    </section>
  );
}

export default StudentSchedule;