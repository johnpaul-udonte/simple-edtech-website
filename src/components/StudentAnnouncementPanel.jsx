import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudentAnnouncementsForCurrentUser } from "../services/studentService";

function StudentAnnouncementPanel() {
  const { session } = useAuth();

  const [announcementData, setAnnouncementData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadAnnouncements() {
      if (!session?.user?.id) {
        setNotice("No active student session found.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getStudentAnnouncementsForCurrentUser(
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

    loadAnnouncements();
  }, [session]);

  if (isLoading) {
    return (
      <div className="dashboardPanel">
        <h2>Announcements</h2>
        <p>Loading announcements...</p>
      </div>
    );
  }

  if (notice) {
    return (
      <div className="dashboardPanel">
        <h2>Announcements</h2>
        <p>{notice}</p>
      </div>
    );
  }

  const announcements = announcementData?.announcements || [];

  return (
    <div className="dashboardPanel">
      <div className="panelHeaderRow">
        <div>
          <h2>Announcements</h2>
          <p>
            Important updates from Jlux Academy and your assigned tutor will
            appear here.
          </p>
        </div>

        <span className="statusPill published">{announcements.length} active</span>
      </div>

      {announcements.length === 0 ? (
        <p>No active announcement yet.</p>
      ) : (
        <div className="announcementStack">
          {announcements.slice(0, 5).map((announcement) => (
            <article
              className={`announcementCard ${announcement.priority}`}
              key={announcement.id}
            >
              <div>
                <span className={`statusPill ${announcement.priority}`}>
                  {announcement.priority}
                </span>

                <h3>{announcement.title}</h3>

                <p>{announcement.body}</p>

                <small>
                  From:{" "}
                  {announcement.tutors?.profiles?.full_name ||
                    announcement.profiles?.full_name ||
                    "Jlux Academy"}
                  {announcement.expires_at
                    ? ` • Expires: ${announcement.expires_at}`
                    : ""}
                </small>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

export default StudentAnnouncementPanel;