import { BrowserRouter, Routes, Route } from "react-router-dom";
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

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

import StudentDashboard from "./pages/student/StudentDashboard";
import StudentAssignments from "./pages/student/StudentAssignments";
import StudentSchedule from "./pages/student/StudentSchedule";
import StudentPractice from "./pages/student/StudentPractice";
import StudentMaterials from "./pages/student/StudentMaterials";
import StudentCertificates from "./pages/student/StudentCertificates";

import TutorDashboard from "./pages/tutor/TutorDashboard";
import TutorStudents from "./pages/tutor/TutorStudents";
import TutorAssignments from "./pages/tutor/TutorAssignments";
import TutorQuizzes from "./pages/tutor/TutorQuizzes";
import TutorMaterials from "./pages/tutor/TutorMaterials";
import TutorAnnouncements from "./pages/tutor/TutorAnnouncements";
import TutorSchedule from "./pages/tutor/TutorSchedule";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminStudents from "./pages/admin/AdminStudents";
import AdminTutors from "./pages/admin/AdminTutors";
import AdminSchedules from "./pages/admin/AdminSchedules";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminAssignments from "./pages/admin/AdminAssignments";
import AdminQuizzes from "./pages/admin/AdminQuizzes";
import AdminCertificates from "./pages/admin/AdminCertificates";
import AdminMaterials from "./pages/admin/AdminMaterials";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements";
import AdminReports from "./pages/admin/AdminReports";

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
            path="/student/practice"
            element={
              <StudentRestrictionGuard>
                <StudentPractice />
              </StudentRestrictionGuard>
            }
          />

          <Route
            path="/student/materials"
            element={
              <StudentRestrictionGuard>
                <StudentMaterials />
              </StudentRestrictionGuard>
            }
          />

          <Route
            path="/student/certificates"
            element={
              <StudentRestrictionGuard>
                <StudentCertificates />
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
          <Route path="/tutor/quizzes" element={<TutorQuizzes />} />
          <Route path="/tutor/materials" element={<TutorMaterials />} />
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
          <Route path="/admin/students" element={<AdminStudents />} />
          <Route path="/admin/tutors" element={<AdminTutors />} />
          <Route path="/admin/schedules" element={<AdminSchedules />} />
          <Route path="/admin/payments" element={<AdminPayments />} />
          <Route path="/admin/assignments" element={<AdminAssignments />} />
          <Route path="/admin/quizzes" element={<AdminQuizzes />} />
          <Route path="/admin/certificates" element={<AdminCertificates />} />
          <Route path="/admin/materials" element={<AdminMaterials />} />
          <Route path="/admin/announcements" element={<AdminAnnouncements />} />
          <Route path="/admin/reports" element={<AdminReports />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;