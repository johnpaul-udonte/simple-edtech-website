import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getCertificatesForAdmin,
  issueCertificateForStudent,
} from "../../services/adminService";

function AdminCertificates() {
  const { session } = useAuth();

  const [certificateData, setCertificateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [issuingStudentId, setIssuingStudentId] = useState("");

  async function loadCertificates() {
    const { data, error } = await getCertificatesForAdmin();

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setCertificateData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadCertificates();
  }, []);

  async function handleIssueCertificate(studentId) {
    setSuccessMessage("");
    setActionError("");
    setIssuingStudentId(studentId);

    const adminUserId = session?.user?.id;

    if (!adminUserId) {
      setActionError("Admin session not found. Please log in again.");
      setIssuingStudentId("");
      return;
    }

    const { error } = await issueCertificateForStudent(studentId, adminUserId);

    if (error) {
      setActionError(error.message);
      setIssuingStudentId("");
      return;
    }

    setSuccessMessage("Certificate issued successfully.");
    await loadCertificates();
    setIssuingStudentId("");
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading certificates...</h2>
        <p>Please wait while certificate records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Certificate issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const students = certificateData?.students || [];
  const certificates = certificateData?.certificates || [];
  const summary = certificateData?.summary || {};

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Certificate Management</h1>
          <p>
            Issue certificates to students who have completed all paid classes
            and monitor issued certificate records.
          </p>
        </div>

        <button>Export Certificates</button>
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
          <p>Eligible Students</p>
          <h2>{summary.eligibleStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Total Certificates</p>
          <h2>{summary.totalCertificates || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Issued Certificates</p>
          <h2>{summary.issuedCertificates || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Certificates</p>
          <h2>{summary.pendingCertificates || 0}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Student Certificate Eligibility</h2>

        {students.length === 0 ? (
          <p>No student records available.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Course</th>
                <th>Tutor</th>
                <th>Progress</th>
                <th>Remaining</th>
                <th>Certificate</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => {
                const progress =
                  Number(student.totalPaidClasses || 0) > 0
                    ? Math.round(
                        (Number(student.completedClasses || 0) /
                          Number(student.totalPaidClasses || 0)) *
                          100
                      )
                    : 0;

                const isIssuing = issuingStudentId === student.id;

                return (
                  <tr key={student.id}>
                    <td>
                      {student.profiles?.full_name || "Unnamed Student"}
                      <br />
                      <small>{student.student_code || "-"}</small>
                    </td>

                    <td>{student.profiles?.email || "-"}</td>

                    <td>{student.enrolled_course || "Data Analysis"}</td>

                    <td>
                      {student.tutors?.profiles?.full_name ||
                        "Tutor not assigned"}
                    </td>

                    <td>
                      <strong>{progress}%</strong>
                      <br />
                      <small>
                        {student.completedClasses} / {student.totalPaidClasses}{" "}
                        classes
                      </small>
                    </td>

                    <td>{student.remainingClasses}</td>

                    <td>
                      <span
                        className={`statusPill ${
                          student.hasIssuedCertificate
                            ? "issued"
                            : student.isEligible
                            ? "approved"
                            : "pending"
                        }`}
                      >
                        {student.hasIssuedCertificate
                          ? "Issued"
                          : student.isEligible
                          ? "Eligible"
                          : "Not Eligible"}
                      </span>
                    </td>

                    <td>
                      {student.isEligible ? (
                        <button
                          className="tableActionBtn"
                          onClick={() => handleIssueCertificate(student.id)}
                          disabled={isIssuing}
                        >
                          {isIssuing ? "Issuing..." : "Issue Certificate"}
                        </button>
                      ) : (
                        <span className="mutedText">No action</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Issued Certificate Records</h2>

        {certificates.length === 0 ? (
          <p>No certificates have been issued yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Certificate</th>
                <th>Course</th>
                <th>Status</th>
                <th>Issued At</th>
                <th>Notes</th>
              </tr>
            </thead>

            <tbody>
              {certificates.map((certificate) => (
                <tr key={certificate.id}>
                  <td>{certificate.title}</td>

                  <td>{certificate.course || "-"}</td>

                  <td>
                    <span className={`statusPill ${certificate.status}`}>
                      {certificate.status}
                    </span>
                  </td>

                  <td>
                    {certificate.issued_at
                      ? new Date(certificate.issued_at).toLocaleString()
                      : "-"}
                  </td>

                  <td>{certificate.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Certificate Rule</h2>
        <p>
          A student becomes eligible when completed classes are equal to or
          greater than total paid classes. Once issued, the student will not be
          issued another certificate for the same course.
        </p>
      </div>
    </section>
  );
}

export default AdminCertificates;