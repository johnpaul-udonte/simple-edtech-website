import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentControlCenterForAdmin,
  updateStudentRestrictionForAdmin,
} from "../../services/adminService";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function AdminStudents() {
  const { session } = useAuth();

  const [studentData, setStudentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [updatingStudentId, setUpdatingStudentId] = useState("");

  async function loadStudents() {
    const { data, error } = await getStudentControlCenterForAdmin();

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setStudentData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadStudents();
  }, []);

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
        student.paymentBalance > 0
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
      setActionError(error.message);
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
      </section>
    );
  }

  const students = studentData?.students || [];
  const summary = studentData?.summary || {};

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Student Control Centre</h1>
          <p>
            Monitor student progress, payment balance, class balance, quiz
            performance, certificate readiness, and access restriction status.
          </p>
        </div>

        <button>Export Students</button>
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
          <p>Total Students</p>
          <h2>{summary.totalStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Active Students</p>
          <h2>{summary.activeStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted Students</p>
          <h2>{summary.restrictedStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Students With Balance</p>
          <h2>{summary.studentsWithBalance || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Certificate Ready</p>
          <h2>{summary.certificateReadyStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Outstanding Balance</p>
          <h2>{formatMoney(summary.totalOutstandingBalance || 0)}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Student Access & Progress Table</h2>

        {students.length === 0 ? (
          <p>No student record found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Tutor</th>
                <th>Course</th>
                <th>Classes</th>
                <th>Payment</th>
                <th>Quiz</th>
                <th>Certificate</th>
                <th>Access</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const isUpdating = updatingStudentId === student.id;

                return (
                  <tr key={student.id}>
                    <td>
                      <strong>
                        {student.profiles?.full_name || "Unnamed Student"}
                      </strong>
                      <br />
                      <small>{student.student_code || "-"}</small>
                      <br />
                      <small>{student.profiles?.email || "-"}</small>
                    </td>

                    <td>
                      {student.tutors?.profiles?.full_name ||
                        "Tutor not assigned"}
                    </td>

                    <td>{student.enrolled_course || "Data Analysis"}</td>

                    <td>
                      <strong>
                        {student.completedClasses}/{student.totalPaidClasses}
                      </strong>
                      <br />
                      <small>Remaining: {student.remainingClasses}</small>
                      <br />
                      <small>
                        Missed: {student.missed_classes || 0} | Cancelled:{" "}
                        {student.cancelled_classes || 0}
                      </small>
                    </td>

                    <td>
                      <strong>{formatMoney(student.paymentBalance)}</strong>
                      <br />
                      <span
                        className={`statusPill ${
                          student.paymentBalance > 0 ? "pending" : "approved"
                        }`}
                      >
                        {student.paymentBalance > 0 ? "Balance Due" : "Cleared"}
                      </span>
                    </td>

                    <td>
                      <strong>{student.averageQuizScore || 0}%</strong>
                      <br />
                      <small>Latest: {student.latestQuizScore || 0}%</small>
                    </td>

                    <td>
                      <span
                        className={`statusPill ${
                          student.hasIssuedCertificate
                            ? "issued"
                            : student.needsClassAttention
                            ? "approved"
                            : "pending"
                        }`}
                      >
                        {student.hasIssuedCertificate
                          ? "Issued"
                          : student.needsClassAttention
                          ? "Ready"
                          : "Not Ready"}
                      </span>
                    </td>

                    <td>
                      <span
                        className={`statusPill ${
                          student.is_restricted ? "urgent" : "approved"
                        }`}
                      >
                        {student.is_restricted ? "Restricted" : "Allowed"}
                      </span>

                      {student.restriction_reason && (
                        <>
                          <br />
                          <small>{student.restriction_reason}</small>
                        </>
                      )}
                    </td>

                    <td>
                      <button
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
        )}
      </div>
    </section>
  );
}

export default AdminStudents;