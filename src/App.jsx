import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import "./App.css";

import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import ProtectedRoute from "./routes/ProtectedRoute";

import Home from "./pages/public/Home";
import About from "./pages/public/About";
import Courses from "./pages/public/Courses";
import Pricing from "./pages/public/Pricing";
import FAQ from "./pages/public/FAQ";
import Contact from "./pages/public/Contact";
import NotFound from "./pages/public/NotFound";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Unauthorized from "./pages/auth/Unauthorized";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentPractice from "./pages/student/StudentPractice";
import StudentCertificates from "./pages/student/StudentCertificates";
import StudentNotifications from "./pages/student/StudentNotifications";
import StudentChangePassword from "./pages/student/StudentChangePassword";

import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorStudents from "./pages/tutor/TutorStudents";
import TutorAssignments from "./pages/tutor/TutorAssignments";
import TutorDrills from "./pages/tutor/TutorQuizzes";
import TutorAnnouncements from "./pages/tutor/TutorAnnouncements";
import TutorSchedule from "./pages/tutor/TutorSchedule";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminApplications from "./pages/admin/AdminApplications";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminTutors from "./pages/admin/AdminTutors";
import AdminSchedules from "./pages/admin/AdminSchedules";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminAssignments from "./pages/admin/AdminAssignments";
import AdminDrills from "./pages/admin/AdminQuizzes";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminReports from "./pages/admin/AdminReports";
import AdminLoginCredentials from "./pages/admin/AdminLoginCredentials";

import StudentRestrictionGuard from "./components/StudentRestrictionGuard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<NotFound />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRole="student">
              <DashboardLayout role="Student" />
            </ProtectedRoute>
          }
        >
          <Route path="/student/dashboard" element={<StudentDashboard />} />

          <Route
            path="/student/assignments"
            element={
              <StudentRestrictionGuard>
                <StudentAssignments />
              </StudentRestrictionGuard>
            }
          />

          <Route
            path="/student/schedule"
            element={
              <StudentRestrictionGuard>
                <StudentSchedule />
              </StudentRestrictionGuard>
            }
          />

          <Route
            path="/student/drills"
            element={
              <StudentRestrictionGuard>
                <StudentPractice />
              </StudentRestrictionGuard>
            }
          />

          <Route
            path="/student/practice"
            element={<Navigate to="/student/drills" replace />}
          />

          <Route
            path="/student/materials"
            element={<Navigate to="/student/dashboard" replace />}
          />

          <Route
            path="/student/certificates"
            element={
              <StudentRestrictionGuard>
                <StudentCertificates />
              </StudentRestrictionGuard>
            }
          />

          <Route
            path="/student/notifications"
            element={
              <StudentRestrictionGuard>
                <StudentNotifications />
              </StudentRestrictionGuard>
            }
          />

          <Route
            path="/student/change-password"
            element={
              <StudentRestrictionGuard>
                <StudentChangePassword />
              </StudentRestrictionGuard>
            }
          />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRole="tutor">
              <DashboardLayout role="Tutor" />
            </ProtectedRoute>
          }
        >
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
          <Route path="/tutor/students" element={<TutorStudents />} />
          <Route path="/tutor/assignments" element={<TutorAssignments />} />
          <Route path="/tutor/drills" element={<TutorDrills />} />
          <Route
            path="/tutor/quizzes"
            element={<Navigate to="/tutor/drills" replace />}
          />
          <Route
            path="/tutor/materials"
            element={<Navigate to="/tutor/dashboard" replace />}
          />
          <Route path="/tutor/announcements" element={<TutorAnnouncements />} />
          <Route path="/tutor/schedule" element={<TutorSchedule />} />
        </Route>

        <Route
          element={
            <ProtectedRoute allowedRole="admin">
              <DashboardLayout role="Admin" />
            </ProtectedRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/applications" element={<AdminApplications />} />
          <Route path="/admin/login-credentials" element={<AdminLoginCredentials />} />
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/tutors" element={<AdminTutors />} />
          <Route path="/admin/schedules" element={<AdminSchedules />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/assignments" element={<AdminAssignments />} />
          <Route path="/admin/drills" element={<AdminDrills />} />
          <Route
            path="/admin/quizzes"
            element={<Navigate to="/admin/drills" replace />}
          />
          <Route path="/admin/certificates" element={<AdminCertificates />} />
          <Route
            path="/admin/materials"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;