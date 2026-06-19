import { BrowserRouter, Routes, Route } from "react-router-dom";
import "./App.css";

import PublicLayout from "./layouts/PublicLayout";
import DashboardLayout from "./layouts/DashboardLayout";

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
import AdminDashboard from "./pages/admin/AdminDashboard";

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

        <Route element={<DashboardLayout role="Student" />}>
          <Route path="/student/dashboard" element={<StudentDashboard />} />
          <Route path="/student/assignments" element={<StudentAssignments />} />
          <Route path="/student/schedule" element={<StudentSchedule />} />
          <Route path="/student/practice" element={<StudentPractice />} />
          <Route path="/student/materials" element={<StudentMaterials />} />
          <Route path="/student/certificates" element={<StudentCertificates />} />
        </Route>

        <Route element={<DashboardLayout role="Tutor" />}>
          <Route path="/tutor/dashboard" element={<TutorDashboard />} />
        </Route>

        <Route element={<DashboardLayout role="Admin" />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;