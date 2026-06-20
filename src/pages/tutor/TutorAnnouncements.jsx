import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createAnnouncementForTutor,
  getTutorAnnouncementsForCurrentUser,
} from "../../services/tutorService";

function TutorAnnouncements() {
  const { session, profile } = useAuth();

  const [announcementData, setAnnouncementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    priority: "normal",
    status: "published",
    expires_at: "",
  });

  async function loadAnnouncements() {
    if (!session?.user?.id) {
      setNotice("No active tutor session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getTutorAnnouncementsForCurrentUser(
      session.user.id
    );

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setAnnouncementData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadAnnouncements();
  }, [session]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setAnnouncementForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateAnnouncement(event) {
    event.preventDefault();

    setSuccessMessage("");
    setActionError("");

    if (!announcementForm.title.trim()) {
      setActionError("Announcement title is required.");
      return;
    }

    if (!announcementForm.body.trim()) {
      setActionError("Announcement message is required.");
      return;
    }

    const userId = session?.user?.id;

    if (!userId) {
      setActionError("Tutor session not found. Please log in again.");
      return;
    }

    setIsCreating(true);

    const { error } = await createAnnouncementForTutor(userId, announcementForm);

    if (error) {
      setActionError(error.message);
      setIsCreating(false);
      return;
    }

    setSuccessMessage("Announcement posted successfully.");

    setAnnouncementForm({
      title: "",
      body: "",
      priority: "normal",
      status: "published",
      expires_at: "",
    });

    await loadAnnouncements();
    setIsCreating(false);
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading announcements...</h2>
        <p>Please wait while your announcements are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Announcement issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const announcements = announcementData?.announcements || [];
  const publishedAnnouncements = announcements.filter(
    (item) => item.status === "published"
  );
  const draftAnnouncements = announcements.filter((item) => item.status === "draft");

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Announcements</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. Post announcements for
            your assigned students.
          </p>
        </div>

        <button>Post Announcement</button>
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
          <p>Total Announcements</p>
          <h2>{announcements.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{publishedAnnouncements.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Drafts</p>
          <h2>{draftAnnouncements.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Specialisation</p>
          <h2>{announcementData?.tutor?.specialisation || "Not set"}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Create Announcement</h2>

        <form className="portalForm" onSubmit={handleCreateAnnouncement}>
          <div className="formGrid">
            <label>
              Title
              <input
                type="text"
                name="title"
                value={announcementForm.title}
                onChange={handleFormChange}
                placeholder="Example: Power BI class reminder"
              />
            </label>

            <label>
              Priority
              <select
                name="priority"
                value={announcementForm.priority}
                onChange={handleFormChange}
              >
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </label>

            <label>
              Status
              <select
                name="status"
                value={announcementForm.status}
                onChange={handleFormChange}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>

            <label>
              Expiry Date
              <input
                type="date"
                name="expires_at"
                value={announcementForm.expires_at}
                onChange={handleFormChange}
              />
            </label>
          </div>

          <label>
            Message
            <textarea
              name="body"
              value={announcementForm.body}
              onChange={handleFormChange}
              rows="5"
              placeholder="Write the message for your students."
            />
          </label>

          <button className="tableActionBtn" type="submit" disabled={isCreating}>
            {isCreating ? "Posting..." : "Post Announcement"}
          </button>
        </form>
      </div>

      <div className="dashboardPanel">
        <h2>My Announcements</h2>

        {announcements.length === 0 ? (
          <p>You have not posted any announcements yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Announcement</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Audience</th>
                <th>Expires</th>
                <th>Created</th>
              </tr>
            </thead>

            <tbody>
              {announcements.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <br />
                    <small>{item.body}</small>
                  </td>

                  <td>
                    <span className={`statusPill ${item.priority}`}>
                      {item.priority}
                    </span>
                  </td>

                  <td>
                    <span className={`statusPill ${item.status}`}>
                      {item.status}
                    </span>
                  </td>

                  <td>{item.audience}</td>

                  <td>{item.expires_at || "-"}</td>

                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default TutorAnnouncements;