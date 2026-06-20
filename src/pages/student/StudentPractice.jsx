import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getStudentPracticeForCurrentUser,
  submitStudentPracticeAttempt,
} from "../../services/studentService";

function StudentPractice() {
  const { session, profile } = useAuth();

  const [practiceData, setPracticeData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState("all");
  const [selectedTool, setSelectedTool] = useState("all");
  const [answers, setAnswers] = useState({});
  const [latestResult, setLatestResult] = useState(null);

  async function loadPractice() {
    if (!session?.user?.id) {
      setNotice("No active student session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getStudentPracticeForCurrentUser(session.user.id);

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setPracticeData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadPractice();
  }, [session]);

  const questions = practiceData?.questions || [];
  const attempts = practiceData?.attempts || [];
  const summary = practiceData?.summary || {};

  const weekOptions = useMemo(() => {
    const weeks = [...new Set(questions.map((question) => question.week_number))];
    return weeks.sort((a, b) => Number(a) - Number(b));
  }, [questions]);

  const toolOptions = useMemo(() => {
    return [...new Set(questions.map((question) => question.tool || "General"))];
  }, [questions]);

  const filteredQuestions = questions.filter((question) => {
    const weekMatches =
      selectedWeek === "all" || Number(question.week_number) === Number(selectedWeek);

    const toolMatches = selectedTool === "all" || question.tool === selectedTool;

    return weekMatches && toolMatches;
  });

  function handleAnswerChange(questionId, optionId) {
    setAnswers((current) => ({
      ...current,
      [questionId]: optionId,
    }));
  }

  async function handleSubmitPractice(event) {
    event.preventDefault();

    setSuccessMessage("");
    setActionError("");
    setLatestResult(null);

    if (filteredQuestions.length === 0) {
      setActionError("No question is available for this selected filter.");
      return;
    }

    const unansweredQuestion = filteredQuestions.find(
      (question) => !answers[question.id]
    );

    if (unansweredQuestion) {
      setActionError("Please answer all questions before submitting.");
      return;
    }

    const userId = session?.user?.id;

    if (!userId) {
      setActionError("Student session not found. Please log in again.");
      return;
    }

    setIsSubmitting(true);

    const { data, error } = await submitStudentPracticeAttempt(userId, {
      question_ids: filteredQuestions.map((question) => question.id),
      answers,
      week_number:
        selectedWeek === "all" ? filteredQuestions[0]?.week_number : selectedWeek,
      tool: selectedTool === "all" ? filteredQuestions[0]?.tool : selectedTool,
    });

    if (error) {
      setActionError(error.message);
      setIsSubmitting(false);
      return;
    }

    setLatestResult(data);
    setSuccessMessage(`Practice submitted. Your score is ${data.percentage}%.`);
    setAnswers({});
    await loadPractice();
    setIsSubmitting(false);
  }

  if (isLoading) {
    return (
      <section className="dashboardPanel">
        <h2>Loading weekly practice...</h2>
        <p>Please wait while your practice questions are loaded.</p>
      </section>
    );
  }

  if (notice) {
    return (
      <section className="dashboardPanel">
        <h2>Practice issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Weekly Practice</h1>
          <p>
            Welcome, {profile?.full_name || "Student"}. Answer published practice
            questions from your assigned tutor and track your quiz performance.
          </p>
        </div>

        <button>Start Practice</button>
      </div>

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

      <div className="dashboardGrid">
        <article className="dashboardCard">
          <p>Available Questions</p>
          <h2>{summary.totalQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Total Attempts</p>
          <h2>{summary.totalAttempts || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Best Score</p>
          <h2>{summary.bestScore || 0}%</h2>
        </article>

        <article className="dashboardCard">
          <p>Latest Score</p>
          <h2>{summary.latestScore || 0}%</h2>
        </article>
      </div>

      {latestResult && (
        <div className="dashboardPanel resultPanel">
          <h2>Latest Result</h2>
          <p>
            You scored <strong>{latestResult.score}</strong> out of{" "}
            <strong>{latestResult.totalPoints}</strong> points.
          </p>
          <h3>{latestResult.percentage}%</h3>
        </div>
      )}

      <div className="dashboardPanel">
        <h2>Practice Filters</h2>

        <div className="formGrid">
          <label>
            Week
            <select
              value={selectedWeek}
              onChange={(event) => {
                setSelectedWeek(event.target.value);
                setAnswers({});
              }}
            >
              <option value="all">All Weeks</option>
              {weekOptions.map((week) => (
                <option value={week} key={week}>
                  Week {week}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tool
            <select
              value={selectedTool}
              onChange={(event) => {
                setSelectedTool(event.target.value);
                setAnswers({});
              }}
            >
              <option value="all">All Tools</option>
              {toolOptions.map((tool) => (
                <option value={tool} key={tool}>
                  {tool}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="dashboardPanel">
        <h2>Answer Practice Questions</h2>

        {filteredQuestions.length === 0 ? (
          <p>No practice question is available for this filter yet.</p>
        ) : (
          <form onSubmit={handleSubmitPractice} className="quizForm">
            <div className="quizQuestionStack">
              {filteredQuestions.map((question, index) => (
                <article className="quizQuestionCard" key={question.id}>
                  <div className="quizQuestionHeader">
                    <div>
                      <span className={`statusPill ${question.difficulty}`}>
                        {question.difficulty}
                      </span>

                      <h3>
                        {index + 1}. {question.question_text}
                      </h3>
                    </div>

                    <strong>{question.points || 1} point(s)</strong>
                  </div>

                  <div className="assignmentMeta">
                    <span>Tool: {question.tool}</span>
                    <span>Week: {question.week_number}</span>
                  </div>

                  <div className="studentOptionList">
                    {(question.quiz_options || [])
                      .sort((a, b) => a.option_order - b.option_order)
                      .map((option) => (
                        <label key={option.id} className="studentOptionItem">
                          <input
                            type="radio"
                            name={`question-${question.id}`}
                            checked={answers[question.id] === option.id}
                            onChange={() =>
                              handleAnswerChange(question.id, option.id)
                            }
                          />
                          <span>{option.option_text}</span>
                        </label>
                      ))}
                  </div>
                </article>
              ))}
            </div>

            <button
              className="tableActionBtn quizSubmitBtn"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Practice"}
            </button>
          </form>
        )}
      </div>

      <div className="dashboardPanel">
        <h2>My Practice History</h2>

        {attempts.length === 0 ? (
          <p>You have not submitted any practice attempt yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Week</th>
                <th>Tool</th>
                <th>Score</th>
                <th>Percentage</th>
                <th>Questions</th>
                <th>Submitted</th>
              </tr>
            </thead>

            <tbody>
              {attempts.map((attempt) => (
                <tr key={attempt.id}>
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
                  <td>{attempt.total_questions}</td>
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
    </section>
  );
}

export default StudentPractice;