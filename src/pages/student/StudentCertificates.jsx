import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { getStudentCertificatesForCurrentUser } from "../../services/studentService";

function formatDateTime(value) {
  if (!value) return "Not issued yet";

  return new Date(value).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StudentCertificates() {
  const { session, profile } = useAuth();

  const [certificateData, setCertificateData] = useState(null);
  const [signedUrls, setSignedUrls] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadCertificates() {
    setIsLoading(true);
    setNotice("");

    if (!session?.user?.id) {
      setNotice("No active student session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getStudentCertificatesForCurrentUser(
      session.user.id
    );

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
  }, [session?.user?.id]);

  const certificates = certificateData?.certificates || [];
  const progress = certificateData?.progress || {};
  const student = certificateData?.student || {};

  useEffect(() => {
    async function loadCertificateLinks() {
      if (!supabase || certificates.length === 0) {
        setSignedUrls({});
        return;
      }

      const urlMap = {};

      for (const certificate of certificates) {
        const filePath =
          certificate.certificate_file_path || certificate.certificate_url;

        if (!filePath) continue;

        if (String(filePath).startsWith("http")) {
          urlMap[certificate.id] = filePath;
          continue;
        }

        const { data, error } = await supabase.storage
          .from("student-certificates")
          .createSignedUrl(filePath, 60 * 60);

        if (!error && data?.signedUrl) {
          urlMap[certificate.id] = data.signedUrl;
        }
      }

      setSignedUrls(urlMap);
    }

    loadCertificateLinks();
  }, [certificates.length]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading certificates...</h2>
        <p>Please wait while your certificate records are loaded.</p>
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

  const issuedCertificates = certificates.filter(
    (certificate) => certificate.status === "issued"
  );

  const pendingCertificates = certificates.filter(
    (certificate) => certificate.status === "pending_approval"
  );

  const firstDownloadableCertificate = issuedCertificates.find(
    (certificate) =>
      signedUrls[certificate.id] ||
      certificate.certificate_url ||
      certificate.certificate_file_path
  );

  return (
    <section className="studentCertificatesPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>My Certificates</h1>
          <p>
            Welcome, {profile?.full_name || "Student"}. View and download your
            issued Jlux Academy certificates.
          </p>
        </div>

        {firstDownloadableCertificate ? (
          <a
            href={signedUrls[firstDownloadableCertificate.id]}
            target="_blank"
            rel="noreferrer"
            className="headerSecondaryBtn"
          >
            Download Certificate
          </a>
        ) : (
          <button type="button" disabled>
            No Certificate Yet
          </button>
        )}
      </header>

      <section className="studentCertificateSummaryGrid">
        <article className="dashboardCard">
          <p>Student Code</p>
          <h2>{student.student_code || "N/A"}</h2>
        </article>

        <article className="dashboardCard">
          <p>Course</p>
          <h2>{student.enrolled_course || "Data Analysis"}</h2>
        </article>

        <article className="dashboardCard">
          <p>Completed</p>
          <h2>{progress.completedClasses || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Paid Classes</p>
          <h2>{progress.totalPaidClasses || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Remaining</p>
          <h2>{progress.remainingClasses || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Completion</p>
          <h2>{progress.completionRate || 0}%</h2>
        </article>

        <article className="dashboardCard">
          <p>Issued Certs</p>
          <h2>{issuedCertificates.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Certs</p>
          <h2>{pendingCertificates.length}</h2>
        </article>
      </section>

      <section className="dashboardPanel certificateEligibilityPanel">
        <div className="certificateStatusBox">
          <div>
            <p className="eyebrow">Certificate Eligibility</p>

            <h3>
              {progress.isEligible
                ? "You are eligible for certification"
                : "You are not eligible yet"}
            </h3>

            <p>
              You have completed <strong>{progress.completedClasses || 0}</strong>{" "}
              out of <strong>{progress.totalPaidClasses || 0}</strong> paid
              classes. You need{" "}
              <strong>{progress.remainingClasses || 0}</strong> more class
              {progress.remainingClasses === 1 ? "" : "es"} to complete your
              learning requirement.
            </p>

            <div className="progressTrack certificateProgress">
              <div
                className="progressFill"
                style={{ width: `${progress.completionRate || 0}%` }}
              />
            </div>
          </div>

          <span
            className={`statusPill ${
              progress.isEligible ? "approved" : "pending"
            }`}
          >
            {progress.isEligible ? "Eligible" : "In Progress"}
          </span>
        </div>
      </section>

      <section className="dashboardPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>My Certificate Records</h2>
            <p>
              Download any certificate uploaded and issued by Jlux Academy admin.
            </p>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No certificate yet</h3>
            <p>
              No certificate has been issued yet. Once admin uploads your
              certificate, it will appear here for download.
            </p>
          </div>
        ) : (
          <div className="certificateStack">
            {certificates.map((certificate) => {
              const certificateTitle =
                certificate.certificate_title ||
                certificate.title ||
                "Certificate of Completion";

              const downloadUrl = signedUrls[certificate.id];

              return (
                <article className="certificateCard" key={certificate.id}>
                  <div className="certificateRibbon">Jlux Academy</div>

                  <div className="certificateCardBody">
                    <div>
                      <p className="eyebrow">Certificate</p>
                      <h3>{certificateTitle}</h3>

                      <div className="certificateMetaGrid">
                        <span>
                          Course
                          <strong>{certificate.course || "-"}</strong>
                        </span>

                        <span>
                          Status
                          <strong>{certificate.status || "-"}</strong>
                        </span>

                        <span>
                          Issued
                          <strong>{formatDateTime(certificate.issued_at)}</strong>
                        </span>
                      </div>

                      {certificate.notes && (
                        <p className="certificateNote">{certificate.notes}</p>
                      )}
                    </div>

                    <div className="certificateActionBox">
                      <span className={`statusPill ${certificate.status}`}>
                        {certificate.status}
                      </span>

                      {downloadUrl ? (
                        <a
                          className="tableActionBtn certificateLink"
                          href={downloadUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Download
                        </a>
                      ) : (
                        <span className="mutedText">No file attached</span>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="dashboardPanel">
        <h2>Certificate Rule</h2>
        <p>
          Your certificate becomes available after admin uploads and issues it
          from the Jlux Academy admin portal.
        </p>
      </section>
    </section>
  );
}

export default StudentCertificates;