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
    setIsLoading(true);
    setNotice("");
    setActionError("");

    const { data, error } = await getStudentControlCenterForAdmin();

    if (error) {
      setNotice(error.message || "Could not load student records.");
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

  const students = studentData?.students || [];
  const summary = studentData?.summary || {};

  return (
    <section className="adminStudentsPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Student Control Centre</h1>
          <p>
            Monitor student progress, payment balance, class balance, drill
            performance, certificate readiness, and access restriction status.
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
          <p>With Balance</p>
          <h2>{summary.studentsWithBalance || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Cert. Ready</p>
          <h2>{summary.certificateReadyStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Outstanding</p>
          <h2>{formatMoney(summary.totalOutstandingBalance || 0)}</h2>
        </article>
      </section>

      <section className="dashboardPanel adminStudentsTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Student Access & Progress Table</h2>
            <p>
              Scroll sideways inside the table area to see all columns and
              actions.
            </p>
          </div>
        </div>

        {students.length === 0 ? (
          <p>No student record found.</p>
        ) : (
          <div className="adminStudentsTableWrap">
            <table className="adminStudentsTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Tutor</th>
                  <th>Course</th>
                  <th>Classes</th>
                  <th>Payment</th>
                  <th>Drills</th>
                  <th>Certificate</th>
                  <th>Access</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => {
                  const isUpdating = updatingStudentId === student.id;
                  const paymentBalance = Number(student.paymentBalance || 0);

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
                        {student.tutors?.profiles?.full_name ||
                          "Tutor not assigned"}
                      </td>

                      <td>{student.enrolled_course || "Data Analysis"}</td>

                      <td>
                        <strong>
                          {student.completedClasses || 0}/
                          {student.totalPaidClasses || 0}
                        </strong>
                        <small>Remaining: {student.remainingClasses || 0}</small>
                        <small>
                          Missed: {student.missed_classes || 0} | Cancelled:{" "}
                          {student.cancelled_classes || 0}
                        </small>
                      </td>

                      <td>
                        <strong>{formatMoney(paymentBalance)}</strong>
                        <br />
                        <span
                          className={`statusPill ${
                            paymentBalance > 0 ? "pending" : "approved"
                          }`}
                        >
                          {paymentBalance > 0 ? "Balance Due" : "Cleared"}
                        </span>
                      </td>

                      <td>
                        <strong>{student.averageQuizScore || 0}%</strong>
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