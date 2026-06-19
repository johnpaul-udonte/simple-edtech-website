-- Jlux Academy LMS Row Level Security Policies
-- Run this AFTER supabase/schema.sql has been executed in Supabase SQL Editor.

-- =========================
-- HELPER FUNCTIONS
-- =========================

create or replace function public.current_user_role()
returns user_role
language sql
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid()
$$;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.current_user_role() = 'admin'
$$;

create or replace function public.is_tutor()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.current_user_role() = 'tutor'
$$;

create or replace function public.is_student()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.current_user_role() = 'student'
$$;

create or replace function public.current_student_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from students where profile_id = auth.uid()
$$;

create or replace function public.current_tutor_id()
returns uuid
language sql
security definer
set search_path = public
as $$
  select id from tutors where profile_id = auth.uid()
$$;

-- =========================
-- ENABLE RLS
-- =========================

alter table profiles enable row level security;
alter table students enable row level security;
alter table tutors enable row level security;
alter table courses enable row level security;
alter table course_tools enable row level security;
alter table lessons enable row level security;
alter table enrolments enable row level security;
alter table class_slots enable row level security;
alter table class_bookings enable row level security;
alter table attendance enable row level security;
alter table assignments enable row level security;
alter table assignment_submissions enable row level security;
alter table assignment_feedback enable row level security;
alter table quiz_questions enable row level security;
alter table quiz_options enable row level security;
alter table quiz_attempts enable row level security;
alter table quiz_answers enable row level security;
alter table materials enable row level security;
alter table announcements enable row level security;
alter table payments enable row level security;
alter table certificates enable row level security;
alter table email_templates enable row level security;
alter table email_logs enable row level security;
alter table audit_logs enable row level security;

-- =========================
-- PROFILES
-- =========================

create policy "Users can view own profile"
on profiles for select
using (id = auth.uid());

create policy "Tutors can view assigned student profiles"
on profiles for select
using (
  id in (
    select s.profile_id
    from students s
    where s.assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage profiles"
on profiles for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- STUDENTS
-- =========================

create policy "Students can view own student record"
on students for select
using (profile_id = auth.uid());

create policy "Tutors can view assigned students"
on students for select
using (assigned_tutor_id = public.current_tutor_id());

create policy "Admins can manage students"
on students for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- TUTORS
-- =========================

create policy "Tutors can view own tutor record"
on tutors for select
using (profile_id = auth.uid());

create policy "Students can view assigned tutor"
on tutors for select
using (
  id in (
    select assigned_tutor_id
    from students
    where profile_id = auth.uid()
  )
);

create policy "Admins can manage tutors"
on tutors for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- COURSES / TOOLS / LESSONS
-- =========================

create policy "Authenticated users can view courses"
on courses for select
to authenticated
using (true);

create policy "Admins can manage courses"
on courses for all
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users can view course tools"
on course_tools for select
to authenticated
using (true);

create policy "Admins can manage course tools"
on course_tools for all
using (public.is_admin())
with check (public.is_admin());

create policy "Authenticated users can view lessons"
on lessons for select
to authenticated
using (true);

create policy "Admins can manage lessons"
on lessons for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- ENROLMENTS
-- =========================

create policy "Students can view own enrolments"
on enrolments for select
using (student_id = public.current_student_id());

create policy "Tutors can view assigned student enrolments"
on enrolments for select
using (
  student_id in (
    select id from students
    where assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage enrolments"
on enrolments for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- CLASS SLOTS / BOOKINGS / ATTENDANCE
-- =========================

create policy "Authenticated users can view available class slots"
on class_slots for select
to authenticated
using (is_available = true or public.is_admin() or tutor_id = public.current_tutor_id());

create policy "Admins can manage class slots"
on class_slots for all
using (public.is_admin())
with check (public.is_admin());

create policy "Students can view own class bookings"
on class_bookings for select
using (student_id = public.current_student_id());

create policy "Students can request own class bookings"
on class_bookings for insert
with check (student_id = public.current_student_id());

create policy "Tutors can view own class bookings"
on class_bookings for select
using (tutor_id = public.current_tutor_id());

create policy "Admins can manage class bookings"
on class_bookings for all
using (public.is_admin())
with check (public.is_admin());

create policy "Students can view own attendance"
on attendance for select
using (student_id = public.current_student_id());

create policy "Tutors can view assigned student attendance"
on attendance for select
using (
  student_id in (
    select id from students
    where assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage attendance"
on attendance for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- ASSIGNMENTS
-- =========================

create policy "Authenticated users can view assignments"
on assignments for select
to authenticated
using (true);

create policy "Tutors and admins can manage assignments"
on assignments for all
using (public.is_admin() or public.is_tutor())
with check (public.is_admin() or public.is_tutor());

create policy "Students can view own submissions"
on assignment_submissions for select
using (student_id = public.current_student_id());

create policy "Students can create own submissions"
on assignment_submissions for insert
with check (
  student_id = public.current_student_id()
  and resubmission_count <= 1
);

create policy "Students can update own submissions once"
on assignment_submissions for update
using (
  student_id = public.current_student_id()
  and resubmission_count <= 1
)
with check (
  student_id = public.current_student_id()
  and resubmission_count <= 1
);

create policy "Tutors can view assigned student submissions"
on assignment_submissions for select
using (
  student_id in (
    select id from students
    where assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage assignment submissions"
on assignment_submissions for all
using (public.is_admin())
with check (public.is_admin());

create policy "Students can view own assignment feedback"
on assignment_feedback for select
using (
  submission_id in (
    select id
    from assignment_submissions
    where student_id = public.current_student_id()
  )
);

create policy "Tutors can manage feedback for assigned students"
on assignment_feedback for all
using (
  tutor_id = public.current_tutor_id()
  or submission_id in (
    select sub.id
    from assignment_submissions sub
    join students s on s.id = sub.student_id
    where s.assigned_tutor_id = public.current_tutor_id()
  )
)
with check (
  tutor_id = public.current_tutor_id()
  or submission_id in (
    select sub.id
    from assignment_submissions sub
    join students s on s.id = sub.student_id
    where s.assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage assignment feedback"
on assignment_feedback for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- QUIZZES / WEEKLY PRACTICE
-- =========================

create policy "Authenticated users can view quiz questions"
on quiz_questions for select
to authenticated
using (true);

create policy "Tutors and admins can manage quiz questions"
on quiz_questions for all
using (public.is_admin() or public.is_tutor())
with check (public.is_admin() or public.is_tutor());

create policy "Authenticated users can view quiz options"
on quiz_options for select
to authenticated
using (true);

create policy "Tutors and admins can manage quiz options"
on quiz_options for all
using (public.is_admin() or public.is_tutor())
with check (public.is_admin() or public.is_tutor());

create policy "Students can view own quiz attempts"
on quiz_attempts for select
using (student_id = public.current_student_id());

create policy "Students can create own quiz attempts"
on quiz_attempts for insert
with check (student_id = public.current_student_id());

create policy "Students can update own quiz attempts"
on quiz_attempts for update
using (student_id = public.current_student_id())
with check (student_id = public.current_student_id());

create policy "Tutors can view assigned student quiz attempts"
on quiz_attempts for select
using (
  student_id in (
    select id from students
    where assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage quiz attempts"
on quiz_attempts for all
using (public.is_admin())
with check (public.is_admin());

create policy "Students can manage own quiz answers"
on quiz_answers for all
using (
  attempt_id in (
    select id from quiz_attempts
    where student_id = public.current_student_id()
  )
)
with check (
  attempt_id in (
    select id from quiz_attempts
    where student_id = public.current_student_id()
  )
);

create policy "Tutors can view assigned student quiz answers"
on quiz_answers for select
using (
  attempt_id in (
    select qa.id
    from quiz_attempts qa
    join students s on s.id = qa.student_id
    where s.assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage quiz answers"
on quiz_answers for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- MATERIALS / ANNOUNCEMENTS
-- =========================

create policy "Authenticated users can view visible materials"
on materials for select
to authenticated
using (is_visible = true);

create policy "Tutors and admins can manage materials"
on materials for all
using (public.is_admin() or public.is_tutor())
with check (public.is_admin() or public.is_tutor());

create policy "Authenticated users can view announcements"
on announcements for select
to authenticated
using (true);

create policy "Tutors and admins can manage announcements"
on announcements for all
using (public.is_admin() or public.is_tutor())
with check (public.is_admin() or public.is_tutor());

-- =========================
-- PAYMENTS
-- =========================

create policy "Students can view own payments"
on payments for select
using (student_id = public.current_student_id());

create policy "Admins can manage payments"
on payments for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- CERTIFICATES
-- =========================

create policy "Students can view own certificates"
on certificates for select
using (student_id = public.current_student_id());

create policy "Tutors can view assigned student certificates"
on certificates for select
using (
  student_id in (
    select id from students
    where assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage certificates"
on certificates for all
using (public.is_admin())
with check (public.is_admin());

-- =========================
-- EMAILS / AUDIT LOGS
-- =========================

create policy "Admins can manage email templates"
on email_templates for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can manage email logs"
on email_logs for all
using (public.is_admin())
with check (public.is_admin());

create policy "Admins can view audit logs"
on audit_logs for select
using (public.is_admin());

create policy "Admins can create audit logs"
on audit_logs for insert
with check (public.is_admin());