import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../context/AuthContext";

function formatNotificationDate(value) {
  if (!value) return "";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function NotificationBell() {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef(null);

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.is_read).length;
  }, [notifications]);

  async function loadNotifications() {
    if (!supabase || !profile?.id) return;

    setIsLoading(true);

    const { data, error } = await supabase
      .from("student_notifications")
      .select("id, title, message, is_read, created_at")
      .eq("recipient_profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error) {
      setNotifications(data || []);
    }

    setIsLoading(false);
  }

  async function markAllAsRead() {
    if (!supabase || !profile?.id || unreadCount === 0) return;

    const { error } = await supabase
      .from("student_notifications")
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq("recipient_profile_id", profile.id)
      .eq("is_read", false);

    if (!error) {
      setNotifications((current) =>
        current.map((item) => ({
          ...item,
          is_read: true,
        }))
      );
    }
  }

  useEffect(() => {
    loadNotifications();
  }, [profile?.id]);

  useEffect(() => {
    if (!supabase || !profile?.id) return undefined;

    const channel = supabase
      .channel(`jlux-notifications-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "student_notifications",
          filter: `recipient_profile_id=eq.${profile.id}`,
        },
        () => {
          loadNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (!dropdownRef.current) return;

      if (!dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  if (!profile?.id) return null;

  return (
    <div className="notificationBellWrap" ref={dropdownRef}>
      <button
        type="button"
        className="notificationBellBtn"
        onClick={() => setIsOpen((current) => !current)}
        aria-label="Open notifications"
      >
        <span className="notificationBellIcon">🔔</span>

        {unreadCount > 0 && (
          <span className="notificationBadge">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="notificationDropdown">
          <div className="notificationDropdownHeader">
            <div>
              <strong>Notifications</strong>
              <small>{unreadCount} unread</small>
            </div>

            <button type="button" onClick={markAllAsRead}>
              Mark read
            </button>
          </div>

          {isLoading ? (
            <div className="notificationEmpty">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="notificationEmpty">
              <strong>No notifications yet</strong>
              <span>Updates will appear here when available.</span>
            </div>
          ) : (
            <div className="notificationList">
              {notifications.map((item) => (
                <article
                  key={item.id}
                  className={`notificationItem ${
                    item.is_read ? "" : "unread"
                  }`}
                >
                  <div>
                    <strong>{item.title || "Notification"}</strong>
                    <p>{item.message || "You have a new update."}</p>
                    <small>{formatNotificationDate(item.created_at)}</small>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default NotificationBell;