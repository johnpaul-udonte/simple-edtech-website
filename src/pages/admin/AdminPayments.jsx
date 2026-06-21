import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { getPaymentsForAdmin } from "../../services/adminService";

const coursePrices = {
  "Full Data Analysis Training": 120000,
  "Data Analysis": 120000,
  Excel: 40000,
  "Power BI": 40000,
  SQL: 40000,
  Python: 50000,
  "Excel + Power BI + SQL": 120000,
};

function formatMoney(value) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

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

function AdminPayments() {
  const { session, profile } = useAuth();

  const [paymentData, setPaymentData] = useState(null);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [courseFee, setCourseFee] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");

  async function loadPayments() {
    setIsLoading(true);
    setNotice("");
    setActionError("");

    const { data, error } = await getPaymentsForAdmin();

    if (error) {
      setNotice(error.message || "Could not load payment records.");
      setIsLoading(false);
      return;
    }

    setPaymentData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, []);

  const payments = paymentData?.payments || [];
  const students = paymentData?.students || [];

  const selectedStudent = useMemo(() => {
    return students.find((student) => student.id === selectedStudentId) || null;
  }, [students, selectedStudentId]);

  const calculatedBalance = useMemo(() => {
    const fee = Number(courseFee || 0);
    const paid = Number(amountPaid || 0);

    return Math.max(fee - paid, 0);
  }, [courseFee, amountPaid]);

  function handleSelectStudent(studentId) {
    setSelectedStudentId(studentId);
    setSuccessMessage("");
    setActionError("");

    const student = students.find((item) => item.id === studentId);

    if (!student) {
      setCourseFee("");
      setAmountPaid("");
      setPaymentNote("");
      return;
    }

    const defaultCourseFee =
      Number(student.course_fee || 0) ||
      coursePrices[student.enrolled_course] ||
      coursePrices["Data Analysis"] ||
      0;

    const defaultAmountPaid = Number(student.amount_paid || 0);

    setCourseFee(String(defaultCourseFee));
    setAmountPaid(String(defaultAmountPaid));
    setPaymentNote("");
  }

  async function handleSavePayment(event) {
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

    const feeValue = Number(courseFee || 0);
    const paidValue = Number(amountPaid || 0);
    const balanceValue = Math.max(feeValue - paidValue, 0);

    if (feeValue <= 0) {
      setActionError("Please enter the full course fee.");
      return;
    }

    if (paidValue < 0) {
      setActionError("Amount paid cannot be negative.");
      return;
    }

    setIsSaving(true);

    const { data: freshStudentRows, error: freshStudentError } = await supabase
      .from("students")
      .select(
        `
        id,
        profile_id,
        student_code,
        enrolled_course,
        payment_balance,
        amount_paid,
        course_fee,
        profiles:profiles!students_profile_id_fkey (
          full_name,
          email
        )
      `
      )
      .eq("id", selectedStudentId)
      .limit(1);

    if (freshStudentError) {
      setActionError(freshStudentError.message || "Could not confirm student.");
      setIsSaving(false);
      return;
    }

    const freshStudent = Array.isArray(freshStudentRows)
      ? freshStudentRows[0]
      : null;

    if (!freshStudent) {
      setActionError("Selected student was not found.");
      setIsSaving(false);
      return;
    }

    const previousAmountPaid = Number(freshStudent.amount_paid || 0);
    const paymentIncrease = Math.max(paidValue - previousAmountPaid, 0);

    const { error: updateStudentError } = await supabase
      .from("students")
      .update({
        course_fee: feeValue,
        amount_paid: paidValue,
        payment_balance: balanceValue,
        updated_at: new Date().toISOString(),
      })
      .eq("id", selectedStudentId);

    if (updateStudentError) {
      setActionError(
        updateStudentError.message || "Could not update student payment."
      );
      setIsSaving(false);
      return;
    }

    if (paymentIncrease > 0) {
      const { error: paymentInsertError } = await supabase
        .from("payments")
        .insert({
          student_id: selectedStudentId,
          amount: paymentIncrease,
          status: "confirmed",
          confirmed_by: profile?.id || session.user.id,
          confirmed_at: new Date().toISOString(),
          notes:
            paymentNote ||
            `Payment updated. Total paid is now ${formatMoney(paidValue)}.`,
          updated_at: new Date().toISOString(),
        });

      if (paymentInsertError) {
        setActionError(
          paymentInsertError.message ||
            "Student balance was updated, but payment record could not be saved."
        );
        setIsSaving(false);
        await loadPayments();
        return;
      }
    }

    if (freshStudent.profile_id) {
      await supabase.from("student_notifications").insert({
        recipient_profile_id: freshStudent.profile_id,
        student_id: selectedStudentId,
        title: "Payment Updated",
        message: `Your payment record has been updated. Course fee: ${formatMoney(
          feeValue
        )}. Amount paid: ${formatMoney(
          paidValue
        )}. Balance remaining: ${formatMoney(balanceValue)}.`,
        category: "payment",
        is_read: false,
        created_by: profile?.id || session.user.id,
      });
    }

    setSuccessMessage(
      `${
        freshStudent.profiles?.full_name || "Student"
      } payment has been updated. Balance remaining: ${formatMoney(
        balanceValue
      )}.`
    );

    setSelectedStudentId("");
    setCourseFee("");
    setAmountPaid("");
    setPaymentNote("");
    setIsSaving(false);

    await loadPayments();
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading payments...</h2>
        <p>Please wait while payment records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Payment management issue</h2>
        <p>{notice}</p>

        <button type="button" className="tableActionBtn" onClick={loadPayments}>
          Try Again
        </button>
      </section>
    );
  }

  return (
    <section className="adminPaymentsPage">
      <header className="dashboardHeader compactDashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Payment Management</h1>
          <p>
            Enter student course fee, amount paid, and automatically calculate
            the balance remaining for the student portal.
          </p>
        </div>

        <button type="button" onClick={loadPayments}>
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

      <section className="dashboardGrid adminPaymentSummaryGrid">
        <article className="dashboardCard">
          <p>Total Confirmed</p>
          <h2>{formatMoney(paymentData?.totalConfirmedAmount || 0)}</h2>
        </article>

        <article className="dashboardCard">
          <p>Outstanding</p>
          <h2>{formatMoney(paymentData?.totalOutstandingBalance || 0)}</h2>
        </article>

        <article className="dashboardCard">
          <p>Confirmed</p>
          <h2>{paymentData?.confirmedPaymentsCount || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending</p>
          <h2>{paymentData?.pendingPaymentsCount || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Rejected</p>
          <h2>{paymentData?.rejectedPaymentsCount || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted</p>
          <h2>{paymentData?.restrictedStudents || 0}</h2>
        </article>
      </section>

      <section className="dashboardPanel paymentEntryPanel">
        <div className="panelHeaderRow">
          <div>
            <h2>Update Student Payment</h2>
            <p>
              Select a student, enter the total course fee and total amount paid.
              The balance will be calculated automatically.
            </p>
          </div>
        </div>

        <form className="paymentUpdateForm" onSubmit={handleSavePayment}>
          <label>
            Select Student
            <select
              value={selectedStudentId}
              onChange={(event) => handleSelectStudent(event.target.value)}
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
            Course Fee
            <input
              type="number"
              min="0"
              value={courseFee}
              placeholder="e.g. 120000"
              onChange={(event) => setCourseFee(event.target.value)}
            />
          </label>

          <label>
            Total Amount Paid
            <input
              type="number"
              min="0"
              value={amountPaid}
              placeholder="e.g. 45000"
              onChange={(event) => setAmountPaid(event.target.value)}
            />
          </label>

          <label>
            Balance Remaining
            <input type="text" value={formatMoney(calculatedBalance)} readOnly />
          </label>

          <label className="paymentNoteField">
            Payment Note
            <textarea
              rows="3"
              value={paymentNote}
              placeholder="Optional note about the payment..."
              onChange={(event) => setPaymentNote(event.target.value)}
            />
          </label>

          {selectedStudent && (
            <div className="selectedStudentPaymentPreview">
              <strong>{selectedStudent.profiles?.full_name}</strong>
              <span>{selectedStudent.profiles?.email}</span>
              <span>{selectedStudent.student_code}</span>
              <span>{selectedStudent.enrolled_course || "Data Analysis"}</span>
            </div>
          )}

          <button type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Payment Update"}
          </button>
        </form>
      </section>

      <section className="dashboardPanel adminPaymentsTablePanel">
        <h2>Student Balances</h2>

        {students.length === 0 ? (
          <p>No student balances found.</p>
        ) : (
          <div className="adminPaymentsTableWrap">
            <table className="adminPaymentsTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Student Code</th>
                  <th>Course</th>
                  <th>Course Fee</th>
                  <th>Amount Paid</th>
                  <th>Balance</th>
                  <th>Access</th>
                </tr>
              </thead>

              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td>{student.profiles?.full_name || "Unnamed Student"}</td>
                    <td>{student.profiles?.email || "-"}</td>
                    <td>{student.student_code || "-"}</td>
                    <td>{student.enrolled_course || "Data Analysis"}</td>
                    <td>{formatMoney(student.course_fee || 0)}</td>
                    <td>{formatMoney(student.amount_paid || 0)}</td>
                    <td>
                      <strong>{formatMoney(student.payment_balance || 0)}</strong>
                    </td>
                    <td>
                      <span
                        className={`statusPill ${
                          student.is_restricted ? "urgent" : "approved"
                        }`}
                      >
                        {student.is_restricted ? "Restricted" : "Active"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="dashboardPanel adminPaymentsTablePanel">
        <h2>Payment Records</h2>

        {payments.length === 0 ? (
          <p>
            No payment records have been added yet. Student balances are showing
            from the student records, but no actual payment rows exist yet.
          </p>
        ) : (
          <div className="adminPaymentsTableWrap">
            <table className="adminPaymentsTable">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Confirmed By</th>
                  <th>Confirmed At</th>
                  <th>Notes</th>
                </tr>
              </thead>

              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id}>
                    <td>
                      {payment.students?.profiles?.full_name || "Unknown Student"}
                      <br />
                      <small>{payment.students?.student_code || "-"}</small>
                    </td>
                    <td>{formatMoney(payment.amount || 0)}</td>
                    <td>
                      <span className={`statusPill ${payment.status}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td>{payment.profiles?.full_name || "-"}</td>
                    <td>{formatDateTime(payment.confirmed_at)}</td>
                    <td>{payment.notes || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}

export default AdminPayments;