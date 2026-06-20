import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  approveScheduleRequestForAdmin,
  getScheduleRequestsForAdmin,
  rejectScheduleRequestForAdmin,
} from "../../services/scheduleRequestService";

function formatDateTime(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getScheduleSlots(request) {
  if (Array.isArray(request?.requested_slots) && request.requested_slots.length) {
    return request.requested_slots;
  }

  if (Array.isArray(request?.requested_days)) {
    return request.requested_days.map((day) => ({
      day,
      time: request.requested_time || "-",
    }));
  }

  return [];
}

function formatSchedule(request) {
  const slots = getScheduleSlots(request);

  if (slots.length > 0) {
    return slots.map((slot) => `${slot.day}: ${slot.time}`).join(" | ");
  }

  return request?.requested_time || "-";
}

function AdminSchedules() {
  const { profile } = useAuth();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  async function loadRequests() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await getScheduleRequestsForAdmin();

    if (error) {
      setErrorMessage(error.message || "Could not load schedule requests.");
      setIsLoading(false);
      return;
    }

    setRequests(data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadRequests();
  }, []);

  const summary = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter((item) => item.status === "pending").length,
      approved: requests.filter((item) => item.status === "approved").length,
      rejected: requests.filter((item) => item.status === "rejected").length,
    };
  }, [requests]);

  function openReview(request) {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || "");
    setNotice("");
    setErrorMessage("");
  }

  async function handleApprove(request) {
    const confirmed = window.confirm(
      `Approve schedule for ${request.student_name}?`
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setNotice("");
    setErrorMessage("");

    const { error } = await approveScheduleRequestForAdmin(
      request,
      profile,
      adminNotes
    );

    if (error) {
      setErrorMessage(error.message || "Could not approve schedule.");
      setProcessingId("");
      return;
    }

    setNotice(`${request.student_name}'s schedule has been approved.`);
    setProcessingId("");
    setSelectedRequest(null);
    setAdminNotes("");
    await loadRequests();
  }

  async function handleReject(request) {
    const confirmed = window.confirm(
      `Reject schedule request for ${request.student_name}?`
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setNotice("");
    setErrorMessage("");

    const { error } = await rejectScheduleRequestForAdmin(
      request,
      profile,
      adminNotes
    );

    if (error) {
      setErrorMessage(error.message || "Could not reject schedule.");
      setProcessingId("");
      return;
    }

    setNotice(`${request.student_name}'s schedule request has been rejected.`);
    setProcessingId("");
    setSelectedRequest(null);
    setAdminNotes("");
    await loadRequests();
  }

  return (
    <>
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Schedule Approval</p>
          <h1>Student Schedule Requests</h1>
          <p>
            Review student weekly schedule choices. Each student must select 2
            different days, and each day can have a different 1-hour time.
          </p>
        </div>

        <button type="button" onClick={loadRequests}>
          Refresh
        </button>
      </header>

      {notice && <div className="successNotice">{notice}</div>}
      {errorMessage && <div className="errorNotice">{errorMessage}</div>}

      <section className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Requests</p>
          <h2>{summary.total}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending</p>
          <h2>{summary.pending}</h2>
        </article>

        <article className="dashboardCard">
          <p>Approved</p>
          <h2>{summary.approved}</h2>
        </article>

        <article className="dashboardCard">
          <p>Rejected</p>
          <h2>{summary.rejected}</h2>
        </article>
      </section>

      <section className="dashboardPanel">
        <h2>Schedule Request List</h2>

        {isLoading ? (
          <p>Loading schedule requests...</p>
        ) : requests.length === 0 ? (
          <p>No schedule request has been submitted yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Schedule</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>{request.student_name || "-"}</strong>
                    <br />
                    <small>{request.student_email || "-"}</small>
                  </td>
                  <td>{formatSchedule(request)}</td>
                  <td>{request.learning_mode}</td>
                  <td>
                    <span className={`statusPill ${request.status}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{formatDateTime(request.created_at)}</td>
                  <td>
                    <button
                      type="button"
                      className="tableActionBtn"
                      onClick={() => openReview(request)}
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {selectedRequest && (
        <section className="dashboardPanel">
          <div className="panelHeaderRow">
            <div>
              <h2>Review Schedule Request</h2>
              <p>
                Approve or reject this student's selected weekly class schedule.
              </p>
            </div>

            <button
              type="button"
              className="tableActionBtn"
              onClick={() => setSelectedRequest(null)}
            >
              Close
            </button>
          </div>

          <div className="applicationReviewGrid">
            <div>
              <h3>Student</h3>
              <p>
                <strong>Name:</strong> {selectedRequest.student_name || "-"}
              </p>
              <p>
                <strong>Email:</strong> {selectedRequest.student_email || "-"}
              </p>
              <p>
                <strong>Status:</strong> {selectedRequest.status}
              </p>
            </div>

            <div>
              <h3>Requested Schedule</h3>

              {getScheduleSlots(selectedRequest).map((slot, index) => (
                <p key={`${slot.day}-${index}`}>
                  <strong>Class {index + 1}:</strong> {slot.day} — {slot.time}
                </p>
              ))}

              <p>
                <strong>Mode:</strong> {selectedRequest.learning_mode}
              </p>
            </div>

            <div>
              <h3>Student Note</h3>
              <p>{selectedRequest.request_notes || "-"}</p>
            </div>

            <div>
              <h3>Admin Decision</h3>
              <label className="adminNotesBox">
                Admin Notes
                <textarea
                  rows="4"
                  value={adminNotes}
                  placeholder="Add approval or rejection note..."
                  onChange={(event) => setAdminNotes(event.target.value)}
                />
              </label>
            </div>
          </div>

          <div className="tableActionGroup">
            <button
              type="button"
              className="tableActionBtn restoreBtn"
              disabled={
                processingId === selectedRequest.id ||
                selectedRequest.status !== "pending"
              }
              onClick={() => handleApprove(selectedRequest)}
            >
              {processingId === selectedRequest.id
                ? "Processing..."
                : "Approve Schedule"}
            </button>

            <button
              type="button"
              className="tableActionBtn dangerBtn"
              disabled={
                processingId === selectedRequest.id ||
                selectedRequest.status !== "pending"
              }
              onClick={() => handleReject(selectedRequest)}
            >
              Reject Schedule
            </button>
          </div>
        </section>
      )}
    </>
  );
}

export default AdminSchedules;