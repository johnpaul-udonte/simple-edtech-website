import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const courseOptions = [
  "Data Analysis",
  "Excel",
  "Power BI",
  "SQL",
  "Python",
  "Full Data Analysis Training",
  "Excel + Power BI + SQL",
];

const classDayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const tutorToolOptions = ["Excel", "Power BI", "SQL", "Python"];

function formatHour(hour) {
  const period = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:00 ${period}`;
}

const oneHourTimeOptions = Array.from({ length: 24 }, (_, hour) => {
  const nextHour = (hour + 1) % 24;
  return `${formatHour(hour)} - ${formatHour(nextHour)}`;
});

const initialStudentForm = {
  full_name: "",
  email: "",
  phone: "",
  date_of_birth: "",
  gender: "",
  portrait: null,
  preferred_course: "Data Analysis",
  learning_mode: "Online",
  preferred_class_days: [],
  preferred_class_time: "",
  current_skill_level: "",
  education_level: "",
  occupation: "",
  has_laptop: "",
  learning_goal: "",
  residential_address: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  hear_about_us: "",
};

const initialTutorForm = {
  full_name: "",
  email: "",
  phone: "",
  portrait: null,
  area_of_expertise: "",
  tools: [],
  years_of_experience: "",
  teaching_mode: "Online",
  available_days: [],
  available_times: [],
  education_level: "",
  current_role: "",
  portfolio_url: "",
  short_bio: "",
  why_teach: "",
  residential_address: "",
};

function Register() {
  const [applicationType, setApplicationType] = useState("student");
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [tutorForm, setTutorForm] = useState(initialTutorForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [studentPreviewUrl, setStudentPreviewUrl] = useState("");
  const [tutorPreviewUrl, setTutorPreviewUrl] = useState("");

  function updateStudentField(field, value) {
    setStudentForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateTutorField(field, value) {
    setTutorForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleStudentClassDayChange(day) {
    setStudentForm((current) => {
      const alreadySelected = current.preferred_class_days.includes(day);

      return {
        ...current,
        preferred_class_days: alreadySelected
          ? current.preferred_class_days.filter((item) => item !== day)
          : [...current.preferred_class_days, day],
      };
    });
  }

  function handleTutorMultiSelect(field, value) {
    setTutorForm((current) => {
      const currentValues = current[field] || [];
      const alreadySelected = currentValues.includes(value);

      return {
        ...current,
        [field]: alreadySelected
          ? currentValues.filter((item) => item !== value)
          : [...currentValues, value],
      };
    });
  }

  function validateImage(file) {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      return "Please upload a JPG, PNG, or WEBP picture.";
    }

    if (file.size > maxSize) {
      return "Picture must not be more than 5MB.";
    }

    return "";
  }

  function handlePortraitChange(type, event) {
    const file = event.target.files?.[0];

    if (!file) {
      if (type === "student") {
        updateStudentField("portrait", null);
        setStudentPreviewUrl("");
      } else {
        updateTutorField("portrait", null);
        setTutorPreviewUrl("");
      }

      return;
    }

    const imageError = validateImage(file);

    if (imageError) {
      setErrorMessage(imageError);
      event.target.value = "";
      return;
    }

    setErrorMessage("");

    if (type === "student") {
      updateStudentField("portrait", file);
      setStudentPreviewUrl(URL.createObjectURL(file));
    } else {
      updateTutorField("portrait", file);
      setTutorPreviewUrl(URL.createObjectURL(file));
    }
  }

  function validateStudentForm() {
    if (!studentForm.full_name.trim()) return "Full name is required.";
    if (!studentForm.email.trim()) return "Email address is required.";
    if (!studentForm.phone.trim()) return "Phone number is required.";
    if (!studentForm.date_of_birth) return "Date of birth is required.";
    if (!studentForm.gender) return "Please select gender.";
    if (!studentForm.portrait) return "Please upload a portrait picture.";
    if (!studentForm.preferred_course) return "Please select a preferred course.";
    if (!studentForm.learning_mode) return "Please select a learning mode.";

    if (studentForm.preferred_class_days.length === 0) {
      return "Please select at least one preferred class day.";
    }

    if (!studentForm.preferred_class_time) {
      return "Please select a preferred class time.";
    }

    if (!studentForm.current_skill_level) {
      return "Please select your current skill level.";
    }

    if (!studentForm.has_laptop) {
      return "Please tell us if you have a laptop.";
    }

    if (!studentForm.learning_goal.trim()) {
      return "Please write your learning goal.";
    }

    if (!studentForm.residential_address.trim()) {
      return "Residential address is required.";
    }

    if (!studentForm.emergency_contact_name.trim()) {
      return "Emergency contact name is required.";
    }

    if (!studentForm.emergency_contact_phone.trim()) {
      return "Emergency contact phone number is required.";
    }

    return "";
  }

  function validateTutorForm() {
    if (!tutorForm.full_name.trim()) return "Tutor full name is required.";
    if (!tutorForm.email.trim()) return "Tutor email address is required.";
    if (!tutorForm.phone.trim()) return "Tutor phone number is required.";
    if (!tutorForm.portrait) return "Please upload tutor portrait picture.";

    if (!tutorForm.area_of_expertise.trim()) {
      return "Area of expertise is required.";
    }

    if (tutorForm.tools.length === 0) {
      return "Please select at least one tool you can teach.";
    }

    if (!tutorForm.years_of_experience) {
      return "Please enter years of teaching or professional experience.";
    }

    if (!tutorForm.teaching_mode) {
      return "Please select preferred teaching mode.";
    }

    if (tutorForm.available_days.length === 0) {
      return "Please select tutor available days.";
    }

    if (tutorForm.available_times.length === 0) {
      return "Please select tutor available times.";
    }

    if (!tutorForm.short_bio.trim()) {
      return "Please write a short tutor bio.";
    }

    if (!tutorForm.residential_address.trim()) {
      return "Tutor residential address is required.";
    }

    return "";
  }

  async function uploadPortrait({ file, email, bucketName, folderName }) {
    const fileExtension = file.name.split(".").pop();
    const safeEmail = email
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-");

    const portraitPath = `${folderName}/${safeEmail}-${Date.now()}.${fileExtension}`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(portraitPath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return portraitPath;
  }

  async function submitStudentApplication() {
    const portraitPath = await uploadPortrait({
      file: studentForm.portrait,
      email: studentForm.email,
      bucketName: "student-portraits",
      folderName: "applications",
    });

    const { error } = await supabase.from("student_applications").insert({
      full_name: studentForm.full_name.trim(),
      email: studentForm.email.trim().toLowerCase(),
      phone: studentForm.phone.trim(),
      date_of_birth: studentForm.date_of_birth,
      gender: studentForm.gender,
      portrait_path: portraitPath,
      preferred_course: studentForm.preferred_course,
      learning_mode: studentForm.learning_mode,
      preferred_class_days: studentForm.preferred_class_days,
      preferred_class_time: studentForm.preferred_class_time,
      current_skill_level: studentForm.current_skill_level,
      education_level: studentForm.education_level,
      occupation: studentForm.occupation,
      has_laptop: studentForm.has_laptop === "yes",
      learning_goal: studentForm.learning_goal,
      residential_address: studentForm.residential_address,
      emergency_contact_name: studentForm.emergency_contact_name,
      emergency_contact_phone: studentForm.emergency_contact_phone,
      hear_about_us: studentForm.hear_about_us,
      application_status: "new",
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    setNotice(
      "Your student interest profile has been submitted successfully. Jlux Academy admin will review your details and contact you for confirmation."
    );

    setStudentForm(initialStudentForm);
    setStudentPreviewUrl("");
  }

  async function submitTutorApplication() {
    const portraitPath = await uploadPortrait({
      file: tutorForm.portrait,
      email: tutorForm.email,
      bucketName: "tutor-portraits",
      folderName: "applications",
    });

    const { error } = await supabase.from("tutor_applications").insert({
      full_name: tutorForm.full_name.trim(),
      email: tutorForm.email.trim().toLowerCase(),
      phone: tutorForm.phone.trim(),
      portrait_path: portraitPath,
      area_of_expertise: tutorForm.area_of_expertise.trim(),
      tools: tutorForm.tools,
      years_of_experience: Number(tutorForm.years_of_experience || 0),
      teaching_mode: tutorForm.teaching_mode,
      available_days: tutorForm.available_days,
      available_times: tutorForm.available_times,
      education_level: tutorForm.education_level,
      current_job_role: tutorForm.current_role,
      portfolio_url: tutorForm.portfolio_url,
      short_bio: tutorForm.short_bio,
      why_teach: tutorForm.why_teach,
      residential_address: tutorForm.residential_address,
      application_status: "new",
      updated_at: new Date().toISOString(),
    });

    if (error) throw error;

    setNotice(
      "Your tutor application has been submitted successfully. Jlux Academy admin will review your profile before tutor portal access is created."
    );

    setTutorForm(initialTutorForm);
    setTutorPreviewUrl("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setNotice("");
    setErrorMessage("");

    const validationError =
      applicationType === "student" ? validateStudentForm() : validateTutorForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    if (!supabase) {
      setErrorMessage("Supabase is not configured yet.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (applicationType === "student") {
        await submitStudentApplication();
      } else {
        await submitTutorApplication();
      }
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isStudent = applicationType === "student";

  return (
    <main className="authPage">
      <section className="authCard studentApplicationCard">
        <p className="eyebrow">
          {isStudent ? "Student Registration" : "Tutor Registration"}
        </p>

        <h2>
          {isStudent
            ? "Create your student interest profile"
            : "Apply as a Jlux Academy tutor"}
        </h2>

        <p>
          {isStudent
            ? "Full student enrolment will still require admin confirmation before portal access."
            : "Tutor access will be created only after admin reviews and approves your tutor application."}
        </p>

        <div className="registrationTypeSwitch">
          <button
            type="button"
            className={isStudent ? "active" : ""}
            onClick={() => {
              setApplicationType("student");
              setNotice("");
              setErrorMessage("");
            }}
          >
            Register as Student
          </button>

          <button
            type="button"
            className={!isStudent ? "active" : ""}
            onClick={() => {
              setApplicationType("tutor");
              setNotice("");
              setErrorMessage("");
            }}
          >
            Register as Tutor
          </button>
        </div>

        {notice && <div className="successNotice">{notice}</div>}
        {errorMessage && <div className="errorNotice">{errorMessage}</div>}

        <form className="studentApplicationForm" onSubmit={handleSubmit}>
          {isStudent ? (
            <>
              <div className="formSectionTitle">
                <h3>Personal Information</h3>
                <p>Tell us who you are and how we can identify you.</p>
              </div>

              <div className="formGrid">
                <label>
                  Full Name
                  <input
                    type="text"
                    placeholder="Enter full name"
                    value={studentForm.full_name}
                    onChange={(event) =>
                      updateStudentField("full_name", event.target.value)
                    }
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    placeholder="Enter email address"
                    value={studentForm.email}
                    onChange={(event) =>
                      updateStudentField("email", event.target.value)
                    }
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    value={studentForm.phone}
                    onChange={(event) =>
                      updateStudentField("phone", event.target.value)
                    }
                  />
                </label>

                <label>
                  Date of Birth
                  <input
                    type="date"
                    value={studentForm.date_of_birth}
                    onChange={(event) =>
                      updateStudentField("date_of_birth", event.target.value)
                    }
                  />
                </label>

                <label>
                  Gender
                  <select
                    value={studentForm.gender}
                    onChange={(event) =>
                      updateStudentField("gender", event.target.value)
                    }
                  >
                    <option value="">Select gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </label>

                <label>
                  Portrait Picture
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => handlePortraitChange("student", event)}
                  />
                </label>
              </div>

              {studentPreviewUrl && (
                <div className="portraitPreviewBox">
                  <img src={studentPreviewUrl} alt="Student portrait preview" />
                  <div>
                    <strong>Portrait selected</strong>
                    <p>JPG, PNG, or WEBP. Maximum file size is 5MB.</p>
                  </div>
                </div>
              )}

              <div className="formSectionTitle">
                <h3>Learning Details</h3>
                <p>Help us understand the best learning plan for you.</p>
              </div>

              <div className="formGrid">
                <label>
                  Preferred Course
                  <select
                    value={studentForm.preferred_course}
                    onChange={(event) =>
                      updateStudentField("preferred_course", event.target.value)
                    }
                  >
                    {courseOptions.map((course) => (
                      <option key={course} value={course}>
                        {course}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Learning Mode
                  <select
                    value={studentForm.learning_mode}
                    onChange={(event) =>
                      updateStudentField("learning_mode", event.target.value)
                    }
                  >
                    <option value="Online">Online</option>
                    <option value="Physical">Physical</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Private Coaching">Private Coaching</option>
                  </select>
                </label>

                <label>
                  Preferred Class Time
                  <select
                    value={studentForm.preferred_class_time}
                    onChange={(event) =>
                      updateStudentField(
                        "preferred_class_time",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Select preferred time</option>
                    {oneHourTimeOptions.map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Current Skill Level
                  <select
                    value={studentForm.current_skill_level}
                    onChange={(event) =>
                      updateStudentField(
                        "current_skill_level",
                        event.target.value
                      )
                    }
                  >
                    <option value="">Select skill level</option>
                    <option value="Beginner">Beginner</option>
                    <option value="Basic Knowledge">Basic Knowledge</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </label>

                <label>
                  Education Level
                  <select
                    value={studentForm.education_level}
                    onChange={(event) =>
                      updateStudentField("education_level", event.target.value)
                    }
                  >
                    <option value="">Select education level</option>
                    <option value="Secondary School">Secondary School</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Professional">Professional</option>
                    <option value="Business Owner">Business Owner</option>
                  </select>
                </label>

                <label>
                  Occupation
                  <input
                    type="text"
                    placeholder="Student, NYSC, Analyst, Business Owner, etc."
                    value={studentForm.occupation}
                    onChange={(event) =>
                      updateStudentField("occupation", event.target.value)
                    }
                  />
                </label>

                <label>
                  Do you have a laptop?
                  <select
                    value={studentForm.has_laptop}
                    onChange={(event) =>
                      updateStudentField("has_laptop", event.target.value)
                    }
                  >
                    <option value="">Select answer</option>
                    <option value="yes">Yes, I have a laptop</option>
                    <option value="no">No, I do not have a laptop</option>
                  </select>
                </label>

                <label>
                  How did you hear about us?
                  <select
                    value={studentForm.hear_about_us}
                    onChange={(event) =>
                      updateStudentField("hear_about_us", event.target.value)
                    }
                  >
                    <option value="">Select option</option>
                    <option value="WhatsApp">WhatsApp</option>
                    <option value="Instagram">Instagram</option>
                    <option value="Facebook">Facebook</option>
                    <option value="Friend or Referral">Friend or Referral</option>
                    <option value="Church or Community">Church or Community</option>
                    <option value="Google Search">Google Search</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>

              <label>
                Preferred Class Days
                <div className="checkboxGrid">
                  {classDayOptions.map((day) => (
                    <span className="checkboxItem" key={day}>
                      <input
                        type="checkbox"
                        checked={studentForm.preferred_class_days.includes(day)}
                        onChange={() => handleStudentClassDayChange(day)}
                      />
                      {day}
                    </span>
                  ))}
                </div>
              </label>

              <label>
                Learning Goal
                <textarea
                  rows="4"
                  placeholder="Example: I want to become confident in Excel and Power BI for business reporting."
                  value={studentForm.learning_goal}
                  onChange={(event) =>
                    updateStudentField("learning_goal", event.target.value)
                  }
                />
              </label>

              <div className="formSectionTitle">
                <h3>Contact and Emergency Details</h3>
                <p>This helps admin reach you and keep accurate records.</p>
              </div>

              <label>
                Residential Address
                <textarea
                  rows="3"
                  placeholder="Enter your residential address"
                  value={studentForm.residential_address}
                  onChange={(event) =>
                    updateStudentField("residential_address", event.target.value)
                  }
                />
              </label>

              <div className="formGrid">
                <label>
                  Emergency Contact Name
                  <input
                    type="text"
                    placeholder="Enter emergency contact name"
                    value={studentForm.emergency_contact_name}
                    onChange={(event) =>
                      updateStudentField(
                        "emergency_contact_name",
                        event.target.value
                      )
                    }
                  />
                </label>

                <label>
                  Emergency Contact Phone
                  <input
                    type="tel"
                    placeholder="Enter emergency contact phone"
                    value={studentForm.emergency_contact_phone}
                    onChange={(event) =>
                      updateStudentField(
                        "emergency_contact_phone",
                        event.target.value
                      )
                    }
                  />
                </label>
              </div>
            </>
          ) : (
            <>
              <div className="formSectionTitle">
                <h3>Tutor Personal Information</h3>
                <p>Tell us who you are and how admin can review your profile.</p>
              </div>

              <div className="formGrid">
                <label>
                  Full Name
                  <input
                    type="text"
                    placeholder="Enter tutor full name"
                    value={tutorForm.full_name}
                    onChange={(event) =>
                      updateTutorField("full_name", event.target.value)
                    }
                  />
                </label>

                <label>
                  Email Address
                  <input
                    type="email"
                    placeholder="Enter tutor email"
                    value={tutorForm.email}
                    onChange={(event) =>
                      updateTutorField("email", event.target.value)
                    }
                  />
                </label>

                <label>
                  Phone Number
                  <input
                    type="tel"
                    placeholder="Enter tutor phone number"
                    value={tutorForm.phone}
                    onChange={(event) =>
                      updateTutorField("phone", event.target.value)
                    }
                  />
                </label>

                <label>
                  Portrait Picture
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={(event) => handlePortraitChange("tutor", event)}
                  />
                </label>
              </div>

              {tutorPreviewUrl && (
                <div className="portraitPreviewBox">
                  <img src={tutorPreviewUrl} alt="Tutor portrait preview" />
                  <div>
                    <strong>Portrait selected</strong>
                    <p>JPG, PNG, or WEBP. Maximum file size is 5MB.</p>
                  </div>
                </div>
              )}

              <div className="formSectionTitle">
                <h3>Teaching Profile</h3>
                <p>Help admin know what you can teach and when you are available.</p>
              </div>

              <div className="formGrid">
                <label>
                  Area of Expertise
                  <input
                    type="text"
                    placeholder="Example: Data Analysis, BI Reporting, Python Automation"
                    value={tutorForm.area_of_expertise}
                    onChange={(event) =>
                      updateTutorField("area_of_expertise", event.target.value)
                    }
                  />
                </label>

                <label>
                  Years of Experience
                  <input
                    type="number"
                    min="0"
                    placeholder="Example: 3"
                    value={tutorForm.years_of_experience}
                    onChange={(event) =>
                      updateTutorField("years_of_experience", event.target.value)
                    }
                  />
                </label>

                <label>
                  Teaching Mode
                  <select
                    value={tutorForm.teaching_mode}
                    onChange={(event) =>
                      updateTutorField("teaching_mode", event.target.value)
                    }
                  >
                    <option value="Online">Online</option>
                    <option value="Physical">Physical</option>
                    <option value="Hybrid">Hybrid</option>
                    <option value="Private Coaching">Private Coaching</option>
                  </select>
                </label>

                <label>
                  Education Level
                  <select
                    value={tutorForm.education_level}
                    onChange={(event) =>
                      updateTutorField("education_level", event.target.value)
                    }
                  >
                    <option value="">Select education level</option>
                    <option value="Undergraduate">Undergraduate</option>
                    <option value="Graduate">Graduate</option>
                    <option value="Postgraduate">Postgraduate</option>
                    <option value="Professional Certification">
                      Professional Certification
                    </option>
                    <option value="Industry Experience">Industry Experience</option>
                  </select>
                </label>

                <label>
                  Current Role
                  <input
                    type="text"
                    placeholder="Example: Data Analyst, BI Developer, Tutor"
                    value={tutorForm.current_role}
                    onChange={(event) =>
                      updateTutorField("current_role", event.target.value)
                    }
                  />
                </label>

                <label>
                  Portfolio / LinkedIn URL
                  <input
                    type="url"
                    placeholder="https://..."
                    value={tutorForm.portfolio_url}
                    onChange={(event) =>
                      updateTutorField("portfolio_url", event.target.value)
                    }
                  />
                </label>
              </div>

              <label>
                Tools You Can Teach
                <div className="checkboxGrid">
                  {tutorToolOptions.map((tool) => (
                    <span className="checkboxItem" key={tool}>
                      <input
                        type="checkbox"
                        checked={tutorForm.tools.includes(tool)}
                        onChange={() => handleTutorMultiSelect("tools", tool)}
                      />
                      {tool}
                    </span>
                  ))}
                </div>
              </label>

              <label>
                Available Days
                <div className="checkboxGrid">
                  {classDayOptions.map((day) => (
                    <span className="checkboxItem" key={day}>
                      <input
                        type="checkbox"
                        checked={tutorForm.available_days.includes(day)}
                        onChange={() =>
                          handleTutorMultiSelect("available_days", day)
                        }
                      />
                      {day}
                    </span>
                  ))}
                </div>
              </label>

              <label>
                Available Times
                <div className="checkboxGrid tutorTimeGrid">
                  {oneHourTimeOptions.map((time) => (
                    <span className="checkboxItem" key={time}>
                      <input
                        type="checkbox"
                        checked={tutorForm.available_times.includes(time)}
                        onChange={() =>
                          handleTutorMultiSelect("available_times", time)
                        }
                      />
                      {time}
                    </span>
                  ))}
                </div>
              </label>

              <label>
                Short Bio
                <textarea
                  rows="4"
                  placeholder="Briefly describe your teaching experience, data background, and strengths."
                  value={tutorForm.short_bio}
                  onChange={(event) =>
                    updateTutorField("short_bio", event.target.value)
                  }
                />
              </label>

              <label>
                Why do you want to teach with Jlux Academy?
                <textarea
                  rows="3"
                  placeholder="Tell us why you want to join as a tutor."
                  value={tutorForm.why_teach}
                  onChange={(event) =>
                    updateTutorField("why_teach", event.target.value)
                  }
                />
              </label>

              <label>
                Residential Address
                <textarea
                  rows="3"
                  placeholder="Enter tutor residential address"
                  value={tutorForm.residential_address}
                  onChange={(event) =>
                    updateTutorField("residential_address", event.target.value)
                  }
                />
              </label>
            </>
          )}

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Submitting..."
              : isStudent
              ? "Submit Student Interest"
              : "Submit Tutor Application"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Register;