import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getStudentCertificatesForCurrentUser } from "../../services/studentService";

function StudentCertificates() {
  const { session, profile } = useAuth();

  const [certificateData, setCertificateData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadCertificates() {
      if (!session?.user?.id) {
        setNotice("No active student session found.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getStudentCertificatesForCurrentUser(
        session.user.id
      );

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setCertificateData(data);
      setIsLoading(false);
    }

    loadCertificates();
  }, [session]);

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
      </section>
    );
  }

  const certificates = certificateData?.certificates || [];
  const progress = certificateData?.progress || {};
  const student = certificateData?.student || {};

  const issuedCertificates = certificates.filter(
    (certificate) => certificate.status === "issued"
  );

  const pendingCertificates = certificates.filter(
    (certificate) => certificate.status === "pending_approval"
  );

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>My Certificates</h1>
          <p>
            Welcome, {profile?.full_name || "Student"}. View your learning
            completion status and issued Jlux Academy certificates.
          </p>
        </div>

        <button>Download Certificate</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Student Code</p>
          <h2>{student.student_code || "N/A"}</h2>
        </article>

        <article className="dashboardCard">
          <p>Course</p>
          <h2>{student.enrolled_course || "Data Analysis"}</h2>
        </article>

        <article className="dashboardCard">
          <p>Completed Classes</p>
          <h2>{progress.completedClasses || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Total Paid Classes</p>
          <h2>{progress.totalPaidClasses || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Remaining Classes</p>
          <h2>{progress.remainingClasses || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Completion Rate</p>
          <h2>{progress.completionRate || 0}%</h2>
        </article>

        <article className="dashboardCard">
          <p>Issued Certificates</p>
          <h2>{issuedCertificates.length}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Certificates</p>
          <h2>{pendingCertificates.length}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Certificate Eligibility</h2>

        <div className="certificateStatusBox">
          <div>
            <h3>
              {progress.isEligible
                ? "You are eligible for certification"
                : "You are not eligible yet"}
            </h3>

            <p>
              You have completed {progress.completedClasses || 0} out of{" "}
              {progress.totalPaidClasses || 0} paid classes. You need{" "}
              {progress.remainingClasses || 0} more class
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
      </div>

      <div className="dashboardPanel">
        <h2>My Certificate Records</h2>

        {certificates.length === 0 ? (
          <p>
            No certificate has been issued yet. Once you complete all required
            classes and admin issues your certificate, it will appear here.
          </p>
        ) : (
          <div className="certificateStack">
            {certificates.map((certificate) => {
              const certificateTitle =
                certificate.certificate_title ||
                certificate.title ||
                "Certificate of Completion";

              return (
                <article className="certificateCard" key={certificate.id}>
                  <div>
                    <p className="eyebrow">Jlux Academy Certificate</p>
                    <h3>{certificateTitle}</h3>
                    <p>
                      Course: <strong>{certificate.course || "-"}</strong>
                    </p>

                    <p>
                      Status:{" "}
                      <span className={`statusPill ${certificate.status}`}>
                        {certificate.status}
                      </span>
                    </p>

                    <p>
                      Issued At:{" "}
                      {certificate.issued_at
                        ? new Date(certificate.issued_at).toLocaleString()
                        : "Not issued yet"}
                    </p>

                    {certificate.notes && <p>{certificate.notes}</p>}
                  </div>

                  {certificate.certificate_url ? (
                    <a
                      className="tableActionBtn certificateLink"
                      href={certificate.certificate_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open Certificate
                    </a>
                  ) : (
                    <span className="mutedText">
                      Download link will be added later
                    </span>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Certificate Rule</h2>
        <p>
          Your certificate becomes available after you complete all paid classes
          and admin issues your certificate from the Jlux Academy admin portal.
        </p>
      </div>
    </section>
  );
}

export default StudentCertificates;