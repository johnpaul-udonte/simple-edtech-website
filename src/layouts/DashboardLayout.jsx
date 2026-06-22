import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";

import NotificationBell from "../components/NotificationBell";

function DashboardLayout({ role }) {
  const navigate = useNavigate();
  const { logout, profile } = useAuth();

  const [profilePhotoUrl, setProfilePhotoUrl] = useState("");
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const roleLinks = {
    Student: [
      { label: "Dashboard", path: "/student/dashboard" },
      {
        label: "Notifications",
        path: "/student/notifications",
        showCount: true,
      },
      { label: "Assignments", path: "/student/assignments" },
      { label: "Schedule", path: "/student/schedule" },
      { label: "Drills", path: "/student/drills" },
      { label: "Certificates", path: "/student/certificates" },
      { label: "Change Password", path: "/student/change-password" },
    ],

    Tutor: [
      { label: "Dashboard", path: "/tutor/dashboard" },
      { label: "Students", path: "/tutor/students" },
      { label: "Assignments", path: "/tutor/assignments" },
      { label: "Drills", path: "/tutor/drills" },
      { label: "Announcements", path: "/tutor/announcements" },
      { label: "Schedule", path: "/tutor/schedule" },
    ],

    Admin: [
      { label: "Dashboard", path: "/admin/dashboard" },
      { label: "Applications", path: "/admin/applications" },
      { label: "Login Credentials", path: "/admin/login-credentials" },
      { label: "Students", path: "/admin/students" },
      { label: "Tutors", path: "/admin/tutors" },
      { label: "Schedules", path: "/admin/schedules" },
      { label: "Payments", path: "/admin/payments" },
      { label: "Assignments", path: "/admin/assignments" },
      { label: "Drills", path: "/admin/drills" },
      { label: "Certificates", path: "/admin/certificates" },
      { label: "Announcements", path: "/admin/announcements" },
      { label: "Reports", path: "/admin/reports" },
    ],
  };

  useEffect(() => {
    async function loadProfilePhoto() {
      setProfilePhotoUrl("");

      if (!profile?.id || !supabase) return;

      const { data: latestProfile, error: profileError } = await supabase
        .from("profiles")
        .select("portrait_path")
        .eq("id", profile.id)
        .maybeSingle();

      if (profileError) {
        console.log("Could not load profile portrait path:", profileError);
        return;
      }

      const rawPath = latestProfile?.portrait_path || profile?.portrait_path;

      if (!rawPath) {
        return;
      }

      let photoPath = String(rawPath).trim();

      photoPath = photoPath.replace("student-portraits/", "");
      photoPath = photoPath.replace(/^\/+/, "");

      const { data: signedData, error: signedError } = await supabase.storage
        .from("student-portraits")
        .createSignedUrl(photoPath, 60 * 60);

      if (signedError) {
        console.log("Profile photo signed URL error:", signedError);
        console.log("Tried photo path:", photoPath);
        return;
      }

      if (signedData?.signedUrl) {
        setProfilePhotoUrl(signedData.signedUrl);
      }
    }

    loadProfilePhoto();
  }, [profile?.id, profile?.portrait_path]);

  useEffect(() => {
    async function loadUnreadNotifications() {
      setUnreadNotifications(0);

      if (!profile?.id || !supabase) return;

      const { count, error } = await supabase
        .from("student_notifications")
        .select("id", { count: "exact", head: true })
        .eq("recipient_profile_id", profile.id)
        .eq("is_read", false);

      if (error) {
        console.log("Unread notification count error:", error);
        return;
      }

      setUnreadNotifications(count || 0);
    }

    loadUnreadNotifications();
  }, [profile?.id]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="dashboardShell">
      <NotificationBell />
      <aside className="sidebar">
        <Link to="/" className="dashboardBrand">
          <img src="/images/jlux-logo.png" alt="Jlux Academy Logo" />

          <div>
            <h2>Jlux Academy</h2>
            <p>{role} Portal</p>
          </div>
        </Link>

        {profile && (
          <div className="userMiniCard">
            <div className="studentProfilePhotoWrap">
              <img
                src={profilePhotoUrl || "/images/jlux-logo.png"}
                alt={profile.full_name || "Profile photo"}
                className="studentProfilePhoto"
              />
            </div>

            <p>Logged in as</p>
            <strong>{profile.full_name}</strong>
            <span>{profile.role}</span>
          </div>
        )}

        <nav className="sideNav">
          {(roleLinks[role] || []).map((item) => (
            <NavLink key={item.path} to={item.path}>
              <span>{item.label}</span>

              {item.showCount && unreadNotifications > 0 && (
                <span className="navNotificationBadge">
                  {unreadNotifications}
                </span>
              )}
            </NavLink>
          ))}

          <Link to="/">Back to Website</Link>

          <button type="button" onClick={handleLogout} className="logoutBtn">
            Logout
          </button>
        </nav>
      </aside>

      <main className="dashboardMain">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;