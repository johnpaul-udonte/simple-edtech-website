import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getStudentAccessStatusForCurrentUser } from "../services/studentService";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function StudentRestrictionGuard({ children }) {
  const { session } = useAuth();

  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadStudentAccess() {
      if (!session?.user?.id) {
        setNotice("No active student session found.");
        setIsLoading(false);
        return;
      }

      const { data, error } = await getStudentAccessStatusForCurrentUser(
        session.user.id
      );

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setStudent(data);
      setIsLoading(false);
    }

    loadStudentAccess();
  }, [session]);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Checking account access...</h2>
        <p>Please wait while your student access status is checked.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Access check issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  if (!student) {
    return (
      <section className="dashboardPanel">
        <h2>Student record not found</h2>
        <p>Please contact Jlux Academy admin for assistance.</p>
      </section>
    );
  }

  const paymentBalance = Number(student.payment_balance || 0);

  if (student.is_restricted) {
    return (
      <section className="dashboardPanel accessBlockedPanel">
        <span className="statusPill urgent">Restricted</span>

        <h2>Your learning access is currently restricted</h2>

        <p>
          Your account has been restricted by Jlux Academy admin. You can still
          log in and view your dashboard, but you cannot access learning action
          pages until admin restores your access.
        </p>

        <div className="restrictionReasonBox">
          <strong>Reason:</strong>
          <p>
            {student.restriction_reason ||
              "Please contact Jlux Academy admin for details."}
          </p>
        </div>

        {paymentBalance > 0 && (
          <div className="restrictionReasonBox">
            <strong>Outstanding Balance:</strong>
            <p>{formatMoney(paymentBalance)}</p>
          </div>
        )}

        <Link className="tableActionBtn accessBackLink" to="/student/dashboard">
          Back to Dashboard
        </Link>
      </section>
    );
  }

  return (
    <>
      {paymentBalance > 0 && (
        <div className="restrictionBanner warning">
          <div>
            <strong>Payment balance reminder</strong>
            <p>
              You currently have an outstanding balance of{" "}
              <strong>{formatMoney(paymentBalance)}</strong>. Your access is
              still active, but please contact admin to clear your balance.
            </p>
          </div>

          <span className="statusPill pending">Balance Due</span>
        </div>
      )}

      {children}
    </>
  );
}

export default StudentRestrictionGuard;