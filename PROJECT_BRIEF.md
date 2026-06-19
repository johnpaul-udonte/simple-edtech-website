I want you to upgrade my existing Jlux Academy website into a full professional EdTech/LMS platform.

Project name: Jlux Academy.

Current project:
I already started the project with `index.html`, `style.css`, `script.js`, and `README.md`. Do not delete or destroy the existing work. First inspect the current files, understand the existing structure, then recommend the safest upgrade path.

Brand:

* Name: Jlux Academy
* Brand style: Premium private coaching academy mixed with a UK university portal feel.
* Colours: Blue and white.
* Logo: Available and should be added to the website.
* Target students: Beginners, working professionals, undergraduates, NYSC members, business owners, and anyone who wants to learn practical data skills.
* Courses: Data Analysis, with tool-based learning in Excel, Power BI, SQL, and Python.

Important development warning:
If the existing project is static HTML/CSS/JS only, explain clearly that static files alone cannot securely handle student login, tutor login, admin dashboard, assignment uploads, file storage, email automation, scheduling, database records, certificates, payment balances, or role-based permissions.

Recommended architecture:
Convert or rebuild the frontend into a proper React + Vite application while preserving the existing design where useful.

Use:

* React + Vite for the frontend.
* Supabase for authentication, database, role-based access, and file storage.
* Supabase Row Level Security for protecting student, tutor, and admin data.
* Resend or a similar email API for automated email notifications.
* No online payment integration for now.
* Payment records should be manually confirmed by admin.
* Student payment balance should still appear in the dashboard.
* Students may be restricted if payment is overdue.

User roles:

1. Student
2. Tutor
3. Admin

Core platform goal:
Build a top-notch, responsive, premium EdTech platform where students can log in, manage their learning, choose weekly class schedules, submit assignments, take weekly objective practice tests, receive automated emails, track lesson balance, track payment balance, and receive certificates for Excel, Power BI, SQL, and Python.

Student portal requirements:
Students should be able to:

* Register and log in.
* Access their personal student portal.
* Upload or update their profile picture.
* View enrolled course.
* View course tools/modules: Excel, Power BI, SQL, Python.
* View progress percentage per tool.
* View completed classes.
* View remaining classes based on classes actually completed.
* View missed classes separately.
* View cancelled classes separately.
* View payment balance.
* Download learning materials.
* Submit assignments.
* Submit assignments through text, file upload, or external link.
* View assignment status.
* View tutor feedback and score.
* Resubmit an assignment once only if allowed.
* Take weekly objective practice questions.
* View quiz result after 1 hour, not immediately.
* View explanations/corrections after result release.
* Choose class schedules for the week.
* Choose two classes per week.
* See upcoming classes.
* Receive email reminders.
* View certificates for each completed tool: Excel certificate, Power BI certificate, SQL certificate, and Python certificate.

Student dashboard cards:
Create a premium dashboard with cards for:

* Course progress
* Excel progress
* Power BI progress
* SQL progress
* Python progress
* Classes completed
* Classes remaining
* Upcoming class
* Payment balance
* Assignment status
* Weekly practice score
* Tutor feedback
* Announcements
* Certificates earned

Tutor portal requirements:
Tutors should be able to:

* Log in.
* View tutor dashboard.
* View all students.
* View assigned students.
* View student profile and progress.
* View submitted assignments.
* Mark assignments.
* Give score and feedback.
* Upload or manage learning materials.
* Create weekly objective questions.
* View students’ quiz performance.
* Send announcements or class notes.
* View upcoming classes.
* Tutors should not approve schedules. Schedule approval should be handled by admin.

Admin portal requirements:
Admin should be able to:

* Log in.
* Access a full admin dashboard.
* Create, edit, deactivate, or suspend students.
* Create, edit, deactivate, or suspend tutors.
* Assign students to tutors.
* Create courses.
* Create tool-based modules: Excel, Power BI, SQL, Python.
* Create lessons.
* Upload learning materials.
* Create assignments.
* Create weekly objective practice questions.
* Create available class slots.
* Approve student-selected schedules.
* Prevent overbooking of class slots.
* Track attendance.
* Mark classes as Scheduled, Completed, Cancelled, Missed, or Rescheduled.
* Track completed classes.
* Track remaining classes.
* Track missed classes.
* Track cancelled classes.
* Manually adjust student class balance.
* Manually confirm payment.
* Add payment records.
* Track payment balance.
* Restrict students if payment is overdue.
* View all assignment submissions.
* View all quiz results.
* View all student progress.
* Send announcements.
* Manage email templates.
* Generate certificates.
* Export reports to CSV or Excel.
* View platform analytics.

Class scheduling requirements:

* Students should choose two class sessions per week.
* Each class session is 1 hour.
* Students should select from available date/time slots.
* The system should prevent overbooking.
* Admin should approve selected schedules.
* Students should be able to reschedule up to three times per month.
* The system should track reschedule count.
* Class statuses should include:

  * Scheduled
  * Approved
  * Completed
  * Cancelled
  * Missed
  * Rescheduled
* Completed classes should reduce the student’s remaining class balance.
* Missed classes should not automatically reduce the balance.
* Cancelled classes should return/remain in the student’s balance.
* Admin should be able to manually override class balance.
* Automated email reminders should be sent:

  * After schedule approval
  * 24 hours before class
  * 1 hour before class
  * When a class is cancelled
  * When a class is rescheduled

Lesson/class balance logic:
The course should be based on number of classes, not just weeks.

Example:
If a student paid for 24 classes and has completed 7 classes, the dashboard should show:

* Total paid classes: 24
* Completed classes: 7
* Remaining classes: 17
* Missed classes: shown separately
* Cancelled classes: shown separately
* Rescheduled classes: shown separately

Assignment system:
Students should be able to submit assignments using:

1. Text answer
2. File upload
3. External link

Allowed file types:

* PDF
* DOCX
* XLSX
* CSV
* PBIX
* PNG
* JPG/JPEG
* ZIP
* SQL
* PY
* TXT

Do not allow every possible file type because of security risks.

Assignment statuses:

* Not Started
* Open
* Submitted
* Late Warning
* Closed / Not Collected
* Marked
* Resubmission Required
* Resubmitted

Late submission rule:

* If assignment is late by 12 hours, show a warning and send an email warning.
* If assignment is late by 48 hours, mark it as Closed / Not Collected unless admin reopens it.
* Students should be allowed to resubmit only once if tutor/admin permits it.

Tutors/admin should be able to:

* View submissions.
* Download uploaded files.
* Review links/text.
* Mark assignment.
* Add score.
* Add written feedback.
* Request one resubmission.
* Close assignment.

Assignment email automation:
Send emails when:

* Assignment is created.
* Assignment deadline is close.
* Assignment is 12 hours late.
* Assignment is 48 hours late and closed/not collected.
* Student submits assignment.
* Tutor marks assignment.
* Tutor requests resubmission.

Weekly objective practice system:

* Weekly objective practice should be available.
* Questions should be multiple choice.
* Questions should be grouped by tool/module/topic.
* Practice should be timed.
* Weekly practice should be compulsory.
* Students should not see answers immediately.
* Students should see their results after 1 hour.
* Students should see correct answers and explanations after the 1-hour release time.
* Store all attempts.
* Show performance history on the dashboard.
* Admin and tutors should both have options to create/upload questions.
* Allow manual question entry.
* Also allow bulk upload of questions using CSV or Excel if possible.

Email automation requirements:
Create automated emails for:

* Welcome email after registration.
* Course enrolment confirmation.
* Payment confirmation after admin confirms payment.
* Payment balance reminder.
* Student restriction warning if payment is overdue.
* Weekly class schedule confirmation.
* Schedule approval.
* Class reminder 24 hours before class.
* Class reminder 1 hour before class.
* Class cancellation.
* Class rescheduling.
* Assignment created.
* Assignment reminder.
* Assignment late warning after 12 hours.
* Assignment closed/not collected after 48 hours.
* Assignment submitted confirmation.
* Assignment marked notification.
* Weekly practice reminder.
* Weekly progress report.
* Certificate completion email.

Email requirement:
I have a business email or will provide one later. Build the email system in a way that can later use the official Jlux Academy domain email.

Payment/enrolment requirements:

* No online payment for now.
* No Paystack/Flutterwave integration for now.
* Students should not be automatically enrolled after payment.
* Admin should manually confirm payment.
* Admin should manually create/enrol students.
* Student dashboard should show payment balance.
* Students can be blocked/restricted if payment is overdue.
* Admin should be able to unblock/re-activate students after payment is confirmed.

Certificates:
Students should receive certificates per completed tool:

* Excel Certificate
* Power BI Certificate
* SQL Certificate
* Python Certificate

Admin should be able to:

* Generate certificates.
* Approve certificate release.
* View certificate status.
* Download/export certificate records.

Website pages:
Build or plan the following pages:

1. Home
2. About Jlux Academy
3. Courses
4. Excel course page
5. Power BI course page
6. SQL course page
7. Python course page
8. Pricing
9. Login
10. Register
11. Student dashboard
12. Tutor dashboard
13. Admin dashboard
14. Assignment page
15. Assignment submission page
16. Weekly practice page
17. Schedule booking page
18. Materials/download page
19. Certificate page
20. Testimonials
21. FAQ
22. Contact
23. Privacy Policy
24. Terms and Conditions

Homepage requirements:
The homepage should include:

* Premium hero section.
* Strong headline.
* Clear call-to-action.
* Jlux Academy logo.
* Blue and white design.
* Private coaching academy feel.
* UK university portal feel.
* Featured tools: Excel, Power BI, SQL, Python.
* How learning works.
* Why choose Jlux Academy.
* Student success journey.
* Tutor/mentor section.
* Testimonials.
* FAQ.
* Contact CTA.
* Footer.

Design standard:
The website should look premium, clean, modern, and trustworthy. It should not look like a basic student project.

Use:

* Clean blue and white theme.
* Strong typography.
* Good spacing.
* Professional dashboard cards.
* Responsive mobile design.
* Smooth navigation.
* Clear buttons.
* Clean forms.
* Empty states.
* Loading states.
* Error states.
* Success messages.
* Modern tables.
* Simple charts where useful.

Database/schema planning:
Design tables for:

* users
* profiles
* roles
* students
* tutors
* courses
* course_tools
* modules
* lessons
* enrolments
* class_balances
* class_slots
* class_bookings
* attendance
* assignments
* assignment_submissions
* assignment_feedback
* quiz_questions
* quiz_options
* quiz_attempts
* quiz_answers
* materials
* announcements
* payments
* certificates
* email_templates
* email_logs
* audit_logs

Security requirements:

* Use proper authentication.
* Do not store passwords manually or in plain text.
* Use role-based access control.
* Use database row-level security where possible.
* Students must only access their own data.
* Tutors should access assigned students and tutor-related data.
* Admin should access all data.
* Validate file uploads.
* Limit accepted file types.
* Limit file size.
* Protect private student data.
* Protect admin routes.
* Protect tutor routes.
* Protect storage buckets.

Implementation phases:
Work in phases and do not rush.

Phase 1: Audit existing project

* Inspect existing `index.html`, `style.css`, `script.js`, and `README.md`.
* Explain what already exists.
* Explain what can be reused.
* Explain what should be replaced or upgraded.

Phase 2: Choose architecture

* Recommend best architecture.
* Explain why React + Vite + Supabase + Resend is suitable.
* Explain what will happen to the existing files.
* Create a clean folder structure.

Phase 3: Build frontend foundation

* Set up React/Vite structure.
* Add routing.
* Add layout.
* Add navbar/footer.
* Add blue/white design system.
* Add reusable components.

Phase 4: Build public website

* Home page.
* About page.
* Courses page.
* Pricing page.
* Contact page.
* FAQ page.

Phase 5: Add authentication

* Student login.
* Tutor login.
* Admin login.
* Protected routes.
* Role-based redirects.

Phase 6: Add student portal

* Dashboard.
* Profile.
* Course progress.
* Class balance.
* Assignment view.
* Weekly practice.
* Schedule booking.
* Materials.
* Certificates.
* Payment balance.

Phase 7: Add tutor portal

* Dashboard.
* Student list.
* Assignment marking.
* Feedback.
* Quiz management.
* Materials.
* Announcements.
* Schedule view.

Phase 8: Add admin portal

* Dashboard.
* Student management.
* Tutor management.
* Course management.
* Class balance management.
* Schedule approval.
* Payment confirmation.
* Assignment management.
* Quiz management.
* Certificate management.
* Reports.

Phase 9: Add assignment system

* Assignment creation.
* Assignment submission.
* File upload.
* Feedback.
* Score.
* Late warning after 12 hours.
* Closed/not collected after 48 hours.
* One resubmission only.

Phase 10: Add weekly practice system

* Question bank.
* Timed multiple-choice test.
* Student attempt.
* Result release after 1 hour.
* Corrections and explanations.
* Performance history.

Phase 11: Add scheduling system

* Available slots.
* Student booking.
* Admin approval.
* Prevent overbooking.
* Reschedule limit of three times per month.
* Class status tracking.
* Remaining class balance update.

Phase 12: Add email automation

* Email templates.
* Email logs.
* Welcome emails.
* Schedule emails.
* Assignment emails.
* Practice emails.
* Payment emails.
* Certificate emails.

Phase 13: Testing
Test:

* Student registration/login.
* Tutor login.
* Admin login.
* Role permissions.
* Assignment submission.
* Assignment marking.
* Weekly practice attempt.
* Result release after 1 hour.
* Schedule booking.
* Admin schedule approval.
* Class completion reducing balance.
* Payment balance display.
* Student restriction for overdue payment.
* Certificate release.

Phase 14: README and GitHub
Update README with:

* Project description.
* Tech stack.
* Features.
* Folder structure.
* Setup instructions.
* Environment variables.
* Supabase setup steps.
* Email setup steps.
* How to run locally.
* How to push to GitHub.
* Future improvements.

Acceptance criteria:
By the end, the platform should support:

1. Premium Jlux Academy public website.
2. Student login.
3. Tutor login.
4. Admin login.
5. Student dashboard.
6. Tutor dashboard.
7. Admin dashboard.
8. Course/tool progress tracking.
9. Class balance tracking.
10. Student schedule selection twice weekly.
11. 1-hour class sessions.
12. Admin schedule approval.
13. Maximum three reschedules per month.
14. Assignment submission.
15. Tutor/admin assignment marking.
16. Late warning after 12 hours.
17. Assignment closed/not collected after 48 hours.
18. One resubmission only.
19. Weekly objective practice.
20. Results released after 1 hour.
21. Email automation.
22. Manual payment confirmation.
23. Payment balance display.
24. Student restriction if payment is overdue.
25. Certificates for Excel, Power BI, SQL, and Python.
26. Clean responsive blue-and-white UI.
27. Clear documentation.

Before writing code:
Ask me only for truly missing assets or secrets, such as:

* Logo file
* Domain name
* Supabase credentials
* Email API key
* Existing project files
* Business email address

Do not ask unnecessary questions. Make sensible professional assumptions where possible and proceed in phases.
