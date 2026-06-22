import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import {
  getAllTutorsForAdmin,
  getStudentControlCenterForAdmin,
  updateStudentRestrictionForAdmin,
} from "../../services/adminService";

const courseClassTargets = {
  Excel: 10,
  "Power BI": 10,
  SQL: 8,
  Python: 14,
  "Excel + Power BI + SQL": 28,
  "Full Data Analysis Training": 42,
  "Data Analysis": 42,
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getCourseTotalClasses(courseName) {
  return courseClassTargets[courseName] || 42;
}

function getProgressPercent(attended, total) {
  if (!total) return 0;
  return Math.min(100, Math.round((Number(attended || 0) / total) * 100));
}

function getAccessClass(isRestricted) {
  return isRestricted ? "urgent" : "issued";
}

function getPaymentClass(balance) {
  return Number(balance || 0) > 0 ? "pending" : "issued";
}

function getCertificateClass(student) {
  if (student.hasIssuedCertificate) return "issued";
  if (student.needsClassAttention) return "approved";
  return "pending";
}

function getCertificateLabel(student) {
  if (student.hasIssuedCertificate) return "Issued";
  if (student.needsClassAttention) return "Ready";
  return "Not Ready";
}

function AdminStudents() {
  const { session } = useAuth();

  const [studentData, setStudentData] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [selectedTutorByStudentId, setSelectedTutorByStudentId] = useState({});
  const [attendedClassesByStudentId, setAttendedClassesByStudentId] = useState({});
  const [activeFilter, setActiveFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingStudentId, setUpdatingStudentId] = useState("");
  const [assigningStudentId, setAssigningStudentId] = useState("");
  const [savingClassesStudentId, setSavingClassesStudentId] = useState("");

  async function loadStudents() {
    setIsLoading(true);
    setNotice("");
    setActionError("");

    const [studentResult, tutorResult, attendedResult] = await Promise.all([
      getStudentControlCenterForAdmin(),
      getAllTutorsForAdmin(),
      supabase.from("students").select("id, attended_classes"),
    ]);

    if (studentResult.error) {
      setNotice(studentResult.error.message || "Could not load student records.");
      setIsLoading(false);
      return;
    }

    if (tutorResult.error) {
      setNotice(tutorResult.error.message || "Could not load tutor records.");
      setIsLoading(false);
      return;
    }

    if (attendedResult.error) {
      setNotice(attendedResult.error.message || "Could not load attended class records.");
      setIsLoading(false);
      return;
    }

    const attendedMap = {};
    attendedResult.data?.forEach((row) => {
      attendedMap[row.id] = Number(row.attended_classes || 0);
    });

    const studentList = studentResult.data?.students || [];

    const enrichedStudents = studentList.map((student) => ({
      ...student,
      attended_classes:
        attendedMap[student.id] ?? Number(student.attended_classes || 0),
    }));

    setStudentData({
      ...studentResult.data,
      students: enrichedStudents,
    });

    setTutors(tutorResult.data || []);

    const initialTutorMap = {};
    const initialAttendedMap = {};

    enrichedStudents.forEach((student) => {
      initialTutorMap[student.id] = student.assigned_tutor_id || "";
      initialAttendedMap[student.id] = Number(student.attended_classes || 0);
    });

    setSelectedTutorByStudentId(initialTutorMap);
    setAttendedClassesByStudentId(initialAttendedMap);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

  const students = useMemo(() => {
    return studentData?.students || [];
  }, [studentData]);

  const summary = studentData?.summary || {};

  const progressSummary = useMemo(() => {
    if (students.length === 0) {
      return {
        averageProgress: 0,
        completedStudents: 0,
      };
    }

    const totalProgress = students.reduce((sum, student) => {
      const totalClasses = getCourseTotalClasses(student.enrolled_course);
      const attendedClasses = Number(student.attended_classes || 0);
      return sum + getProgressPercent(attendedClasses, totalClasses);
    }, 0);

    const completedStudents = students.filter((student) => {
      const totalClasses = getCourseTotalClasses(student.enrolled_course);
      const attendedClasses = Number(student.attended_classes || 0);
      return attendedClasses >= totalClasses;
    }).length;

    return {
      averageProgress: Math.round(totalProgress / students.length),
      completedStudents,
    };
  }, [students]);

  const filteredStudents = useMemo(() => {
    if (activeFilter === "all") return students;

    if (activeFilter === "active") {
      return students.filter((student) => !student.is_restricted);
    }

    if (activeFilter === "restricted") {
      return students.filter((student) => student.is_restricted);
    }

    if (activeFilter === "balance") {
      return students.filter((student) => Number(student.paymentBalance || 0) > 0);
    }

    if (activeFilter === "certificate") {
      return students.filter((student) => student.needsClassAttention);
    }

    if (activeFilter === "noTutor") {
      return students.filter((student) => !student.tutors?.profiles?.full_name);
    }

    if (activeFilter === "completed") {
      return students.filter((student) => {
        const totalClasses = getCourseTotalClasses(student.enrolled_course);
        return Number(student.attended_classes || 0) >= totalClasses;
      });
    }

    return students;
  }, [students, activeFilter]);

  async function handleRestriction(student) {
    setSuccessMessage("");
    setActionError("");
    setUpdatingStudentId(student.id);

    const adminUserId = session?.user?.id;

    if (!adminUserId) {
      setActionError("Admin session not found. Please log in again.");
      setUpdatingStudentId("");
      return;
    }

    let reason = "";

    if (!student.is_restricted) {
      reason = window.prompt(
        "Enter restriction reason:",
        Number(student.paymentBalance || 0) > 0
          ? "Payment balance pending. Access restricted by admin."
          : "Access restricted by admin."
      );

      if (reason === null) {
        setUpdatingStudentId("");
        return;
      }
    }

    const { error } = await updateStudentRestrictionForAdmin(student.id, {
      isRestricted: !student.is_restricted,
      reason,
      adminUserId,
    });

    if (error) {
      setActionError(error.message || "Could not update student access.");
      setUpdatingStudentId("");
      return;
    }

    setSuccessMessage(
      student.is_restricted
        ? "Student access has been restored."
        : "Student access has been restricted."
    );

    await loadStudents();
    setUpdatingStudentId("");
  }

  async function handleAssignTutor(student) {
    setSuccessMessage("");
    setActionError("");
    setAssigningStudentId(student.id);

    const selectedTutorId = selectedTutorByStudentId[student.id] || null;

    const { error } = await supabase
      .from("students")
      .update({
        assigned_tutor_id: selectedTutorId || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", student.id);

    if (error) {
      setActionError(error.message || "Could not assign tutor to student.");
      setAssigningStudentId("");
      return;
    }

    setSuccessMessage(
      selectedTutorId
        ? "Tutor assigned to student successfully."
        : "Tutor removed from student successfully."
    );

    await loadStudents();
    setAssigningStudentId("");
  }

  async function handleSaveAttendedClasses(student) {
    setSuccessMessage("");
    setActionError("");
    setSavingClassesStudentId(student.id);

    const totalClasses = getCourseTotalClasses(student.enrolled_course);
    const attendedClasses = Number(attendedClassesByStudentId[student.id] || 0);

    if (attendedClasses < 0) {
      setActionError("Attended classes cannot be less than 0.");
      setSavingClassesStudentId("");
      return;
    }

    if (attendedClasses > totalClasses) {
      setActionError(
        `Attended classes cannot be more than ${totalClasses} for ${student.enrolled_course}.`
      );
      setSavingClassesStudentId("");
      return;
    }

    const { error } = await supabase
      .from("students")
      .update({
        attended_classes: attendedClasses,
        updated_at: new Date().toISOString(),
      })
      .eq("id", student.id);

    if (error) {
      setActionError(error.message || "Could not save attended classes.");
      setSavingClassesStudentId("");
      return;
    }

    setSuccessMessage("Student attended classes and progress have been updated.");
    await loadStudents();
    setSavingClassesStudentId("");
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading students...</h2>
        <p>Please wait while student records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Student control issue</h2>
        <p>{notice}</p>

        <button type="button" className="tableActionBtn" onClick={loadStudents}>
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="adminStudentsPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Student Control Centre</h1>
          <p>
            Monitor student progress, tutor assignment, payment balance, class
            attendance, certificate readiness, and access restriction status.
          </p>
        </div>

        <button type="button" onClick={loadStudents}>
          Refresh
        </button>
      </header>

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

      <section className="adminStudentsSummaryGrid">
        <article className="dashboardCard">
          <p>Total Students</p>
          <h2>{summary.totalStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Active</p>
          <h2>{summary.activeStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted</p>
          <h2>{summary.restrictedStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Average Progress</p>
          <h2>{progressSummary.averageProgress}%</h2>
        </article>

        <article className="dashboardCard">
          <p>Completed</p>
          <h2>{progressSummary.completedStudents}</h2>
        </article>

        <article className="dashboardCard adminStudentsMoneyCard">
          <p>Outstanding</p>
          <h2>{formatMoney(summary.totalOutstandingBalance || 0)}</h2>
        </article>
      </section>

      <section className="adminStudentsFilterBar">
        <button
          type="button"
          className={activeFilter === "all" ? "active" : ""}
          onClick={() => setActiveFilter("all")}
        >
          All Students
        </button>

        <button
          type="button"
          className={activeFilter === "active" ? "active" : ""}
          onClick={() => setActiveFilter("active")}
        >
          Active
        </button>

        <button
          type="button"
          className={activeFilter === "restricted" ? "active" : ""}
          onClick={() => setActiveFilter("restricted")}
        >
          Restricted
        </button>

        <button
          type="button"
          className={activeFilter === "balance" ? "active" : ""}
          onClick={() => setActiveFilter("balance")}
        >
          With Balance
        </button>

        <button
          type="button"
          className={activeFilter === "certificate" ? "active" : ""}
          onClick={() => setActiveFilter("certificate")}
        >
          Certificate Ready
        </button>

        <button
          type="button"
          className={activeFilter === "completed" ? "active" : ""}
          onClick={() => setActiveFilter("completed")}
        >
          Completed
        </button>

        <button
          type="button"
          className={activeFilter === "noTutor" ? "active" : ""}
          onClick={() => setActiveFilter("noTutor")}
        >
          No Tutor
        </button>
      </section>

      <section className="dashboardPanel adminStudentsTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Student Access & Progress Table</h2>
            <p>
              Assign tutors, input attended classes, monitor progress percentage,
              and control student access.
            </p>
          </div>
        </div>

        {filteredStudents.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No student found</h3>
            <p>No student matches the selected filter.</p>
          </div>
        ) : (
          <div className="adminStudentsTableWrap">
            <table className="adminStudentsTable adminStudentsTutorAssignTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Current Tutor</th>
                  <th>Assign Tutor</th>
                  <th>Course</th>
                  <th>Attended / Progress</th>
                  <th>Payment</th>
                  <th>Drills</th>
                  <th>Certificate</th>
                  <th>Access</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((student) => {
                  const isUpdating = updatingStudentId === student.id;
                  const isAssigning = assigningStudentId === student.id;
                  const isSavingClasses = savingClassesStudentId === student.id;
                  const paymentBalance = Number(student.paymentBalance || 0);

                  const totalClasses = getCourseTotalClasses(student.enrolled_course);
                  const attendedClasses = Number(
                    attendedClassesByStudentId[student.id] || 0
                  );
                  const remainingClasses = Math.max(totalClasses - attendedClasses, 0);
                  const progressPercent = getProgressPercent(
                    attendedClasses,
                    totalClasses
                  );

                  return (
                    <tr key={student.id}>
                      <td className="studentCell">
                        <strong>
                          {student.profiles?.full_name || "Unnamed Student"}
                        </strong>
                        <small>{student.student_code || "-"}</small>
                        <small>{student.profiles?.email || "-"}</small>
                      </td>

                      <td>
                        <strong>
                          {student.tutors?.profiles?.full_name ||
                            "Tutor not assigned"}
                        </strong>
                      </td>

                      <td>
                        <div className="assignTutorBox">
                          <select
                            value={selectedTutorByStudentId[student.id] || ""}
                            onChange={(event) =>
                              setSelectedTutorByStudentId((current) => ({
                                ...current,
                                [student.id]: event.target.value,
                              }))
                            }
                          >
                            <option value="">No tutor</option>
                            {tutors.map((tutor) => (
                              <option key={tutor.id} value={tutor.id}>
                                {tutor.profiles?.full_name || "Unnamed Tutor"} —{" "}
                                {tutor.specialisation || "Tutor"}
                              </option>
                            ))}
                          </select>

                          <button
                            type="button"
                            className="tableActionBtn"
                            disabled={isAssigning}
                            onClick={() => handleAssignTutor(student)}
                          >
                            {isAssigning ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </td>

                      <td>
                        <strong>{student.enrolled_course || "Data Analysis"}</strong>
                        <small>Total: {totalClasses} classes</small>
                      </td>

                      <td>
                        <div className="attendedClassBox">
                          <div className="attendedClassInputRow">
                            <input
                              type="number"
                              min="0"
                              max={totalClasses}
                              value={attendedClassesByStudentId[student.id] ?? 0}
                              onChange={(event) =>
                                setAttendedClassesByStudentId((current) => ({
                                  ...current,
                                  [student.id]: event.target.value,
                                }))
                              }
                            />

                            <button
                              type="button"
                              className="tableActionBtn"
                              disabled={isSavingClasses}
                              onClick={() => handleSaveAttendedClasses(student)}
                            >
                              {isSavingClasses ? "Saving..." : "Save"}
                            </button>
                          </div>

                          <div className="studentProgressBar">
                            <span style={{ width: `${progressPercent}%` }} />
                          </div>

                          <small>
                            {attendedClasses}/{totalClasses} classes attended
                          </small>
                          <strong>{progressPercent}% complete</strong>
                          <small>Remaining: {remainingClasses} classes</small>
                        </div>
                      </td>

                      <td>
                        <strong>{formatMoney(paymentBalance)}</strong>
                        <span className={`statusPill ${getPaymentClass(paymentBalance)}`}>
                          {paymentBalance > 0 ? "Balance Due" : "Cleared"}
                        </span>
                      </td>

                      <td>
                        <strong>{student.averageQuizScore || 0}%</strong>
                        <small>Latest: {student.latestQuizScore || 0}%</small>
                      </td>

                      <td>
                        <span className={`statusPill ${getCertificateClass(student)}`}>
                          {getCertificateLabel(student)}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`statusPill ${getAccessClass(
                            student.is_restricted
                          )}`}
                        >
                          {student.is_restricted ? "Restricted" : "Allowed"}
                        </span>

                        {student.restriction_reason && (
                          <small>{student.restriction_reason}</small>
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className={`tableActionBtn ${
                            student.is_restricted ? "restoreBtn" : "restrictBtn"
                          }`}
                          onClick={() => handleRestriction(student)}
                          disabled={isUpdating}
                        >
                          {isUpdating
                            ? "Updating..."
                            : student.is_restricted
                            ? "Unrestrict"
                            : "Restrict"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default AdminStudents;