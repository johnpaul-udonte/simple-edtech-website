import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  approveScheduleRequestForTutor,
  getScheduleRequestsForTutor,
  rejectScheduleRequestForTutor,
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

function getStatusLabel(status) {
  const labels = {
    pending_tutor: "Waiting for Tutor",
    tutor_approved: "Tutor Approved",
    tutor_rejected: "Tutor Rejected",
    admin_approved: "Admin Approved",
    admin_rejected: "Admin Rejected",
    superseded: "Superseded",
  };

  return labels[status] || status || "-";
}

function TutorSchedule() {
  const { profile } = useAuth();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [tutorNotes, setTutorNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [processingId, setProcessingId] = useState("");

  async function loadTutorScheduleRequests() {
    setIsLoading(true);
    setNotice("");
    setErrorMessage("");

    if (!profile?.id) {
      setErrorMessage("No active tutor profile found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getScheduleRequestsForTutor(profile.id);

    if (error) {
      setErrorMessage(error.message || "Could not load tutor schedule requests.");
      setIsLoading(false);
      return;
    }

    setRequests(data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadTutorScheduleRequests();
  }, [profile?.id]);

  const summary = useMemo(() => {
    return {
      total: requests.length,
      pendingTutor: requests.filter((item) => item.status === "pending_tutor")
        .length,
      tutorApproved: requests.filter((item) => item.status === "tutor_approved")
        .length,
      adminApproved: requests.filter((item) => item.status === "admin_approved")
        .length,
      rejected: requests.filter((item) =>
        ["tutor_rejected", "admin_rejected"].includes(item.status)
      ).length,
    };
  }, [requests]);

  function openReview(request) {
    setSelectedRequest(request);
    setTutorNotes(request.tutor_notes || "");
    setNotice("");
    setErrorMessage("");
  }

  async function handleApprove(request) {
    const confirmed = window.confirm(
      `Approve schedule request for ${request.student_name}?`
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setNotice("");
    setErrorMessage("");

    const { error } = await approveScheduleRequestForTutor(
      request,
      profile,
      tutorNotes
    );

    if (error) {
      setErrorMessage(error.message || "Could not approve schedule request.");
      setProcessingId("");
      return;
    }

    setNotice(
      `${request.student_name}'s schedule has been approved by tutor and sent to admin for final approval.`
    );
    setProcessingId("");
    setSelectedRequest(null);
    setTutorNotes("");

    await loadTutorScheduleRequests();
  }

  async function handleReject(request) {
    const confirmed = window.confirm(
      `Reject schedule request for ${request.student_name}?`
    );

    if (!confirmed) return;

    setProcessingId(request.id);
    setNotice("");
    setErrorMessage("");

    const { error } = await rejectScheduleRequestForTutor(
      request,
      profile,
      tutorNotes
    );

    if (error) {
      setErrorMessage(error.message || "Could not reject schedule request.");
      setProcessingId("");
      return;
    }

    setNotice(`${request.student_name}'s schedule request has been rejected.`);
    setProcessingId("");
    setSelectedRequest(null);
    setTutorNotes("");

    await loadTutorScheduleRequests();
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading tutor schedule...</h2>
        <p>Please wait while your schedule requests are loaded.</p>
      </section>
    );
  }

  return (
    <section className="tutorSchedulePage">
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Schedule Approval</p>
          <h1>Student Schedule Requests</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. Review student schedule
            requests, approve suitable times, or reject requests that do not fit
            your availability.
          </p>
        </div>

        <div className="headerActionGroup">
          <button type="button" onClick={loadTutorScheduleRequests}>
            Refresh
          </button>

          <Link to="/tutor/students" className="headerSecondaryBtn">
            View Students
          </Link>
        </div>
      </header>

      {notice && <div className="successNotice">{notice}</div>}
      {errorMessage && <div className="errorNotice">{errorMessage}</div>}

      <section className="scheduleSummaryGrid">
        <article className="dashboardCard">
          <p>Total Requests</p>
          <h2>{summary.total}</h2>
        </article>

        <article className="dashboardCard">
          <p>Waiting for You</p>
          <h2>{summary.pendingTutor}</h2>
        </article>

        <article className="dashboardCard">
          <p>Sent to Admin</p>
          <h2>{summary.tutorApproved}</h2>
        </article>

        <article className="dashboardCard">
          <p>Fully Approved</p>
          <h2>{summary.adminApproved}</h2>
        </article>

        <article className="dashboardCard">
          <p>Rejected</p>
          <h2>{summary.rejected}</h2>
        </article>
      </section>

      <section className="dashboardPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Schedule Requests</h2>
            <p>
              Requests marked <strong>Waiting for Tutor</strong> need your
              approval before admin can give final approval.
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No schedule request yet</h3>
            <p>
              No student assigned to you has submitted a schedule request yet.
              Once they do, it will appear here.
            </p>
          </div>
        ) : (
          <div className="tableScroll">
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

                    <td>{request.learning_mode || "-"}</td>

                    <td>
                      <span className={`statusPill ${request.status}`}>
                        {getStatusLabel(request.status)}
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
          </div>
        )}
      </section>

      {selectedRequest && (
        <section className="dashboardPanel scheduleReviewPanel">
          <div className="panelHeaderRow">
            <div>
              <p className="eyebrow">Review Request</p>
              <h2>{selectedRequest.student_name || "Student Schedule"}</h2>
              <p>
                Approve this request only if the proposed class days and times
                are suitable for you.
              </p>
            </div>

            <button
              type="button"
              className="tableActionBtn"
              onClick={() => {
                setSelectedRequest(null);
                setTutorNotes("");
              }}
            >
              Close
            </button>
          </div>

          <div className="scheduleReviewGrid">
            <article>
              <h3>Student Details</h3>
              <p>
                <strong>Name:</strong> {selectedRequest.student_name || "-"}
              </p>
              <p>
                <strong>Email:</strong> {selectedRequest.student_email || "-"}
              </p>
              <p>
                <strong>Mode:</strong> {selectedRequest.learning_mode || "-"}
              </p>
            </article>

            <article>
              <h3>Requested Time</h3>

              {getScheduleSlots(selectedRequest).map((slot, index) => (
                <p key={`${slot.day}-${index}`}>
                  <strong>Class {index + 1}:</strong> {slot.day} — {slot.time}
                </p>
              ))}
            </article>

            <article>
              <h3>Student Note</h3>
              <p>{selectedRequest.request_notes || "No note provided."}</p>
            </article>

            <article>
              <h3>Tutor Decision Note</h3>

              <label className="adminNotesBox">
                Note to student/admin
                <textarea
                  rows="4"
                  value={tutorNotes}
                  placeholder="Add a reason or confirmation note..."
                  onChange={(event) => setTutorNotes(event.target.value)}
                />
              </label>
            </article>
          </div>

          <div className="tableActionGroup">
            <button
              type="button"
              className="tableActionBtn restoreBtn"
              disabled={
                processingId === selectedRequest.id ||
                selectedRequest.status !== "pending_tutor"
              }
              onClick={() => handleApprove(selectedRequest)}
            >
              {processingId === selectedRequest.id
                ? "Processing..."
                : "Approve and Send to Admin"}
            </button>

            <button
              type="button"
              className="tableActionBtn dangerBtn"
              disabled={
                processingId === selectedRequest.id ||
                selectedRequest.status !== "pending_tutor"
              }
              onClick={() => handleReject(selectedRequest)}
            >
              Reject Request
            </button>
          </div>

          {selectedRequest.status !== "pending_tutor" && (
            <p className="mutedText">
              This request has already been handled and can no longer be changed
              by tutor.
            </p>
          )}
        </section>
      )}

      <section className="dashboardPanel">
        <h2>Approval Rules</h2>
        <p>
          A student schedule must first be approved by the assigned tutor. After
          tutor approval, admin must give the final approval before the schedule
          becomes fully approved.
        </p>
      </section>
    </section>
  );
}

export default TutorSchedule;