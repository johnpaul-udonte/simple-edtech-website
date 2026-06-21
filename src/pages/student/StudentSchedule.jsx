import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getMyScheduleRequests,
  submitStudentScheduleRequest,
} from "../../services/scheduleRequestService";

const weekDays = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

function formatHour(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

const timeOptions = Array.from({ length: 24 }, (_, hour) => {
  const nextHour = (hour + 1) % 24;
  return `${formatHour(hour)} - ${formatHour(nextHour)}`;
});

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
    pending: "Waiting for Tutor",
    approved: "Fully Approved",
    rejected: "Rejected",
    pending_tutor: "Waiting for Tutor",
    tutor_approved: "Waiting for Admin",
    tutor_rejected: "Tutor Rejected",
    admin_approved: "Fully Approved",
    admin_rejected: "Admin Rejected",
    superseded: "Superseded",
  };

  return labels[status] || status || "-";
}

function getStatusClass(status) {
  if (["pending", "pending_tutor", "tutor_approved"].includes(status)) {
    return "pending";
  }

  if (["approved", "admin_approved"].includes(status)) {
    return "issued";
  }

  if (["rejected", "tutor_rejected", "admin_rejected"].includes(status)) {
    return "urgent";
  }

  return "pending";
}

function getApprovalStep(status) {
  if (["pending", "pending_tutor"].includes(status)) {
    return 1;
  }

  if (status === "tutor_approved") {
    return 2;
  }

  if (["approved", "admin_approved"].includes(status)) {
    return 3;
  }

  return 0;
}

function StudentSchedule() {
  const { profile } = useAuth();

  const [requests, setRequests] = useState([]);
  const [scheduleSlots, setScheduleSlots] = useState([
    { day: "", time: "" },
    { day: "", time: "" },
  ]);
  const [learningMode, setLearningMode] = useState("Online");
  const [requestNotes, setRequestNotes] = useState("");
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function loadRequests() {
    setIsLoading(true);
    setErrorMessage("");

    if (!profile?.id) {
      setErrorMessage("No active student profile found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getMyScheduleRequests(profile.id);

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
  }, [profile?.id]);

  const approvedSchedule = useMemo(() => {
    return requests.find((item) =>
      ["approved", "admin_approved"].includes(item.status)
    );
  }, [requests]);

  const activeRequest = useMemo(() => {
    return requests.find((item) =>
      ["pending", "pending_tutor", "tutor_approved"].includes(item.status)
    );
  }, [requests]);

  const latestRequest = useMemo(() => {
    return requests[0] || null;
  }, [requests]);

  const summary = useMemo(() => {
    return {
      total: requests.length,
      waitingTutor: requests.filter((item) =>
        ["pending", "pending_tutor"].includes(item.status)
      ).length,
      waitingAdmin: requests.filter((item) => item.status === "tutor_approved")
        .length,
      approved: requests.filter((item) =>
        ["approved", "admin_approved"].includes(item.status)
      ).length,
      rejected: requests.filter((item) =>
        ["rejected", "tutor_rejected", "admin_rejected"].includes(item.status)
      ).length,
    };
  }, [requests]);

  function updateSlot(index, field, value) {
    setNotice("");
    setErrorMessage("");

    setScheduleSlots((current) =>
      current.map((slot, slotIndex) => {
        if (slotIndex !== index) return slot;

        return {
          ...slot,
          [field]: value,
        };
      })
    );
  }

  function validateSlots() {
    const hasEmptySlot = scheduleSlots.some((slot) => !slot.day || !slot.time);

    if (hasEmptySlot) {
      return "Please select day and time for both class days.";
    }

    if (scheduleSlots[0].day === scheduleSlots[1].day) {
      return "Please choose 2 different days.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setNotice("");
    setErrorMessage("");

    if (activeRequest) {
      setErrorMessage(
        "You already have a schedule request in progress. Please wait for tutor/admin approval before submitting another request."
      );
      return;
    }

    const slotError = validateSlots();

    if (slotError) {
      setErrorMessage(slotError);
      return;
    }

    setIsSubmitting(true);

    const { error } = await submitStudentScheduleRequest({
      profile,
      requestedSlots: scheduleSlots,
      learningMode,
      requestNotes,
    });

    if (error) {
      setErrorMessage(error.message || "Could not submit schedule request.");
      setIsSubmitting(false);
      return;
    }

    setNotice(
      "Your schedule request has been submitted. It will first go to your tutor, then admin will give final approval."
    );

    setScheduleSlots([
      { day: "", time: "" },
      { day: "", time: "" },
    ]);
    setLearningMode("Online");
    setRequestNotes("");
    setIsSubmitting(false);

    await loadRequests();
  }

  const latestStep = getApprovalStep(latestRequest?.status);

  return (
    <section className="studentSchedulePage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Student Schedule</p>
          <h1>Choose Weekly Schedule</h1>
          <p>
            Select 2 different class days. Your request will first be reviewed
            by your assigned tutor, then admin will give the final approval.
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

      <section className="studentScheduleSummaryGrid">
        <article className="dashboardCard">
          <p>Total Requests</p>
          <h2>{summary.total}</h2>
        </article>

        <article className="dashboardCard">
          <p>Waiting Tutor</p>
          <h2>{summary.waitingTutor}</h2>
        </article>

        <article className="dashboardCard">
          <p>Waiting Admin</p>
          <h2>{summary.waitingAdmin}</h2>
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

      {latestRequest && (
        <section className="dashboardPanel studentScheduleStatusPanel">
          <div>
            <p className="eyebrow">Latest Schedule Status</p>
            <h2>{getStatusLabel(latestRequest.status)}</h2>
            <p>{formatSchedule(latestRequest)}</p>
          </div>

          <div className="scheduleApprovalSteps">
            <span className={latestStep >= 1 ? "active" : ""}>
              1. Tutor Review
            </span>
            <span className={latestStep >= 2 ? "active" : ""}>
              2. Admin Review
            </span>
            <span className={latestStep >= 3 ? "active" : ""}>
              3. Fully Approved
            </span>
          </div>
        </section>
      )}

      {approvedSchedule && (
        <section className="dashboardPanel approvedSchedulePanel">
          <p className="eyebrow">Approved Schedule</p>
          <h2>{formatSchedule(approvedSchedule)}</h2>
          <p>
            Mode: <strong>{approvedSchedule.learning_mode}</strong>
          </p>
        </section>
      )}

      {activeRequest && (
        <section className="dashboardPanel pendingSchedulePanel">
          <p className="eyebrow">Request in Progress</p>
          <h2>{formatSchedule(activeRequest)}</h2>
          <p>
            Current status:{" "}
            <span className={`statusPill ${getStatusClass(activeRequest.status)}`}>
              {getStatusLabel(activeRequest.status)}
            </span>
          </p>
          <p>
            You cannot submit another schedule request until this request is
            approved or rejected.
          </p>
        </section>
      )}

      <section className="dashboardPanel studentScheduleFormPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Request Your Weekly Class Schedule</h2>
            <p>
              Choose two different class days and a 1-hour class time for each
              day.
            </p>
          </div>
        </div>

        <form className="scheduleRequestForm" onSubmit={handleSubmit}>
          <div className="scheduleSlotGrid">
            {scheduleSlots.map((slot, index) => (
              <div className="scheduleSlotCard" key={index}>
                <h3>Class Day {index + 1}</h3>

                <label className="scheduleFormLabel">
                  Day
                  <select
                    value={slot.day}
                    onChange={(event) =>
                      updateSlot(index, "day", event.target.value)
                    }
                    disabled={Boolean(activeRequest)}
                  >
                    <option value="">Select day</option>
                    {weekDays.map((day) => (
                      <option
                        key={day}
                        value={day}
                        disabled={scheduleSlots.some(
                          (item, itemIndex) =>
                            itemIndex !== index && item.day === day
                        )}
                      >
                        {day}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="scheduleFormLabel">
                  Time
                  <select
                    value={slot.time}
                    onChange={(event) =>
                      updateSlot(index, "time", event.target.value)
                    }
                    disabled={Boolean(activeRequest)}
                  >
                    <option value="">Select 1-hour time</option>
                    {timeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            ))}
          </div>

          <label className="scheduleFormLabel">
            Learning Mode
            <select
              value={learningMode}
              onChange={(event) => setLearningMode(event.target.value)}
              disabled={Boolean(activeRequest)}
            >
              <option value="Online">Online</option>
              <option value="Physical">Physical</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </label>

          <label className="scheduleFormLabel">
            Notes for Tutor/Admin
            <textarea
              rows="4"
              value={requestNotes}
              placeholder="Add any schedule note here..."
              onChange={(event) => setRequestNotes(event.target.value)}
              disabled={Boolean(activeRequest)}
            />
          </label>

          <button type="submit" disabled={isSubmitting || Boolean(activeRequest)}>
            {isSubmitting ? "Submitting..." : "Submit Schedule Request"}
          </button>
        </form>
      </section>

      <section className="dashboardPanel studentScheduleTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>My Schedule Requests</h2>
            <p>
              Track tutor approval, admin approval, notes, and final schedule
              status.
            </p>
          </div>
        </div>

        {isLoading ? (
          <p>Loading schedule requests...</p>
        ) : requests.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No schedule request yet</h3>
            <p>
              Submit your first weekly schedule request using the form above.
            </p>
          </div>
        ) : (
          <div className="studentScheduleTableWrap">
            <table className="studentScheduleTable">
              <thead>
                <tr>
                  <th>Schedule</th>
                  <th>Mode</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th>Tutor Note</th>
                  <th>Admin Note</th>
                </tr>
              </thead>

              <tbody>
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td>{formatSchedule(request)}</td>

                    <td>{request.learning_mode || "-"}</td>

                    <td>
                      <span className={`statusPill ${getStatusClass(request.status)}`}>
                        {getStatusLabel(request.status)}
                      </span>
                    </td>

                    <td>{formatDateTime(request.created_at)}</td>

                    <td>{request.tutor_notes || "-"}</td>

                    <td>{request.admin_notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default StudentSchedule;