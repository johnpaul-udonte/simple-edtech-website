import { useEffect, useState } from "react";
import { getReportsForAdmin } from "../../services/adminService";

function AdminReports() {
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadReports() {
      const { data, error } = await getReportsForAdmin();

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setReportData(data);
      setIsLoading(false);
    }

    loadReports();
  }, []);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading reports...</h2>
        <p>Please wait while Jlux Academy reports are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Report issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const summary = reportData?.summary || {};
  const courseReports = reportData?.courseReports || [];
  const tutorReports = reportData?.tutorReports || [];
  const bookingStatusReports = reportData?.bookingStatusReports || [];
  const assignmentReports = reportData?.assignmentReports || [];

  const classCompletionRate =
    Number(summary.totalPaidClasses || 0) > 0
      ? Math.round(
          (Number(summary.totalCompletedClasses || 0) /
            Number(summary.totalPaidClasses || 0)) *
            100
        )
      : 0;

  const reportCards = [
    { label: "Total Students", value: summary.totalStudents || 0 },
    { label: "Active Students", value: summary.activeStudents || 0 },
    { label: "Restricted Students", value: summary.restrictedStudents || 0 },
    { label: "Active Tutors", value: summary.activeTutors || 0 },
    {
      label: "Outstanding Balance",
      value: `₦${Number(
        summary.totalOutstandingBalance || 0
      ).toLocaleString()}`,
    },
    {
      label: "Confirmed Payments",
      value: `₦${Number(summary.totalConfirmedPayment || 0).toLocaleString()}`,
    },
    { label: "Class Completion", value: `${classCompletionRate}%` },
    { label: "Total Bookings", value: summary.totalBookings || 0 },
    { label: "Assignments", value: summary.totalAssignments || 0 },
    { label: "Submissions", value: summary.totalSubmissions || 0 },
    { label: "Pending Payments", value: summary.pendingPayments || 0 },
    { label: "Rejected Payments", value: summary.rejectedPayments || 0 },
  ];

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Reports & Analytics</h1>
          <p>
            View real business reports across students, tutors, payments,
            schedules, assignments, submissions, balances, and learning progress.
          </p>
        </div>

        <button>Export Report</button>
      </div>

      <div className="dashboardGrid">
        {reportCards.map((card) => (
          <article className="dashboardCard" key={card.label}>
            <p>{card.label}</p>
            <h2>{card.value}</h2>
          </article>
        ))}
      </div>

      <div className="dashboardPanel">
        <h2>Course Performance Report</h2>

        {courseReports.length === 0 ? (
          <p>No course data available yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Course</th>
                <th>Students</th>
                <th>Active</th>
                <th>Restricted</th>
                <th>Completed Classes</th>
                <th>Paid Classes</th>
                <th>Completion</th>
                <th>Outstanding Balance</th>
              </tr>
            </thead>

            <tbody>
              {courseReports.map((course) => {
                const completion =
                  Number(course.paidClasses || 0) > 0
                    ? Math.round(
                        (Number(course.completedClasses || 0) /
                          Number(course.paidClasses || 0)) *
                          100
                      )
                    : 0;

                return (
                  <tr key={course.course}>
                    <td>{course.course}</td>
                    <td>{course.students}</td>
                    <td>{course.active}</td>
                    <td>{course.restricted}</td>
                    <td>{course.completedClasses}</td>
                    <td>{course.paidClasses}</td>
                    <td>{completion}%</td>
                    <td>₦{course.outstandingBalance.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Tutor Workload Report</h2>

        {tutorReports.length === 0 ? (
          <p>No tutor data available yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Tutor</th>
                <th>Email</th>
                <th>Specialisation</th>
                <th>Assigned Students</th>
                <th>Completed Classes</th>
                <th>Student Balance</th>
                <th>Restricted Students</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {tutorReports.map((tutor) => (
                <tr key={tutor.id}>
                  <td>{tutor.tutorName}</td>
                  <td>{tutor.email}</td>
                  <td>{tutor.specialisation}</td>
                  <td>{tutor.assignedStudents}</td>
                  <td>{tutor.completedClasses}</td>
                  <td>₦{tutor.totalStudentBalance.toLocaleString()}</td>
                  <td>{tutor.restrictedAssignedStudents}</td>
                  <td>
                    <span
                      className={`statusPill ${
                        tutor.isActive ? "approved" : "cancelled"
                      }`}
                    >
                      {tutor.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Schedule Status Report</h2>

        {bookingStatusReports.length === 0 ? (
          <p>No schedule booking data available yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Booking Status</th>
                <th>Count</th>
              </tr>
            </thead>

            <tbody>
              {bookingStatusReports.map((item) => (
                <tr key={item.status}>
                  <td>
                    <span className={`statusPill ${item.status}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Assignment Report</h2>

        {assignmentReports.length === 0 ? (
          <p>No assignment data available yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Tutor</th>
                <th>Tool</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Submissions</th>
                <th>Pending</th>
                <th>Graded</th>
                <th>Average Score</th>
              </tr>
            </thead>

            <tbody>
              {assignmentReports.map((assignment) => (
                <tr key={assignment.id}>
                  <td>{assignment.title}</td>
                  <td>{assignment.tutorName}</td>
                  <td>{assignment.tool || "General"}</td>
                  <td>{assignment.dueDate || "-"}</td>
                  <td>
                    <span className={`statusPill ${assignment.status}`}>
                      {assignment.status}
                    </span>
                  </td>
                  <td>{assignment.submissions}</td>
                  <td>{assignment.pending}</td>
                  <td>{assignment.graded}</td>
                  <td>{assignment.averageScore}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Management Interpretation</h2>
        <p>
          This report gives admin a single view of learning progress, tutor
          workload, student restrictions, outstanding balances, payment
          confirmation, schedule movement, assignment submission, and grading
          performance.
        </p>
      </div>
    </section>
  );
}

export default AdminReports;