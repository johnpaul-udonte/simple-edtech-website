import { useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const courseOptions = [
  "Data Analysis",
  "Excel",
  "Power BI",
  "SQL",
  "Python",
  "Full Data Analysis Package",
];

const classDayOptions = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const initialForm = {
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

function Register() {
  const [form, setForm] = useState(initialForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState("");

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleClassDayChange(day) {
    setForm((current) => {
      const alreadySelected = current.preferred_class_days.includes(day);

      return {
        ...current,
        preferred_class_days: alreadySelected
          ? current.preferred_class_days.filter((item) => item !== day)
          : [...current.preferred_class_days, day],
      };
    });
  }

  function handlePortraitChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      updateField("portrait", null);
      setPreviewUrl("");
      return;
    }

    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    const maxSize = 5 * 1024 * 1024;

    if (!allowedTypes.includes(file.type)) {
      setErrorMessage("Please upload a JPG, PNG, or WEBP portrait picture.");
      event.target.value = "";
      return;
    }

    if (file.size > maxSize) {
      setErrorMessage("Portrait picture must not be more than 5MB.");
      event.target.value = "";
      return;
    }

    setErrorMessage("");
    updateField("portrait", file);
    setPreviewUrl(URL.createObjectURL(file));
  }

  function validateForm() {
    if (!form.full_name.trim()) {
      return "Full name is required.";
    }

    if (!form.email.trim()) {
      return "Email address is required.";
    }

    if (!form.phone.trim()) {
      return "Phone number is required.";
    }

    if (!form.date_of_birth) {
      return "Date of birth is required.";
    }

    if (!form.gender) {
      return "Please select gender.";
    }

    if (!form.portrait) {
      return "Please upload a portrait picture.";
    }

    if (!form.preferred_course) {
      return "Please select a preferred course.";
    }

    if (!form.learning_mode) {
      return "Please select a learning mode.";
    }

    if (form.preferred_class_days.length === 0) {
      return "Please select at least one preferred class day.";
    }

    if (!form.preferred_class_time) {
      return "Please select a preferred class time.";
    }

    if (!form.current_skill_level) {
      return "Please select your current skill level.";
    }

    if (!form.has_laptop) {
      return "Please tell us if you have a laptop.";
    }

    if (!form.learning_goal.trim()) {
      return "Please write your learning goal.";
    }

    if (!form.residential_address.trim()) {
      return "Residential address is required.";
    }

    if (!form.emergency_contact_name.trim()) {
      return "Emergency contact name is required.";
    }

    if (!form.emergency_contact_phone.trim()) {
      return "Emergency contact phone number is required.";
    }

    return "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setNotice("");
    setErrorMessage("");

    const validationError = validateForm();

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
      let portraitPath = null;

      if (form.portrait) {
        const fileExtension = form.portrait.name.split(".").pop();
        const safeEmail = form.email
          .trim()
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "-");

        portraitPath = `applications/${safeEmail}-${Date.now()}.${fileExtension}`;

        const { error: uploadError } = await supabase.storage
          .from("student-portraits")
          .upload(portraitPath, form.portrait, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          setErrorMessage(uploadError.message);
          setIsSubmitting(false);
          return;
        }
      }

      const { error: insertError } = await supabase
        .from("student_applications")
        .insert({
          full_name: form.full_name.trim(),
          email: form.email.trim().toLowerCase(),
          phone: form.phone.trim(),
          date_of_birth: form.date_of_birth,
          gender: form.gender,
          portrait_path: portraitPath,
          preferred_course: form.preferred_course,
          learning_mode: form.learning_mode,
          preferred_class_days: form.preferred_class_days,
          preferred_class_time: form.preferred_class_time,
          current_skill_level: form.current_skill_level,
          education_level: form.education_level,
          occupation: form.occupation,
          has_laptop: form.has_laptop === "yes",
          learning_goal: form.learning_goal,
          residential_address: form.residential_address,
          emergency_contact_name: form.emergency_contact_name,
          emergency_contact_phone: form.emergency_contact_phone,
          hear_about_us: form.hear_about_us,
          application_status: "new",
          updated_at: new Date().toISOString(),
        });

      if (insertError) {
        setErrorMessage(insertError.message);
        setIsSubmitting(false);
        return;
      }

      setNotice(
        "Your student interest profile has been submitted successfully. Jlux Academy admin will review your details and contact you for confirmation."
      );

      setForm(initialForm);
      setPreviewUrl("");
    } catch (error) {
      setErrorMessage(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="authPage">
      <section className="authCard studentApplicationCard">
        <p className="eyebrow">Student Registration</p>

        <h2>Create your student interest profile</h2>

        <p>
          Full student enrolment will still require admin confirmation before
          portal access.
        </p>

        {notice && <div className="successNotice">{notice}</div>}
        {errorMessage && <div className="errorNotice">{errorMessage}</div>}

        <form className="studentApplicationForm" onSubmit={handleSubmit}>
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
                value={form.full_name}
                onChange={(event) =>
                  updateField("full_name", event.target.value)
                }
              />
            </label>

            <label>
              Email Address
              <input
                type="email"
                placeholder="Enter email address"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
              />
            </label>

            <label>
              Phone Number
              <input
                type="tel"
                placeholder="Enter phone number"
                value={form.phone}
                onChange={(event) => updateField("phone", event.target.value)}
              />
            </label>

            <label>
              Date of Birth
              <input
                type="date"
                value={form.date_of_birth}
                onChange={(event) =>
                  updateField("date_of_birth", event.target.value)
                }
              />
            </label>

            <label>
              Gender
              <select
                value={form.gender}
                onChange={(event) => updateField("gender", event.target.value)}
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
                onChange={handlePortraitChange}
              />
            </label>
          </div>

          {previewUrl && (
            <div className="portraitPreviewBox">
              <img src={previewUrl} alt="Student portrait preview" />
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
                value={form.preferred_course}
                onChange={(event) =>
                  updateField("preferred_course", event.target.value)
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
                value={form.learning_mode}
                onChange={(event) =>
                  updateField("learning_mode", event.target.value)
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
                value={form.preferred_class_time}
                onChange={(event) =>
                  updateField("preferred_class_time", event.target.value)
                }
              >
                <option value="">Select preferred time</option>
                <option value="Morning">Morning</option>
                <option value="Afternoon">Afternoon</option>
                <option value="Evening">Evening</option>
                <option value="Weekend Only">Weekend Only</option>
              </select>
            </label>

            <label>
              Current Skill Level
              <select
                value={form.current_skill_level}
                onChange={(event) =>
                  updateField("current_skill_level", event.target.value)
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
                value={form.education_level}
                onChange={(event) =>
                  updateField("education_level", event.target.value)
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
                value={form.occupation}
                onChange={(event) =>
                  updateField("occupation", event.target.value)
                }
              />
            </label>

            <label>
              Do you have a laptop?
              <select
                value={form.has_laptop}
                onChange={(event) =>
                  updateField("has_laptop", event.target.value)
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
                value={form.hear_about_us}
                onChange={(event) =>
                  updateField("hear_about_us", event.target.value)
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
                    checked={form.preferred_class_days.includes(day)}
                    onChange={() => handleClassDayChange(day)}
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
              value={form.learning_goal}
              onChange={(event) =>
                updateField("learning_goal", event.target.value)
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
              value={form.residential_address}
              onChange={(event) =>
                updateField("residential_address", event.target.value)
              }
            />
          </label>

          <div className="formGrid">
            <label>
              Emergency Contact Name
              <input
                type="text"
                placeholder="Enter emergency contact name"
                value={form.emergency_contact_name}
                onChange={(event) =>
                  updateField("emergency_contact_name", event.target.value)
                }
              />
            </label>

            <label>
              Emergency Contact Phone
              <input
                type="tel"
                placeholder="Enter emergency contact phone"
                value={form.emergency_contact_phone}
                onChange={(event) =>
                  updateField("emergency_contact_phone", event.target.value)
                }
              />
            </label>
          </div>

          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit Student Interest"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default Register;