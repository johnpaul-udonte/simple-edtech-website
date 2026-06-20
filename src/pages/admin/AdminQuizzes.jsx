import { useEffect, useState } from "react";
import { getQuizzesForAdmin } from "../../services/adminService";

function AdminQuizzes() {
  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadQuizzes() {
      const { data, error } = await getQuizzesForAdmin();

      if (error) {
        setNotice(error.message);
        setIsLoading(false);
        return;
      }

      setQuizData(data);
      setIsLoading(false);
    }

    loadQuizzes();
  }, []);

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading quizzes...</h2>
        <p>Please wait while quiz records are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Admin quiz issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const questions = quizData?.questions || [];
  const attempts = quizData?.attempts || [];
  const summary = quizData?.summary || {};

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Admin Portal</p>
          <h1>Quiz Monitoring</h1>
          <p>
            Monitor tutor-created quiz questions, student weekly practice
            submissions, scores, and performance trends.
          </p>
        </div>

        <button>Export Quiz Report</button>
      </div>

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Total Questions</p>
          <h2>{summary.totalQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published Questions</p>
          <h2>{summary.publishedQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Draft Questions</p>
          <h2>{summary.draftQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Total Attempts</p>
          <h2>{summary.totalAttempts || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Average Score</p>
          <h2>{summary.averageScore || 0}%</h2>
        </article>

        <article className="dashboardCard">
          <p>Passed Attempts</p>
          <h2>{summary.passedAttempts || 0}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Student Quiz Attempts</h2>

        {attempts.length === 0 ? (
          <p>No student quiz attempt has been submitted yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Tutor</th>
                <th>Week</th>
                <th>Tool</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Submitted</th>
              </tr>
            </thead>

            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
                  <td>
                    {attempt.students?.profiles?.full_name || "Unknown Student"}
                    <br />
                    <small>{attempt.students?.student_code || "-"}</small>
                  </td>

                  <td>
                    {attempt.tutors?.profiles?.full_name || "Tutor not assigned"}
                  </td>

                  <td>Week {attempt.week_number}</td>

                  <td>{attempt.tool}</td>

                  <td>
                    {attempt.score} / {attempt.total_points}
                  </td>

                  <td>
                    <span
                      className={`statusPill ${
                        Number(attempt.percentage || 0) >= 70
                          ? "approved"
                          : "pending"
                      }`}
                    >
                      {attempt.percentage}%
                    </span>
                  </td>

                  <td>
                    {attempt.submitted_at
                      ? new Date(attempt.submitted_at).toLocaleString()
                      : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>Quiz Question Bank</h2>

        {questions.length === 0 ? (
          <p>No quiz question has been created yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Question</th>
                <th>Tutor</th>
                <th>Tool</th>
                <th>Week</th>
                <th>Difficulty</th>
                <th>Status</th>
                <th>Points</th>
              </tr>
            </thead>

            <tbody>
              {questions.map((question) => (
                <tr key={question.id}>
                  <td>{question.question_text}</td>
                  <td>
                    {question.tutors?.profiles?.full_name || "Tutor not assigned"}
                  </td>
                  <td>{question.tool}</td>
                  <td>Week {question.week_number}</td>
                  <td>{question.difficulty}</td>
                  <td>
                    <span className={`statusPill ${question.status}`}>
                      {question.status}
                    </span>
                  </td>
                  <td>{question.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </section>
  );
}

export default AdminQuizzes;