import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { getCertificatesForAdmin } from "../../services/adminService";

const courseOptions = [
  "Full Data Analysis Training",
  "Data Analysis",
  "Excel",
  "Power BI",
  "SQL",
  "Python",
  "Excel + Power BI + SQL",
];

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

function cleanFileName(name) {
  return String(name || "certificate")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/-+/g, "-");
}

function AdminCertificates() {
  const { session, profile } = useAuth();

  const [certificateData, setCertificateData] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [certificateCourse, setCertificateCourse] = useState("Data Analysis");
  const [certificateTitle, setCertificateTitle] = useState("");
  const [certificateNotes, setCertificateNotes] = useState("");
  const [certificateFile, setCertificateFile] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadCertificates() {
    setIsLoading(true);
    setNotice("");
    setActionError("");

    const { data, error } = await getCertificatesForAdmin();

    if (error) {
      setNotice(error.message || "Could not load certificate records.");
      setIsLoading(false);
      return;
    }

    setCertificateData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadCertificates();
  }, []);

  const students = certificateData?.students || [];
  const certificates = certificateData?.certificates || [];
  const summary = certificateData?.summary || {};

  const selectedStudent = useMemo(() => {
    return students.find((student) => student.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  useEffect(() => {
    async function loadSignedUrls() {
      if (!supabase || certificates.length === 0) return;

      const urlMap = {};

      for (const certificate of certificates) {
        const filePath =
          certificate.certificate_file_path || certificate.certificate_url;

        if (!filePath) continue;

        if (String(filePath).startsWith("http")) {
          urlMap[certificate.id] = filePath;
          continue;
        }

        const { data } = await supabase.storage
          .from("student-certificates")
          .createSignedUrl(filePath, 60 * 60);

        if (data?.signedUrl) {
          urlMap[certificate.id] = data.signedUrl;
        }
      }

      setSignedUrls(urlMap);
    }

    loadSignedUrls();
  }, [certificates.length]);

  function handleStudentSelect(studentId) {
    setSelectedStudentId(studentId);
    setSuccessMessage("");
    setActionError("");

    const student = students.find((item) => item.id === studentId);

    if (!student) {
      setCertificateCourse("Data Analysis");
      setCertificateTitle("");
      return;
    }

    const defaultCourse = student.enrolled_course || "Data Analysis";

    setCertificateCourse(defaultCourse);
    setCertificateTitle(`${defaultCourse} Certificate`);
  }

  async function handleUploadCertificate(event) {
    event.preventDefault();

    setSuccessMessage("");
    setActionError("");

    if (!supabase) {
      setActionError("Supabase is not configured yet.");
      return;
    }

    if (!session?.user?.id) {
      setActionError("Admin session not found. Please log in again.");
      return;
    }

    if (!selectedStudentId) {
      setActionError("Please select a student.");
      return;
    }

    if (!certificateCourse) {
      setActionError("Please select a certificate course.");
      return;
    }

    if (!certificateTitle.trim()) {
      setActionError("Please enter certificate title.");
      return;
    }

    if (!certificateFile) {
      setActionError("Please upload the certificate file.");
      return;
    }

    setIsUploading(true);

    const student = students.find((item) => item.id === selectedStudentId);

    if (!student) {
      setActionError("Selected student was not found.");
      setIsUploading(false);
      return;
    }

    const fileExt = certificateFile.name.split(".").pop() || "pdf";
    const fileName = cleanFileName(certificateFile.name);
    const filePath = `${selectedStudentId}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("student-certificates")
      .upload(filePath, certificateFile, {
        cacheControl: "3600",
        upsert: false,
        contentType: certificateFile.type || "application/octet-stream",
      });

    if (uploadError) {
      setActionError(uploadError.message || "Could not upload certificate file.");
      setIsUploading(false);
      return;
    }

    const { data: certificateRows, error: certificateError } = await supabase
      .from("certificates")
      .insert({
        student_id: selectedStudentId,
        title: certificateTitle.trim(),
        certificate_title: certificateTitle.trim(),
        course: certificateCourse,
        status: "issued",
        issued_at: new Date().toISOString(),
        certificate_url: filePath,
        certificate_file_path: filePath,
        issued_by: profile?.id || session.user.id,
        notes: certificateNotes || null,
        updated_at: new Date().toISOString(),
      })
      .select();

    if (certificateError) {
      setActionError(
        certificateError.message ||
          "Certificate file uploaded, but record could not be saved."
      );
      setIsUploading(false);
      return;
    }

    if (student.profile_id) {
      await supabase.from("student_notifications").insert({
        recipient_profile_id: student.profile_id,
        student_id: selectedStudentId,
        title: "Certificate Uploaded",
        message: `Your ${certificateCourse} certificate has been uploaded. You can now download it from your student portal.`,
        category: "certificate",
        is_read: false,
        created_by: profile?.id || session.user.id,
      });
    }

    setSuccessMessage(
      `${student.profiles?.full_name || "Student"} certificate has been uploaded successfully.`
    );

    setSelectedStudentId("");
    setCertificateCourse("Data Analysis");
    setCertificateTitle("");
    setCertificateNotes("");
    setCertificateFile(null);

    const fileInput = document.getElementById("certificateFileInput");
    if (fileInput) fileInput.value = "";

    setIsUploading(false);
    await loadCertificates();
  }

  function handleExportCertificates() {
    if (certificates.length === 0) {
      setActionError("No certificate record available to export.");
      return;
    }

    const headers = [
      "Certificate Title",
      "Course",
      "Status",
      "Issued At",
      "Notes",
    ];

    const rows = certificates.map((certificate) =>
      [
        certificate.certificate_title || certificate.title || "-",
        certificate.course || "-",
        certificate.status || "-",
        certificate.issued_at || "-",
        certificate.notes || "-",
      ]
        .map((value) => `"${String(value).replaceAll('"', '""')}"`)
        .join(",")
    );

    const csv = [headers.map((item) => `"${item}"`).join(","), ...rows].join(
      "\n"
    );

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `jlux-certificates-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    setSuccessMessage("Certificate records exported successfully.");
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

        <button type="button" className="tableActionBtn" onClick={loadCertificates}>
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="adminCertificatesPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Certificate Management</h1>
          <p>
            Upload certificates for students by course. Once uploaded, students
            can download them from their portal.
          </p>
        </div>

        <button type="button" onClick={handleExportCertificates}>
          Export Certificates
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

      <section className="dashboardGrid adminCertificateSummaryGrid">
        <article className="dashboardCard">
          <p>Total Students</p>
          <h2>{summary.totalStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Eligible</p>
          <h2>{summary.eligibleStudents || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Total Certs</p>
          <h2>{summary.totalCertificates || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Issued</p>
          <h2>{summary.issuedCertificates || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending</p>
          <h2>{summary.pendingCertificates || 0}</h2>
        </article>
      </section>

      <section className="dashboardPanel certificateUploadPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Upload Student Certificate</h2>
            <p>
              Select a student, choose the course, upload the certificate file,
              and publish it to the student portal.
            </p>
          </div>
        </div>

        <form className="certificateUploadForm" onSubmit={handleUploadCertificate}>
          <label>
            Student
            <select
              value={selectedStudentId}
              onChange={(event) => handleStudentSelect(event.target.value)}
            >
              <option value="">Choose student</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.profiles?.full_name || "Unnamed Student"} —{" "}
                  {student.student_code || "-"} —{" "}
                  {student.enrolled_course || "Data Analysis"}
                </option>
              ))}
            </select>
          </label>

          <label>
            Course
            <select
              value={certificateCourse}
              onChange={(event) => {
                setCertificateCourse(event.target.value);
                setCertificateTitle(`${event.target.value} Certificate`);
              }}
            >
              {courseOptions.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </label>

          <label>
            Certificate Title
            <input
              type="text"
              value={certificateTitle}
              placeholder="e.g. Excel Certificate"
              onChange={(event) => setCertificateTitle(event.target.value)}
            />
          </label>

          <label>
            Certificate File
            <input
              id="certificateFileInput"
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={(event) =>
                setCertificateFile(event.target.files?.[0] || null)
              }
            />
          </label>

          <label className="certificateNotesField">
            Notes
            <textarea
              rows="3"
              value={certificateNotes}
              placeholder="Optional certificate note..."
              onChange={(event) => setCertificateNotes(event.target.value)}
            />
          </label>

          {selectedStudent && (
            <div className="selectedCertificateStudentPreview">
              <strong>{selectedStudent.profiles?.full_name}</strong>
              <span>{selectedStudent.profiles?.email}</span>
              <span>{selectedStudent.student_code}</span>
              <span>{selectedStudent.enrolled_course || "Data Analysis"}</span>
            </div>
          )}

          <button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload Certificate"}
          </button>
        </form>
      </section>

      <section className="dashboardPanel adminCertificatesTablePanel">
        <h2>Student Certificate Eligibility</h2>

        {students.length === 0 ? (
          <p>No student records available.</p>
        ) : (
          <div className="adminCertificatesTableWrap">
            <table className="adminCertificatesTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Course</th>
                  <th>Tutor</th>
                  <th>Progress</th>
                  <th>Remaining</th>
                  <th>Certificate</th>
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboardPanel adminCertificatesTablePanel">
        <h2>Issued Certificate Records</h2>

        {certificates.length === 0 ? (
          <p>No certificates have been issued yet.</p>
        ) : (
          <div className="adminCertificatesTableWrap">
            <table className="adminCertificatesTable">
              <thead>
                <tr>
                  <th>Certificate</th>
                  <th>Course</th>
                  <th>Status</th>
                  <th>Issued At</th>
                  <th>Notes</th>
                  <th>File</th>
                </tr>
              </thead>

              <tbody>
                {certificates.map((certificate) => (
                  <tr key={certificate.id}>
                    <td>
                      {certificate.certificate_title ||
                        certificate.title ||
                        "Certificate"}
                    </td>

                    <td>{certificate.course || "-"}</td>

                    <td>
                      <span className={`statusPill ${certificate.status}`}>
                        {certificate.status}
                      </span>
                    </td>

                    <td>{formatDateTime(certificate.issued_at)}</td>

                    <td>{certificate.notes || "-"}</td>

                    <td>
                      {signedUrls[certificate.id] ? (
                        <a
                          href={signedUrls[certificate.id]}
                          target="_blank"
                          rel="noreferrer"
                          className="tableActionBtn"
                        >
                          Open
                        </a>
                      ) : (
                        <span className="mutedText">No file</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboardPanel">
        <h2>Certificate Rule</h2>
        <p>
          Admin can upload certificates for different courses. Once uploaded, the
          selected student receives a notification and can download the
          certificate from the student portal.
        </p>
      </section>
    </section>
  );
}

export default AdminCertificates;