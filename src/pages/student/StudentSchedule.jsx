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

    const { data, error } = await getMyScheduleRequests(profile?.id);

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
    return requests.find((item) => item.status === "approved");
  }, [requests]);

  const pendingRequest = useMemo(() => {
    return requests.find((item) => item.status === "pending");
  }, [requests]);

  function updateSlot(index, field, value) {
    setNotice("");
    setErrorMessage("");

    setScheduleSlots((current) => {
      return current.map((slot, slotIndex) => {
        if (slotIndex !== index) return slot;

        return {
          ...slot,
          [field]: value,
        };
      });
    });
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

    if (pendingRequest) {
      setErrorMessage(
        "You already have a pending schedule request. Please wait for admin approval."
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

    setNotice("Your schedule request has been submitted for admin approval.");
    setScheduleSlots([
      { day: "", time: "" },
      { day: "", time: "" },
    ]);
    setLearningMode("Online");
    setRequestNotes("");
    setIsSubmitting(false);

    await loadRequests();
  }

  return (
    <>
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Schedule</p>
          <h1>Choose Weekly Schedule</h1>
          <p>
            Select 2 different class days. Each day can have a different 1-hour
            class time. Admin will review and approve your request.
          </p>
        </div>

        <button type="button" onClick={loadRequests}>
          Refresh
        </button>
      </header>

      {notice && <div className="successNotice">{notice}</div>}
      {errorMessage && <div className="errorNotice">{errorMessage}</div>}

      {approvedSchedule && (
        <section className="dashboardPanel approvedSchedulePanel">
          <p className="eyebrow">Approved Schedule</p>
          <h2>{formatSchedule(approvedSchedule)}</h2>
          <p>
            Mode: <strong>{approvedSchedule.learning_mode}</strong>
          </p>
        </section>
      )}

      {pendingRequest && (
        <section className="dashboardPanel pendingSchedulePanel">
          <p className="eyebrow">Pending Approval</p>
          <h2>{formatSchedule(pendingRequest)}</h2>
          <p>
            Your request is waiting for admin approval. You cannot submit another
            request until this is approved or rejected.
          </p>
        </section>
      )}

      <section className="dashboardPanel">
        <h2>Request Your Weekly Class Schedule</h2>

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
                  >
                    <option value="">Select day</option>
                    {weekDays.map((day) => (
                      <option
                        key={day}
                        value={day}
                        disabled={
                          scheduleSlots.some(
                            (item, itemIndex) =>
                              itemIndex !== index && item.day === day
                          )
                        }
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
            >
              <option value="Online">Online</option>
              <option value="Physical">Physical</option>
              <option value="Hybrid">Hybrid</option>
            </select>
          </label>

          <label className="scheduleFormLabel">
            Notes for Admin
            <textarea
              rows="4"
              value={requestNotes}
              placeholder="Add any schedule note here..."
              onChange={(event) => setRequestNotes(event.target.value)}
            />
          </label>

          <button type="submit" disabled={isSubmitting || Boolean(pendingRequest)}>
            {isSubmitting ? "Submitting..." : "Submit Schedule Request"}
          </button>
        </form>
      </section>

      <section className="dashboardPanel">
        <h2>My Schedule Requests</h2>

        {isLoading ? (
          <p>Loading schedule requests...</p>
        ) : requests.length === 0 ? (
          <p>No schedule request yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Schedule</th>
                <th>Mode</th>
                <th>Status</th>
                <th>Submitted</th>
                <th>Admin Note</th>
              </tr>
            </thead>

            <tbody>
              {requests.map((request) => (
                <tr key={request.id}>
                  <td>{formatSchedule(request)}</td>
                  <td>{request.learning_mode}</td>
                  <td>
                    <span className={`statusPill ${request.status}`}>
                      {request.status}
                    </span>
                  </td>
                  <td>{formatDateTime(request.created_at)}</td>
                  <td>{request.admin_notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}

export default StudentSchedule;