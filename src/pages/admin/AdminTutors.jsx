import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  approveTutorApplicationForAdmin,
  getAllTutorsForAdmin,
  getTutorApplicationsForAdmin,
  rejectTutorApplicationForAdmin,
} from "../../services/adminService";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function joinList(value) {
  if (!value) return "-";
  if (Array.isArray(value)) return value.length ? value.join(", ") : "-";
  return String(value);
}

function AdminTutors() {
  const { profile } = useAuth();

  const [tutors, setTutors] = useState([]);
  const [applications, setApplications] = useState([]);
  const [activeView, setActiveView] = useState("applications");
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [workingApplicationId, setWorkingApplicationId] = useState("");
  const [createdLogin, setCreatedLogin] = useState(null);

  async function loadTutorData() {
    setIsLoading(true);
    setNotice("");
    setActionError("");

    const [tutorResult, applicationResult] = await Promise.all([
      getAllTutorsForAdmin(),
      getTutorApplicationsForAdmin(),
    ]);

    if (tutorResult.error) {
      setNotice(tutorResult.error.message || "Could not load tutor records.");
      setIsLoading(false);
      return;
    }

    if (applicationResult.error) {
      setNotice(
        applicationResult.error.message || "Could not load tutor applications."
      );
      setIsLoading(false);
      return;
    }

    setTutors(tutorResult.data || []);
    setApplications(applicationResult.data || []);
    setIsLoading(false);
  }

  useEffect(() => {
    loadTutorData();
  }, []);

  const summary = useMemo(() => {
    const totalTutors = tutors.length;
    const activeTutors = tutors.filter((tutor) => tutor.is_active).length;

    const totalAssignedStudents = tutors.reduce(
      (sum, tutor) => sum + Number(tutor.students?.length || 0),
      0
    );

    const restrictedStudents = tutors.reduce((sum, tutor) => {
      const restricted =
        tutor.students?.filter((student) => student.is_restricted).length || 0;
      return sum + restricted;
    }, 0);

    const newApplications = applications.filter(
      (application) => application.application_status === "new"
    ).length;

    const approvedApplications = applications.filter(
      (application) => application.application_status === "approved"
    ).length;

    return {
      totalTutors,
      activeTutors,
      totalAssignedStudents,
      restrictedStudents,
      newApplications,
      approvedApplications,
    };
  }, [tutors, applications]);

  async function handleApproveApplication(applicationId) {
    setSuccessMessage("");
    setActionError("");
    setCreatedLogin(null);
    setWorkingApplicationId(applicationId);

    const { data, error } = await approveTutorApplicationForAdmin(applicationId);

    if (error || data?.error) {
      setActionError(
        error?.message || data?.error || "Tutor application could not be approved."
      );
      setWorkingApplicationId("");
      return;
    }

    setCreatedLogin(data?.tutor || null);
    setSuccessMessage("Tutor application approved and login created.");
    setWorkingApplicationId("");
    await loadTutorData();
  }

  async function handleRejectApplication(applicationId) {
    const confirmReject = window.confirm(
      "Are you sure you want to reject this tutor application?"
    );

    if (!confirmReject) return;

    setSuccessMessage("");
    setActionError("");
    setCreatedLogin(null);
    setWorkingApplicationId(applicationId);

    const { error } = await rejectTutorApplicationForAdmin(
      applicationId,
      profile?.id,
      "Tutor application rejected by admin."
    );

    if (error) {
      setActionError(error.message || "Tutor application could not be rejected.");
      setWorkingApplicationId("");
      return;
    }

    setSuccessMessage("Tutor application rejected.");
    setWorkingApplicationId("");
    await loadTutorData();
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading tutors...</h2>
        <p>Please wait while tutor records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Tutor management issue</h2>
        <p>{notice}</p>

        <button type="button" className="tableActionBtn" onClick={loadTutorData}>
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="adminTutorsPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Tutor Management</h1>
          <p>
            Review tutor applications, approve tutor login access, and monitor
            active tutor workload.
          </p>
        </div>

        <button type="button" onClick={loadTutorData}>
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

      {createdLogin && (
        <div className="tutorLoginCreatedBox">
          <div>
            <p className="eyebrow">Tutor Login Created</p>
            <h3>{createdLogin.full_name}</h3>
            <p>
              Email: <strong>{createdLogin.email}</strong>
            </p>
            <p>
              Temporary Password:{" "}
              <strong>{createdLogin.temporary_password}</strong>
            </p>
          </div>

          <button
            type="button"
            className="tableActionBtn"
            onClick={() => {
              navigator.clipboard.writeText(
                `Tutor Login\nEmail: ${createdLogin.email}\nTemporary Password: ${createdLogin.temporary_password}`
              );
            }}
          >
            Copy Login
          </button>
        </div>
      )}

      <section className="dashboardGrid adminTutorSummaryGrid">
        <article className="dashboardCard">
          <p>Total Tutors</p>
          <h2>{summary.totalTutors}</h2>
        </article>

        <article className="dashboardCard">
          <p>Active Tutors</p>
          <h2>{summary.activeTutors}</h2>
        </article>

        <article className="dashboardCard">
          <p>New Applications</p>
          <h2>{summary.newApplications}</h2>
        </article>

        <article className="dashboardCard">
          <p>Approved Apps</p>
          <h2>{summary.approvedApplications}</h2>
        </article>

        <article className="dashboardCard">
          <p>Assigned Students</p>
          <h2>{summary.totalAssignedStudents}</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted Students</p>
          <h2>{summary.restrictedStudents}</h2>
        </article>
      </section>

      <div className="adminTutorTabs">
        <button
          type="button"
          className={activeView === "applications" ? "active" : ""}
          onClick={() => setActiveView("applications")}
        >
          Tutor Applications
        </button>

        <button
          type="button"
          className={activeView === "activeTutors" ? "active" : ""}
          onClick={() => setActiveView("activeTutors")}
        >
          Active Tutors
        </button>
      </div>

      {activeView === "applications" ? (
        <section className="dashboardPanel adminTutorsTablePanel">
          <h2>Tutor Applications</h2>

          {applications.length === 0 ? (
            <p>No tutor application has been submitted yet.</p>
          ) : (
            <div className="adminTutorsTableWrap">
              <table className="adminTutorsTable">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Expertise</th>
                    <th>Tools</th>
                    <th>Availability</th>
                    <th>Mode</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {applications.map((application) => {
                    const isWorking = workingApplicationId === application.id;
                    const isNew = application.application_status === "new";

                    return (
                      <tr key={application.id}>
                        <td>
                          <strong>{application.full_name}</strong>
                          <small>{application.email}</small>
                          <small>{application.phone}</small>
                        </td>

                        <td>
                          {application.area_of_expertise || "-"}
                          <small>
                            {application.years_of_experience || 0} year(s) exp.
                          </small>
                        </td>

                        <td>{joinList(application.tools)}</td>

                        <td>
                          <strong>{joinList(application.available_days)}</strong>
                          <small>{joinList(application.available_times)}</small>
                        </td>

                        <td>{application.teaching_mode || "-"}</td>

                        <td>
                          <span
                            className={`statusPill ${application.application_status}`}
                          >
                            {application.application_status}
                          </span>
                        </td>

                        <td>{formatDate(application.created_at)}</td>

                        <td>
                          {isNew ? (
                            <div className="tutorActionStack">
                              <button
                                type="button"
                                className="tableActionBtn"
                                disabled={isWorking}
                                onClick={() =>
                                  handleApproveApplication(application.id)
                                }
                              >
                                {isWorking ? "Approving..." : "Approve"}
                              </button>

                              <button
                                type="button"
                                className="tableActionBtn rejectTutorBtn"
                                disabled={isWorking}
                                onClick={() =>
                                  handleRejectApplication(application.id)
                                }
                              >
                                Reject
                              </button>
                            </div>
                          ) : (
                            <span className="mutedText">Reviewed</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : (
        <section className="dashboardPanel adminTutorsTablePanel">
          <h2>Active Tutors</h2>

          {tutors.length === 0 ? (
            <p>No tutors have been created yet.</p>
          ) : (
            <div className="adminTutorsTableWrap">
              <table className="adminTutorsTable">
                <thead>
                  <tr>
                    <th>Tutor</th>
                    <th>Email</th>
                    <th>Specialisation</th>
                    <th>Tools</th>
                    <th>Students</th>
                    <th>Completed Classes</th>
                    <th>Student Balance</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {tutors.map((tutor) => {
                    const students = tutor.students || [];

                    const completedClasses = students.reduce(
                      (sum, student) =>
                        sum + Number(student.completed_classes || 0),
                      0
                    );

                    const totalStudentBalance = students.reduce(
                      (sum, student) =>
                        sum + Number(student.payment_balance || 0),
                      0
                    );

                    return (
                      <tr key={tutor.id}>
                        <td>
                          <strong>
                            {tutor.profiles?.full_name || "Unnamed Tutor"}
                          </strong>
                        </td>

                        <td>{tutor.profiles?.email || "-"}</td>

                        <td>{tutor.specialisation || "Not set"}</td>

                        <td>{joinList(tutor.tools)}</td>

                        <td>{students.length}</td>

                        <td>{completedClasses}</td>

                        <td>{formatMoney(totalStudentBalance)}</td>

                        <td>
                          <span
                            className={`statusPill ${
                              tutor.is_active ? "approved" : "pending"
                            }`}
                          >
                            {tutor.is_active ? "Active" : "Inactive"}
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
      )}
    </section>
  );
}

export default AdminTutors;