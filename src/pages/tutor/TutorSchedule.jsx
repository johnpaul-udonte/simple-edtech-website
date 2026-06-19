import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getTutorScheduleForCurrentUser } from "../../services/tutorService";

function TutorSchedule() {
  const { session, profile } = useAuth();

  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadTutorSchedule() {
      if (!session?.user?.id) {
        setNotice("No active tutor session found.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getTutorScheduleForCurrentUser(
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

    loadTutorSchedule();
  }, [session]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading tutor schedule...</h2>
        <p>Please wait while your class bookings are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Tutor schedule issue</h2>
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

  const today = new Date().toISOString().slice(0, 10);

  const upcomingBookings = bookings.filter((booking) => {
    const slotDate = booking.class_slots?.slot_date;
    return slotDate && slotDate >= today && ["scheduled", "approved"].includes(booking.status);
  });

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>My Teaching Schedule</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. View your assigned class
            bookings, pending approvals, approved classes, and completed history.
          </p>
        </div>

        <button>View Students</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Bookings</p>
          <h2>{bookings.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Upcoming Classes</p>
          <h2>{upcomingBookings.length}</h2>
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
          <p>Specialisation</p>
          <h2>{scheduleData?.tutor?.specialisation || "Not set"}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Class Bookings</h2>

        {bookings.length === 0 ? (
          <p>No class bookings have been assigned to you yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Reschedules</th>
                <th>Approved By</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>
                    {booking.students?.profiles?.full_name || "Unknown Student"}
                    <br />
                    <small>{booking.students?.student_code || "-"}</small>
                  </td>

                  <td>{booking.students?.profiles?.email || "-"}</td>

                  <td>{booking.students?.enrolled_course || "Data Analysis"}</td>

                  <td>{booking.class_slots?.slot_date || "-"}</td>

                  <td>
                    {booking.class_slots?.start_time || "-"} -{" "}
                    {booking.class_slots?.end_time || "-"}
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
        <h2>Tutor Schedule Rules</h2>
        <p>
          Bookings marked as <strong>scheduled</strong> are waiting for admin
          approval. Bookings marked as <strong>approved</strong> are confirmed
          teaching sessions. Completed, missed, and cancelled classes are final
          records.
        </p>
      </div>
    </section>
  );
}

export default TutorSchedule;