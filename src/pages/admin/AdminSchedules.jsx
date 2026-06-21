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

function getStatusLabel(status) {
  const labels = {
    pending_tutor: "Waiting for Tutor",
    tutor_approved: "Ready for Admin",
    tutor_rejected: "Tutor Rejected",
    admin_approved: "Fully Approved",
    admin_rejected: "Admin Rejected",
    superseded: "Superseded",
  };

  return labels[status] || status || "-";
}

function getStatusClass(status) {
  if (status === "pending_tutor") return "pending";
  if (status === "tutor_approved") return "approved";
  if (status === "admin_approved") return "issued";
  if (["tutor_rejected", "admin_rejected"].includes(status)) return "urgent";
  return "pending";
}

function getTutorDecisionText(request) {
  if (request.status === "tutor_approved") return "Approved by Tutor";
  if (request.status === "tutor_rejected") return "Rejected by Tutor";
  if (request.status === "pending_tutor") return "Waiting for Tutor";
  if (request.status === "admin_approved") return "Tutor Approved";
  if (request.status === "admin_rejected") return "Admin Rejected";
  return getStatusLabel(request.status);
}

function AdminSchedules() {
  const { profile } = useAuth();

  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState("");

  async function loadRequests() {
    setIsLoading(true);
    setErrorMessage("");
    setNotice("");

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
      waitingTutor: requests.filter((item) => item.status === "pending_tutor")
        .length,
      readyForAdmin: requests.filter((item) => item.status === "tutor_approved")
        .length,
      fullyApproved: requests.filter((item) => item.status === "admin_approved")
        .length,
      rejected: requests.filter((item) =>
        ["tutor_rejected", "admin_rejected"].includes(item.status)
      ).length,
    };
  }, [requests]);

  const filteredRequests = useMemo(() => {
    if (activeFilter === "all") return requests;

    if (activeFilter === "rejected") {
      return requests.filter((request) =>
        ["tutor_rejected", "admin_rejected"].includes(request.status)
      );
    }

    return requests.filter((request) => request.status === activeFilter);
  }, [requests, activeFilter]);

  function openReview(request) {
    setSelectedRequest(request);
    setAdminNotes(request.admin_notes || "");
    setNotice("");
    setErrorMessage("");
  }

  function closeReview() {
    setSelectedRequest(null);
    setAdminNotes("");
    setNotice("");
    setErrorMessage("");
  }

  async function handleApprove(request) {
    const confirmed = window.confirm(
      `Give final admin approval for ${request.student_name}'s schedule?`
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

    setNotice(
      `${request.student_name}'s schedule has received final admin approval.`
    );

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

    setNotice(
      `${request.student_name}'s schedule request has been rejected by admin.`
    );

    setProcessingId("");
    setSelectedRequest(null);
    setAdminNotes("");

    await loadRequests();
  }

  return (
    <section className="adminSchedulePage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Schedule Approval</p>
          <h1>Student Schedule Requests</h1>
          <p>
            Tutor must approve a student’s selected weekly schedule first. Admin
            gives final approval after tutor confirmation.
          </p>
        </div>

        <button type="button" onClick={loadRequests}>
          Refresh
        </button>
      </header>

      {notice && (
        <div className="successNotice">
          <strong>Success:</strong> {notice}
        </div>
      )}

      {errorMessage && (
        <div className="errorNotice">
          <strong>Error:</strong> {errorMessage}
        </div>
      )}

      <section className="adminScheduleSummaryGrid">
        <article className="dashboardCard">
          <p>Total Requests</p>
          <h2>{summary.total}</h2>
        </article>

        <article className="dashboardCard">
          <p>Waiting Tutor</p>
          <h2>{summary.waitingTutor}</h2>
        </article>

        <article className="dashboardCard">
          <p>Ready for Admin</p>
          <h2>{summary.readyForAdmin}</h2>
        </article>

        <article className="dashboardCard">
          <p>Fully Approved</p>
          <h2>{summary.fullyApproved}</h2>
        </article>

        <article className="dashboardCard">
          <p>Rejected</p>
          <h2>{summary.rejected}</h2>
        </article>
      </section>

      <section className="adminScheduleFilterBar">
        <button
          type="button"
          className={activeFilter === "all" ? "active" : ""}
          onClick={() => setActiveFilter("all")}
        >
          All
        </button>

        <button
          type="button"
          className={activeFilter === "pending_tutor" ? "active" : ""}
          onClick={() => setActiveFilter("pending_tutor")}
        >
          Waiting Tutor
        </button>

        <button
          type="button"
          className={activeFilter === "tutor_approved" ? "active" : ""}
          onClick={() => setActiveFilter("tutor_approved")}
        >
          Ready for Admin
        </button>

        <button
          type="button"
          className={activeFilter === "admin_approved" ? "active" : ""}
          onClick={() => setActiveFilter("admin_approved")}
        >
          Approved
        </button>

        <button
          type="button"
          className={activeFilter === "rejected" ? "active" : ""}
          onClick={() => setActiveFilter("rejected")}
        >
          Rejected
        </button>
      </section>

      <section className="dashboardPanel adminScheduleTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Schedule Request List</h2>
            <p>
              Only requests marked <strong>Ready for Admin</strong> can receive
              final approval.
            </p>
          </div>
        </div>

        {isLoading ? (
          <p>Loading schedule requests...</p>
        ) : filteredRequests.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No schedule request found</h3>
            <p>
              No schedule request matches the selected filter. New student
              requests will appear here after submission.
            </p>
          </div>
        ) : (
          <div className="adminScheduleTableWrap">
            <table className="adminScheduleTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Schedule</th>
                  <th>Mode</th>
                  <th>Tutor Decision</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>
                      <strong>{request.student_name || "-"}</strong>
                      <small>{request.student_email || "-"}</small>
                    </td>

                    <td>{formatSchedule(request)}</td>

                    <td>{request.learning_mode || "-"}</td>

                    <td>
                      <strong>{getTutorDecisionText(request)}</strong>
                      <small>
                        {request.tutor_notes
                          ? request.tutor_notes
                          : "No tutor note"}
                      </small>
                    </td>

                    <td>
                      <span
                        className={`statusPill ${getStatusClass(
                          request.status
                        )}`}
                      >
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
        <section className="dashboardPanel adminScheduleReviewPanel">
          <div className="panelHeaderRow">
            <div>
              <p className="eyebrow">Final Admin Review</p>
              <h2>{selectedRequest.student_name || "Student Schedule"}</h2>
              <p>
                Review the student’s request and the tutor’s decision before
                giving final approval.
              </p>
            </div>

            <button
              type="button"
              className="tableActionBtn"
              onClick={closeReview}
            >
              Close
            </button>
          </div>

          <div className="adminScheduleReviewGrid">
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
              <p>
                <strong>Status:</strong>{" "}
                <span
                  className={`statusPill ${getStatusClass(
                    selectedRequest.status
                  )}`}
                >
                  {getStatusLabel(selectedRequest.status)}
                </span>
              </p>
            </article>

            <article>
              <h3>Requested Schedule</h3>

              {getScheduleSlots(selectedRequest).length === 0 ? (
                <p>No schedule slot was provided.</p>
              ) : (
                getScheduleSlots(selectedRequest).map((slot, index) => (
                  <p key={`${slot.day}-${index}`}>
                    <strong>Class {index + 1}:</strong> {slot.day} — {slot.time}
                  </p>
                ))
              )}
            </article>

            <article>
              <h3>Student Note</h3>
              <p>{selectedRequest.request_notes || "No note provided."}</p>
            </article>

            <article>
              <h3>Tutor Decision</h3>
              <p>
                <strong>Tutor Status:</strong>{" "}
                {getTutorDecisionText(selectedRequest)}
              </p>
              <p>
                <strong>Tutor Note:</strong>{" "}
                {selectedRequest.tutor_notes || "No tutor note yet."}
              </p>
              <p>
                <strong>Tutor Decision Date:</strong>{" "}
                {formatDateTime(selectedRequest.tutor_decided_at)}
              </p>
            </article>

            <article className="adminDecisionNoteCard">
              <h3>Admin Decision Note</h3>

              <label className="adminNotesBox">
                Admin Notes
                <textarea
                  rows="4"
                  value={adminNotes}
                  placeholder="Add final approval or rejection note..."
                  onChange={(event) => setAdminNotes(event.target.value)}
                />
              </label>
            </article>
          </div>

          {selectedRequest.status === "pending_tutor" && (
            <div className="formNotice">
              This request is still waiting for tutor approval. Admin cannot
              approve it yet, but admin may reject it if necessary.
            </div>
          )}

          {selectedRequest.status === "tutor_rejected" && (
            <div className="errorNotice">
              Tutor has rejected this request. Admin final approval is not
              available for this request.
            </div>
          )}

          {selectedRequest.status === "admin_approved" && (
            <div className="successNotice">
              This schedule has already received final admin approval.
            </div>
          )}

          {selectedRequest.status === "admin_rejected" && (
            <div className="errorNotice">
              This schedule has already been rejected by admin.
            </div>
          )}

          <div className="tableActionGroup adminScheduleActionGroup">
            <button
              type="button"
              className="tableActionBtn restoreBtn"
              disabled={
                processingId === selectedRequest.id ||
                selectedRequest.status !== "tutor_approved"
              }
              onClick={() => handleApprove(selectedRequest)}
            >
              {processingId === selectedRequest.id
                ? "Processing..."
                : "Give Final Approval"}
            </button>

            <button
              type="button"
              className="tableActionBtn dangerBtn"
              disabled={
                processingId === selectedRequest.id ||
                !["pending_tutor", "tutor_approved"].includes(
                  selectedRequest.status
                )
              }
              onClick={() => handleReject(selectedRequest)}
            >
              Reject Request
            </button>
          </div>
        </section>
      )}

      <section className="dashboardPanel adminScheduleRulesPanel">
        <h2>Approval Rules</h2>
        <p>
          Schedule requests must first be approved by the assigned tutor. After
          tutor approval, admin gives final approval. Once approved, both student
          and tutor receive the final schedule status.
        </p>
      </section>
    </section>
  );
}

export default AdminSchedules;