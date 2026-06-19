import { useEffect, useState } from "react";
import { getPaymentsForAdmin } from "../../services/adminService";

function AdminPayments() {
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadPayments() {
      const { data, error } = await getPaymentsForAdmin();

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setPaymentData(data);
      setIsLoading(false);
    }

    loadPayments();
  }, []);

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
      </section>
    );
  }

  const payments = paymentData?.payments || [];
  const students = paymentData?.students || [];

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Payment Management</h1>
          <p>
            View real payment records, outstanding balances, confirmation status,
            and restricted student access from Supabase.
          </p>
        </div>

        <button>Add Payment Record</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Confirmed</p>
          <h2>
            ₦{Number(paymentData?.totalConfirmedAmount || 0).toLocaleString()}
          </h2>
        </article>

        <article className="dashboardCard">
          <p>Outstanding Balance</p>
          <h2>
            ₦{Number(paymentData?.totalOutstandingBalance || 0).toLocaleString()}
          </h2>
        </article>

        <article className="dashboardCard">
          <p>Confirmed Payments</p>
          <h2>{paymentData?.confirmedPaymentsCount || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Pending Payments</p>
          <h2>{paymentData?.pendingPaymentsCount || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Rejected Payments</p>
          <h2>{paymentData?.rejectedPaymentsCount || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Restricted Students</p>
          <h2>{paymentData?.restrictedStudents || 0}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Student Balances</h2>

        {students.length === 0 ? (
          <p>No student balances found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th>Student Code</th>
                <th>Course</th>
                <th>Balance</th>
                <th>Access Status</th>
              </tr>
            </thead>

            <tbody>
              {students.map((student) => (
                <tr key={student.id}>
                  <td>{student.profiles?.full_name || "Unnamed Student"}</td>
                  <td>{student.profiles?.email || "-"}</td>
                  <td>{student.student_code || "-"}</td>
                  <td>{student.enrolled_course || "Data Analysis"}</td>
                  <td>
                    ₦{Number(student.payment_balance || 0).toLocaleString()}
                  </td>
                  <td>{student.is_restricted ? "Restricted" : "Active"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Payment Records</h2>

        {payments.length === 0 ? (
          <p>
            No payment records have been added yet. Student balances are showing
            from the student records, but no actual payment rows exist yet.
          </p>
        ) : (
          <table>
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
                  <td>₦{Number(payment.amount || 0).toLocaleString()}</td>
                  <td>{payment.status}</td>
                  <td>{payment.profiles?.full_name || "-"}</td>
                  <td>
                    {payment.confirmed_at
                      ? new Date(payment.confirmed_at).toLocaleString()
                      : "-"}
                  </td>
                  <td>{payment.notes || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminPayments;