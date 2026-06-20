import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getStudentAccessStatusForCurrentUser } from "../services/studentService";

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function StudentRestrictionBanner() {
  const { session } = useAuth();

  const [student, setStudent] = useState(null);

  useEffect(() => {
    async function loadAccessStatus() {
      if (!session?.user?.id) {
        return;
      }

      const { data } = await getStudentAccessStatusForCurrentUser(
        session.user.id
      );

      setStudent(data);
    }

    loadAccessStatus();
  }, [session]);

  if (!student) {
    return null;
  }

  const paymentBalance = Number(student.payment_balance || 0);

  if (!student.is_restricted && paymentBalance <= 0) {
    return null;
  }

  if (student.is_restricted) {
    return (
      <div className="restrictionBanner restricted">
        <div>
          <strong>Your account access is currently restricted.</strong>
          <p>
            Reason:{" "}
            {student.restriction_reason ||
              "Please contact Jlux Academy admin for assistance."}
          </p>
        </div>

        <span className="statusPill urgent">Restricted</span>
      </div>
    );
  }

  return (
    <div className="restrictionBanner warning">
      <div>
        <strong>Payment balance reminder</strong>
        <p>
          You currently have an outstanding balance of{" "}
          <strong>{formatMoney(paymentBalance)}</strong>. Your access is still
          active, but please contact admin to clear your balance.
        </p>
      </div>

      <span className="statusPill pending">Balance Due</span>
    </div>
  );
}

export default StudentRestrictionBanner;