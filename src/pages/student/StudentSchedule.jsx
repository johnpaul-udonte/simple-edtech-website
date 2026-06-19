import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAvailableClassSlotsForStudent,
  getStudentScheduleForCurrentUser,
  requestClassBooking,
} from "../../services/studentService";

function StudentSchedule() {
  const { session, profile } = useAuth();

  const [scheduleData, setScheduleData] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [requestingSlotId, setRequestingSlotId] = useState("");

  async function loadStudentSchedule() {
    if (!session?.user?.id) {
      setNotice("No active student session found.");
      setIsLoading(false);
      return;
    }

    const { data: scheduleResult, error: scheduleError } =
      await getStudentScheduleForCurrentUser(session.user.id);

    if (scheduleError) {
      setNotice(scheduleError.message);
      setIsLoading(false);
      return;
    }

    const { data: slotsResult, error: slotsError } =
      await getAvailableClassSlotsForStudent();

    if (slotsError) {
      setNotice(slotsError.message);
      setIsLoading(false);
      return;
    }

    setScheduleData(scheduleResult);
    setAvailableSlots(slotsResult || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStudentSchedule();
  }, [session]);

  async function handleRequestClass(slot) {
    setSuccessMessage("");
    setActionError("");
    setRequestingSlotId(slot.id);

    const userId = session?.user?.id;

    if (!userId) {
      setActionError("Student session not found. Please log in again.");
      setRequestingSlotId("");
      return;
    }

    const tutorId = slot.tutors?.id;

    if (!tutorId) {
      setActionError("This class slot does not have a tutor assigned.");
      setRequestingSlotId("");
      return;
    }

    const { error } = await requestClassBooking(userId, slot.id, tutorId);

    if (error) {
      setActionError(error.message);
      setRequestingSlotId("");
      return;
    }

    setSuccessMessage(
      "Class request submitted successfully. Admin will approve it."
    );

    await loadStudentSchedule();
    setRequestingSlotId("");
  }

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
            Welcome, {profile?.full_name || "Student"}. View your class history
            and request available class slots.
          </p>
        </div>

        <button>Request New Class</button>
      </div>

      {successMessage && (
        <div className="successNotice">
          <strong>Success:</strong> {successMessage}
        </div>
      )}

      {actionError && (
        <div className="errorNotice">
          <strong>Error:</strong> {actionError}
        </div>
      )}

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
        <h2>Available Class Slots</h2>

        {availableSlots.length === 0 ? (
          <p>No available class slots at the moment.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Tutor</th>
                <th>Capacity</th>
                <th>Booked</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {availableSlots.map((slot) => {
                const isRequesting = requestingSlotId === slot.id;

                return (
                  <tr key={slot.id}>
                    <td>{slot.slot_date}</td>

                    <td>
                      {slot.start_time} - {slot.end_time}
                    </td>

                    <td>
                      {slot.tutors?.profiles?.full_name || "Tutor not assigned"}
                    </td>

                    <td>{slot.capacity}</td>

                    <td>{slot.booked_count}</td>

                    <td>
                      <button
                        className="tableActionBtn"
                        onClick={() => handleRequestClass(slot)}
                        disabled={isRequesting}
                      >
                        {isRequesting ? "Requesting..." : "Request Class"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
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
          When you request a class, it first appears as{" "}
          <strong>scheduled</strong>. Admin must approve it before it becomes an
          active class.
        </p>
      </div>
    </section>
  );
}

export default StudentSchedule;