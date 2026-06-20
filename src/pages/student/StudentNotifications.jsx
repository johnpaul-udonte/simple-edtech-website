import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getMyStudentNotifications,
  markStudentNotificationAsRead,
} from "../../services/studentNotificationService";

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

function StudentNotifications() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  async function loadNotifications() {
    setIsLoading(true);
    setErrorMessage("");

    const { data, error } = await getMyStudentNotifications(profile?.id);

    if (error) {
      setErrorMessage(error.message || "Could not load notifications.");
      setIsLoading(false);
      return;
    }

    setNotifications(data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadNotifications();
  }, [profile?.id]);

  const unreadCount = useMemo(() => {
    return notifications.filter((notification) => !notification.is_read).length;
  }, [notifications]);

  async function handleMarkAsRead(notificationId) {
    setNotice("");
    setErrorMessage("");

    const { error } = await markStudentNotificationAsRead(notificationId);

    if (error) {
      setErrorMessage(error.message || "Could not mark notification as read.");
      return;
    }

    setNotice("Notification marked as read.");
    await loadNotifications();
  }

  return (
    <>
      <header className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Notifications</p>
          <h1>Notifications</h1>
          <p>
            View important updates about your account, classes, materials,
            assignments, payments, and announcements.
          </p>
        </div>

        <button type="button" onClick={loadNotifications}>
          Refresh
        </button>
      </header>

      {notice && <div className="successNotice">{notice}</div>}
      {errorMessage && <div className="errorNotice">{errorMessage}</div>}

      <section className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Notifications</p>
          <h2>{notifications.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Unread Notifications</p>
          <h2>{unreadCount}</h2>
        </article>
      </section>

      <section className="dashboardPanel">
        <h2>Notification Panel</h2>

        {isLoading ? (
          <p>Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p>No notification yet.</p>
        ) : (
          <div className="notificationList">
            {notifications.map((notification) => (
              <article
                key={notification.id}
                className={`notificationCard ${
                  notification.is_read ? "read" : "unread"
                }`}
              >
                <div>
                  <p className="eyebrow">{notification.category}</p>
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <small>{formatDateTime(notification.created_at)}</small>
                </div>

                {!notification.is_read && (
                  <button
                    type="button"
                    className="tableActionBtn restoreBtn"
                    onClick={() => handleMarkAsRead(notification.id)}
                  >
                    Mark as Read
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

export default StudentNotifications;