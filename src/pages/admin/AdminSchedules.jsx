import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  approveClassBooking,
  getSchedulesForAdmin,
  updateClassBookingStatus,
} from "../../services/adminService";

function AdminSchedules() {
  const { session } = useAuth();

  const [scheduleData, setScheduleData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [workingId, setWorkingId] = useState("");

  async function loadSchedules() {
    const { data, error } = await getSchedulesForAdmin();

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setScheduleData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadSchedules();
  }, []);

  async function handleApproveBooking(bookingId) {
    setActionError("");
    setSuccessMessage("");
    setWorkingId(bookingId);

    const adminUserId = session?.user?.id;

    if (!adminUserId) {
      setActionError("Admin session not found. Please log in again.");
      setWorkingId("");
      return;
    }

    const { error } = await approveClassBooking(bookingId, adminUserId);

    if (error) {
      setActionError(error.message);
      setWorkingId("");
      return;
    }

    setSuccessMessage("Class booking approved successfully.");
    await loadSchedules();
    setWorkingId("");
  }

  async function handleUpdateStatus(bookingId, newStatus) {
    setActionError("");
    setSuccessMessage("");
    setWorkingId(bookingId);

    const adminUserId = session?.user?.id;

    if (!adminUserId) {
      setActionError("Admin session not found. Please log in again.");
      setWorkingId("");
      return;
    }

    const { error } = await updateClassBookingStatus(
      bookingId,
      newStatus,
      adminUserId
    );

    if (error) {
      setActionError(error.message);
      setWorkingId("");
      return;
    }

    const messageMap = {
      completed: "Class marked as completed successfully.",
      missed: "Class marked as missed successfully.",
      cancelled: "Class booking cancelled successfully.",
    };

    setSuccessMessage(messageMap[newStatus] || "Class booking updated.");
    await loadSchedules();
    setWorkingId("");
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading schedules...</h2>
        <p>Please wait while class slots and bookings are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section>
        <div className="dashboardPanel">
          <h2>Schedule management issue</h2>
          <p>{notice}</p>
        </div>

        <button onClick={() => window.location.reload()}>Reload Page</button>
      </section>
    );
  }

  const slots = scheduleData?.slots || [];
  const bookings = scheduleData?.bookings || [];

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Schedule Approval</h1>
          <p>
            View real class slots, student bookings, approval status,
            reschedules, missed classes, cancelled classes, and completed
            classes from Supabase.
          </p>
        </div>

        <button>Create Class Slot</button>
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
          <p>Available Slots</p>
          <h2>{slots.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Approvals</p>
          <h2>{scheduleData?.pendingBookings?.length || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Approved Classes</p>
          <h2>{scheduleData?.approvedBookings?.length || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Completed Classes</p>
          <h2>{scheduleData?.completedBookings?.length || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Missed Classes</p>
          <h2>{scheduleData?.missedBookings?.length || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Cancelled Classes</p>
          <h2>{scheduleData?.cancelledBookings?.length || 0}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Class Slots</h2>

        {slots.length === 0 ? (
          <p>No class slots have been created yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Tutor</th>
                <th>Capacity</th>
                <th>Booked</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {slots.map((slot) => (
                <tr key={slot.id}>
                  <td>{slot.slot_date}</td>
                  <td>
                    {slot.start_time} - {slot.end_time}
                  </td>
                  <td>{slot.tutors?.profiles?.full_name || "No tutor assigned"}</td>
                  <td>{slot.capacity}</td>
                  <td>{slot.booked_count}</td>
                  <td>{slot.is_available ? "Available" : "Closed"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Class Bookings</h2>

        {bookings.length === 0 ? (
          <p>No student class bookings have been created yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Tutor</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Reschedules</th>
                <th>Approved By</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {bookings.map((booking) => {
                const isScheduled = booking.status === "scheduled";
                const isApproved = booking.status === "approved";
                const isFinalStatus = ["completed", "missed", "cancelled"].includes(
                  booking.status
                );
                const isWorking = workingId === booking.id;

                return (
                  <tr key={booking.id}>
                    <td>
                      {booking.students?.profiles?.full_name || "Unknown Student"}
                      <br />
                      <small>{booking.students?.student_code || "-"}</small>
                    </td>
                    <td>{booking.tutors?.profiles?.full_name || "No tutor assigned"}</td>
                    <td>{booking.class_slots?.slot_date || "-"}</td>
                    <td>
                      {booking.class_slots?.start_time || "-"} -{" "}
                      {booking.class_slots?.end_time || "-"}
                    </td>
                    <td>{booking.status}</td>
                    <td>{booking.reschedule_count} / 3</td>
                    <td>{booking.profiles?.full_name || "-"}</td>
                    <td>
                      {isScheduled && (
                        <div className="tableActionGroup">
                          <button
                            className="tableActionBtn"
                            onClick={() => handleApproveBooking(booking.id)}
                            disabled={isWorking}
                          >
                            {isWorking ? "Working..." : "Approve"}
                          </button>

                          <button
                            className="tableActionBtn dangerBtn"
                            onClick={() =>
                              handleUpdateStatus(booking.id, "cancelled")
                            }
                            disabled={isWorking}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {isApproved && (
                        <div className="tableActionGroup">
                          <button
                            className="tableActionBtn"
                            onClick={() =>
                              handleUpdateStatus(booking.id, "completed")
                            }
                            disabled={isWorking}
                          >
                            {isWorking ? "Working..." : "Completed"}
                          </button>

                          <button
                            className="tableActionBtn warningBtn"
                            onClick={() => handleUpdateStatus(booking.id, "missed")}
                            disabled={isWorking}
                          >
                            Missed
                          </button>

                          <button
                            className="tableActionBtn dangerBtn"
                            onClick={() =>
                              handleUpdateStatus(booking.id, "cancelled")
                            }
                            disabled={isWorking}
                          >
                            Cancel
                          </button>
                        </div>
                      )}

                      {isFinalStatus && (
                        <span className="mutedText">Final status</span>
                      )}
                    </td>
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

export default AdminSchedules;