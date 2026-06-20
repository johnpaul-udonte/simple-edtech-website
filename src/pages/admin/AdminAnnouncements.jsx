import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createAnnouncementForAdmin,
  getAnnouncementsForAdmin,
} from "../../services/adminService";

function AdminAnnouncements() {
  const { session } = useAuth();

  const [announcementData, setAnnouncementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [announcementForm, setAnnouncementForm] = useState({
    title: "",
    body: "",
    audience: "all_students",
    priority: "normal",
    status: "published",
    expires_at: "",
  });

  async function loadAnnouncements() {
    const { data, error } = await getAnnouncementsForAdmin();

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
  }, []);

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

    const adminUserId = session?.user?.id;

    if (!adminUserId) {
      setActionError("Admin session not found. Please log in again.");
      return;
    }

    setIsCreating(true);

    const { error } = await createAnnouncementForAdmin(
      adminUserId,
      announcementForm
    );

    if (error) {
      setActionError(error.message);
      setIsCreating(false);
      return;
    }

    setSuccessMessage("Announcement created successfully.");

    setAnnouncementForm({
      title: "",
      body: "",
      audience: "all_students",
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
        <p>Please wait while announcement records are loaded.</p>
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
  const summary = announcementData?.summary || {};

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Announcements</h1>
          <p>
            Create platform-wide announcements for students and monitor all
            admin and tutor announcements.
          </p>
        </div>

        <button>Create Announcement</button>
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
          <h2>{summary.totalAnnouncements || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{summary.publishedAnnouncements || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Drafts</p>
          <h2>{summary.draftAnnouncements || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>High Priority</p>
          <h2>{summary.highPriorityAnnouncements || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Urgent</p>
          <h2>{summary.urgentAnnouncements || 0}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Create New Announcement</h2>

        <form className="portalForm" onSubmit={handleCreateAnnouncement}>
          <div className="formGrid">
            <label>
              Title
              <input
                type="text"
                name="title"
                value={announcementForm.title}
                onChange={handleFormChange}
                placeholder="Example: Saturday Class Reminder"
              />
            </label>

            <label>
              Audience
              <select
                name="audience"
                value={announcementForm.audience}
                onChange={handleFormChange}
              >
                <option value="all_students">All Students</option>
                <option value="all_tutors">All Tutors</option>
                <option value="everyone">Everyone</option>
              </select>
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
              placeholder="Write the announcement message here."
            />
          </label>

          <button className="tableActionBtn" type="submit" disabled={isCreating}>
            {isCreating ? "Publishing..." : "Create Announcement"}
          </button>
        </form>
      </div>

      <div className="dashboardPanel">
        <h2>All Announcements</h2>

        {announcements.length === 0 ? (
          <p>No announcements have been created yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Announcement</th>
                <th>Author</th>
                <th>Audience</th>
                <th>Priority</th>
                <th>Status</th>
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
                    {item.profiles?.full_name ||
                      item.tutors?.profiles?.full_name ||
                      "Unknown Author"}
                    <br />
                    <small>
                      {item.profiles?.role ||
                        (item.tutor_id ? "Tutor" : "Admin")}
                    </small>
                  </td>

                  <td>{item.audience}</td>

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

export default AdminAnnouncements;