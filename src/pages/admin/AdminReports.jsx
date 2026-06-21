import { useEffect, useMemo, useState } from "react";
import { getAdminControlReportsForAdmin } from "../../services/adminService";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function getAccessStatusClass(isRestricted) {
  return isRestricted ? "urgent" : "issued";
}

function AdminReports() {
  const [reportData, setReportData] = useState(null);
  const [activeCourseFilter, setActiveCourseFilter] = useState("all");
  const [activeTutorFilter, setActiveTutorFilter] = useState("all");
  const [activeAttentionFilter, setActiveAttentionFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  async function loadReports() {
    setIsLoading(true);
    setNotice("");

    const { data, error } = await getAdminControlReportsForAdmin();

    if (error) {
      setNotice(error.message || "Could not load admin reports.");
      setIsLoading(false);
      return;
    }

    setReportData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadReports();
  }, []);

  const summary = reportData?.summary || {};
  const courseReports = reportData?.courseReports || [];
  const tutorReports = reportData?.tutorReports || [];
  const attentionStudents = reportData?.attentionStudents || [];

  const filteredCourseReports = useMemo(() => {
    if (activeCourseFilter === "all") return courseReports;

    if (activeCourseFilter === "balance") {
      return courseReports.filter((report) => Number(report.outstandingBalance || 0) > 0);
    }

    if (activeCourseFilter === "restricted") {
      return courseReports.filter((report) => Number(report.restrictedStudents || 0) > 0);
    }

    if (activeCourseFilter === "certificate") {
      return courseReports.filter((report) => Number(report.certificateReadyStudents || 0) > 0);
    }

    return courseReports;
  }, [courseReports, activeCourseFilter]);

  const filteredTutorReports = useMemo(() => {
    if (activeTutorFilter === "all") return tutorReports;

    if (activeTutorFilter === "balance") {
      return tutorReports.filter((report) => Number(report.outstandingBalance || 0) > 0);
    }

    if (activeTutorFilter === "restricted") {
      return tutorReports.filter((report) => Number(report.restrictedStudents || 0) > 0);
    }

    return tutorReports;
  }, [tutorReports, activeTutorFilter]);

  const filteredAttentionStudents = useMemo(() => {
    if (activeAttentionFilter === "all") return attentionStudents;

    if (activeAttentionFilter === "balance") {
      return attentionStudents.filter((student) => Number(student.paymentBalance || 0) > 0);
    }

    if (activeAttentionFilter === "restricted") {
      return attentionStudents.filter((student) => student.is_restricted);
    }

    if (activeAttentionFilter === "certificate") {
      return attentionStudents.filter((student) => student.needsClassAttention);
    }

    return attentionStudents;
  }, [attentionStudents, activeAttentionFilter]);

  function getAttentionReasons(student) {
    const reasons = [];

    if (Number(student.paymentBalance || 0) > 0) {
      reasons.push("Payment balance");
    }

    if (student.is_restricted) {
      reasons.push("Restricted access");
    }

    if (student.needsClassAttention) {
      reasons.push("Certificate ready");
    }

    return reasons.length ? reasons.join(", ") : "General review";
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading reports...</h2>
        <p>Please wait while admin reports are prepared.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Report issue</h2>
        <p>{notice}</p>
        <button type="button" className="tableActionBtn" onClick={loadReports}>
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="adminReportsPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Admin Reports</h1>
          <p>
            Review student progress, payment exposure, access restrictions,
            tutor performance, course progress, and certificate readiness.
          </p>
        </div>

        <div className="headerActionGroup">
          <button type="button" onClick={loadReports}>
            Refresh
          </button>

          <button
            type="button"
            className="headerSecondaryBtn"
            onClick={() => window.print()}
          >
            Print Report
          </button>
        </div>
      </header>

      <section className="adminReportsSummaryGrid">
        <article className="dashboardCard">
          <p>Total Students</p>
          <h2>{summary.totalStudents || 0}</h2>
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

        <article className="dashboardCard wideMoneyCard">
          <p>Total Outstanding</p>
          <h2>{formatMoney(summary.totalOutstandingBalance || 0)}</h2>
        </article>
      </section>

      <section className="adminReportsFilterBar">
        <button
          type="button"
          className={activeCourseFilter === "all" ? "active" : ""}
          onClick={() => setActiveCourseFilter("all")}
        >
          All Courses
        </button>

        <button
          type="button"
          className={activeCourseFilter === "balance" ? "active" : ""}
          onClick={() => setActiveCourseFilter("balance")}
        >
          With Balance
        </button>

        <button
          type="button"
          className={activeCourseFilter === "restricted" ? "active" : ""}
          onClick={() => setActiveCourseFilter("restricted")}
        >
          Restricted
        </button>

        <button
          type="button"
          className={activeCourseFilter === "certificate" ? "active" : ""}
          onClick={() => setActiveCourseFilter("certificate")}
        >
          Certificate Ready
        </button>
      </section>

      <section className="dashboardPanel adminReportsTablePanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Course Performance Report</h2>
            <p>
              Compare students, class completion, payment exposure, restrictions,
              and assessment performance by course.
            </p>
          </div>
        </div>

        {filteredCourseReports.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No course report found</h3>
            <p>No course currently matches the selected filter.</p>
          </div>
        ) : (
          <div className="adminReportsTableWrap">
            <table className="adminReportsTable">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Students</th>
                  <th>Classes Done</th>
                  <th>Paid Classes</th>
                  <th>With Balance</th>
                  <th>Restricted</th>
                  <th>Outstanding</th>
                  <th>Avg Quiz</th>
                </tr>
              </thead>

              <tbody>
                {filteredCourseReports.map((report) => (
                  <tr key={report.course}>
                    <td>
                      <strong>{report.course || "Unnamed Course"}</strong>
                    </td>
                    <td>{report.totalStudents || 0}</td>
                    <td>{report.completedClasses || 0}</td>
                    <td>{report.totalPaidClasses || 0}</td>
                    <td>{report.studentsWithBalance || 0}</td>
                    <td>{report.restrictedStudents || 0}</td>
                    <td>{formatMoney(report.outstandingBalance || 0)}</td>
                    <td>{report.averageQuizScore || 0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adminTutorReportsFilterBar">
        <button
          type="button"
          className={activeTutorFilter === "all" ? "active" : ""}
          onClick={() => setActiveTutorFilter("all")}
        >
          All Tutors
        </button>

        <button
          type="button"
          className={activeTutorFilter === "balance" ? "active" : ""}
          onClick={() => setActiveTutorFilter("balance")}
        >
          Students With Balance
        </button>

        <button
          type="button"
          className={activeTutorFilter === "restricted" ? "active" : ""}
          onClick={() => setActiveTutorFilter("restricted")}
        >
          Restricted Students
        </button>
      </section>

      <section className="dashboardPanel adminTutorReportsPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Tutor Performance Report</h2>
            <p>
              Monitor assigned students, class progress, restricted students,
              and outstanding balance by tutor.
            </p>
          </div>
        </div>

        {filteredTutorReports.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No tutor report found</h3>
            <p>No tutor currently matches the selected filter.</p>
          </div>
        ) : (
          <div className="adminReportsTableWrap">
            <table className="adminTutorReportsTable">
              <thead>
                <tr>
                  <th>Tutor</th>
                  <th>Email</th>
                  <th>Students</th>
                  <th>Classes Done</th>
                  <th>With Balance</th>
                  <th>Restricted</th>
                  <th>Outstanding</th>
                </tr>
              </thead>

              <tbody>
                {filteredTutorReports.map((report) => (
                  <tr key={`${report.tutorName}-${report.email}`}>
                    <td>
                      <strong>{report.tutorName || "Unnamed Tutor"}</strong>
                    </td>
                    <td>{report.email || "-"}</td>
                    <td>{report.totalStudents || 0}</td>
                    <td>{report.completedClasses || 0}</td>
                    <td>{report.studentsWithBalance || 0}</td>
                    <td>{report.restrictedStudents || 0}</td>
                    <td>{formatMoney(report.outstandingBalance || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="adminAttentionFilterBar">
        <button
          type="button"
          className={activeAttentionFilter === "all" ? "active" : ""}
          onClick={() => setActiveAttentionFilter("all")}
        >
          All Attention
        </button>

        <button
          type="button"
          className={activeAttentionFilter === "balance" ? "active" : ""}
          onClick={() => setActiveAttentionFilter("balance")}
        >
          Payment Balance
        </button>

        <button
          type="button"
          className={activeAttentionFilter === "restricted" ? "active" : ""}
          onClick={() => setActiveAttentionFilter("restricted")}
        >
          Restricted
        </button>

        <button
          type="button"
          className={activeAttentionFilter === "certificate" ? "active" : ""}
          onClick={() => setActiveAttentionFilter("certificate")}
        >
          Certificate Ready
        </button>
      </section>

      <section className="dashboardPanel adminAttentionPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Students Requiring Attention</h2>
            <p>
              Students listed here may need payment follow-up, access review, or
              certificate action.
            </p>
          </div>
        </div>

        {filteredAttentionStudents.length === 0 ? (
          <div className="emptyStateBox">
            <h3>No urgent attention needed</h3>
            <p>No student currently matches the selected attention filter.</p>
          </div>
        ) : (
          <div className="adminReportsTableWrap">
            <table className="adminAttentionTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course</th>
                  <th>Reason</th>
                  <th>Payment Balance</th>
                  <th>Access</th>
                </tr>
              </thead>

              <tbody>
                {filteredAttentionStudents.map((student) => (
                  <tr key={student.id}>
                    <td>
                      <strong>
                        {student.profiles?.full_name || "Unnamed Student"}
                      </strong>
                      <small>{student.student_code || "-"}</small>
                    </td>

                    <td>{student.enrolled_course || "Data Analysis"}</td>

                    <td>{getAttentionReasons(student)}</td>

                    <td>{formatMoney(student.paymentBalance || 0)}</td>

                    <td>
                      <span
                        className={`statusPill ${getAccessStatusClass(
                          student.is_restricted
                        )}`}
                      >
                        {student.is_restricted ? "Restricted" : "Allowed"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboardPanel adminReportsRulesPanel">
        <h2>Report Reading Guide</h2>
        <p>
          Use this page to monitor learning progress, payment exposure, access
          risks, tutor workload, and certificate readiness. Students with payment
          balances, restrictions, or certificate readiness should be reviewed
          first.
        </p>
      </section>
    </section>
  );
}

export default AdminReports;