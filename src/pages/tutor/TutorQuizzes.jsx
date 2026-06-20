import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createQuizQuestionForTutor,
  getTutorQuizzesForCurrentUser,
} from "../../services/tutorService";

function TutorQuizzes() {
  const { session, profile } = useAuth();

  const [quizData, setQuizData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [quizForm, setQuizForm] = useState({
    course: "Data Analysis",
    tool: "Excel",
    week_number: 1,
    question_text: "",
    difficulty: "beginner",
    points: 1,
    status: "published",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
  });

  async function loadQuizzes() {
    if (!session?.user?.id) {
      setNotice("No active tutor session found.");
      setIsLoading(false);
      return;
    }

    const { data, error } = await getTutorQuizzesForCurrentUser(
      session.user.id
    );

    if (error) {
      setNotice(error.message);
      setIsLoading(false);
      return;
    }

    setQuizData(data);
    setIsLoading(false);
  }

  useEffect(() => {
    loadQuizzes();
  }, [session]);

  function handleFormChange(event) {
    const { name, value } = event.target;

    setQuizForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleCreateQuestion(event) {
    event.preventDefault();

    setSuccessMessage("");
    setActionError("");

    if (!quizForm.question_text.trim()) {
      setActionError("Question text is required.");
      return;
    }

    if (
      !quizForm.option_a.trim() ||
      !quizForm.option_b.trim() ||
      !quizForm.option_c.trim() ||
      !quizForm.option_d.trim()
    ) {
      setActionError("All four answer options are required.");
      return;
    }

    const userId = session?.user?.id;

    if (!userId) {
      setActionError("Tutor session not found. Please log in again.");
      return;
    }

    setIsCreating(true);

    const { error } = await createQuizQuestionForTutor(userId, quizForm);

    if (error) {
      setActionError(error.message);
      setIsCreating(false);
      return;
    }

    setSuccessMessage("Quiz question created successfully.");

    setQuizForm({
      course: "Data Analysis",
      tool: "Excel",
      week_number: 1,
      question_text: "",
      difficulty: "beginner",
      points: 1,
      status: "published",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
    });

    await loadQuizzes();
    setIsCreating(false);
  }

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
        <h2>Quiz issue</h2>
        <p>{notice}</p>
      </section>
    );
  }

  const questions = quizData?.questions || [];
  const summary = quizData?.summary || {};

  return (
    <section>
      <div className="dashboardHeader">
        <div>
          <p className="eyebrow">Tutor Portal</p>
          <h1>Weekly Practice Quizzes</h1>
          <p>
            Welcome, {profile?.full_name || "Tutor"}. Create multiple-choice
            practice questions for your students.
          </p>
        </div>

        <button>Create Question</button>
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
          <p>Total Questions</p>
          <h2>{summary.totalQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Published</p>
          <h2>{summary.publishedQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Drafts</p>
          <h2>{summary.draftQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Excel</p>
          <h2>{summary.excelQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Power BI</p>
          <h2>{summary.powerBiQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>SQL</p>
          <h2>{summary.sqlQuestions || 0}</h2>
        </article>

        <article className="dashboardCard">
          <p>Python</p>
          <h2>{summary.pythonQuestions || 0}</h2>
        </article>
      </div>

      <div className="dashboardPanel">
        <h2>Create Quiz Question</h2>

        <form className="portalForm" onSubmit={handleCreateQuestion}>
          <div className="formGrid">
            <label>
              Course
              <input
                type="text"
                name="course"
                value={quizForm.course}
                onChange={handleFormChange}
              />
            </label>

            <label>
              Tool
              <select name="tool" value={quizForm.tool} onChange={handleFormChange}>
                <option value="Excel">Excel</option>
                <option value="Power BI">Power BI</option>
                <option value="SQL">SQL</option>
                <option value="Python">Python</option>
              </select>
            </label>

            <label>
              Week Number
              <input
                type="number"
                name="week_number"
                value={quizForm.week_number}
                onChange={handleFormChange}
                min="1"
              />
            </label>

            <label>
              Difficulty
              <select
                name="difficulty"
                value={quizForm.difficulty}
                onChange={handleFormChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>

            <label>
              Points
              <input
                type="number"
                name="points"
                value={quizForm.points}
                onChange={handleFormChange}
                min="1"
              />
            </label>

            <label>
              Status
              <select
                name="status"
                value={quizForm.status}
                onChange={handleFormChange}
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
              </select>
            </label>
          </div>

          <label>
            Question
            <textarea
              name="question_text"
              value={quizForm.question_text}
              onChange={handleFormChange}
              rows="4"
              placeholder="Example: Which Excel feature is best for summarising large datasets?"
            />
          </label>

          <div className="formGrid">
            <label>
              Option A
              <input
                type="text"
                name="option_a"
                value={quizForm.option_a}
                onChange={handleFormChange}
              />
            </label>

            <label>
              Option B
              <input
                type="text"
                name="option_b"
                value={quizForm.option_b}
                onChange={handleFormChange}
              />
            </label>

            <label>
              Option C
              <input
                type="text"
                name="option_c"
                value={quizForm.option_c}
                onChange={handleFormChange}
              />
            </label>

            <label>
              Option D
              <input
                type="text"
                name="option_d"
                value={quizForm.option_d}
                onChange={handleFormChange}
              />
            </label>

            <label>
              Correct Option
              <select
                name="correct_option"
                value={quizForm.correct_option}
                onChange={handleFormChange}
              >
                <option value="A">Option A</option>
                <option value="B">Option B</option>
                <option value="C">Option C</option>
                <option value="D">Option D</option>
              </select>
            </label>
          </div>

          <button className="tableActionBtn" type="submit" disabled={isCreating}>
            {isCreating ? "Creating..." : "Create Quiz Question"}
          </button>
        </form>
      </div>

      <div className="dashboardPanel">
        <h2>My Quiz Questions</h2>

        {questions.length === 0 ? (
          <p>No quiz question has been created yet.</p>
        ) : (
          <div className="quizQuestionStack">
            {questions.map((question) => (
              <article className="quizQuestionCard" key={question.id}>
                <div className="quizQuestionHeader">
                  <div>
                    <span className={`statusPill ${question.status}`}>
                      {question.status}
                    </span>
                    <h3>{question.question_text}</h3>
                  </div>

                  <strong>{question.points || 1} point(s)</strong>
                </div>

                <div className="assignmentMeta">
                  <span>Tool: {question.tool}</span>
                  <span>Week: {question.week_number}</span>
                  <span>Difficulty: {question.difficulty}</span>
                </div>

                <ol className="quizOptionList">
                  {(question.quiz_options || [])
                    .sort((a, b) => a.option_order - b.option_order)
                    .map((option) => (
                      <li
                        key={option.id}
                        className={option.is_correct ? "correctOption" : ""}
                      >
                        {option.option_text}
                        {option.is_correct ? " ✓" : ""}
                      </li>
                    ))}
                </ol>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default TutorQuizzes;