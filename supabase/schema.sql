-- Jlux Academy LMS Database Schema
-- Phase 1: Core LMS tables

create extension if not exists "uuid-ossp";

-- =========================
-- ENUM TYPES
-- =========================

create type user_role as enum ('student', 'tutor', 'admin');

create type account_status as enum (
  'active',
  'inactive',
  'suspended',
  'restricted'
);

create type class_status as enum (
  'scheduled',
  'approved',
  'completed',
  'cancelled',
  'missed',
  'rescheduled'
);

create type assignment_status as enum (
  'not_started',
  'open',
  'submitted',
  'late_warning',
  'closed_not_collected',
  'marked',
  'resubmission_required',
  'resubmitted'
);

create type payment_status as enum (
  'pending',
  'confirmed',
  'rejected'
);

create type certificate_status as enum (
  'locked',
  'in_progress',
  'earned',
  'pending_approval',
  'released'
);

-- =========================
-- PROFILES / USERS
-- =========================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role user_role not null default 'student',
  phone text,
  profile_picture_url text,
  status account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table students (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  student_code text unique,
  enrolled_course text default 'Data Analysis',
  assigned_tutor_id uuid,
  total_paid_classes integer not null default 0,
  completed_classes integer not null default 0,
  missed_classes integer not null default 0,
  cancelled_classes integer not null default 0,
  rescheduled_classes integer not null default 0,
  payment_balance numeric(12,2) not null default 0,
  is_restricted boolean not null default false,
  created_at timestamptz not null default now()
);

create table tutors (
  id uuid primary key default uuid_generate_v4(),
  profile_id uuid not null references profiles(id) on delete cascade,
  specialisation text,
  bio text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table students
add constraint students_assigned_tutor_fk
foreign key (assigned_tutor_id) references tutors(id);

-- =========================
-- COURSES / TOOLS / LESSONS
-- =========================

create table courses (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table course_tools (
  id uuid primary key default uuid_generate_v4(),
  course_id uuid not null references courses(id) on delete cascade,
  title text not null,
  description text,
  sort_order integer not null default 1
);

create table lessons (
  id uuid primary key default uuid_generate_v4(),
  course_tool_id uuid not null references course_tools(id) on delete cascade,
  title text not null,
  description text,
  class_count integer not null default 1,
  sort_order integer not null default 1,
  created_at timestamptz not null default now()
);

create table enrolments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  course_id uuid not null references courses(id) on delete cascade,
  progress_percentage integer not null default 0,
  enrolled_at timestamptz not null default now()
);

-- =========================
-- CLASS SCHEDULING
-- =========================

create table class_slots (
  id uuid primary key default uuid_generate_v4(),
  tutor_id uuid references tutors(id),
  slot_date date not null,
  start_time time not null,
  end_time time not null,
  capacity integer not null default 1,
  booked_count integer not null default 0,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

create table class_bookings (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  tutor_id uuid references tutors(id),
  class_slot_id uuid references class_slots(id),
  status class_status not null default 'scheduled',
  reschedule_count integer not null default 0,
  admin_approved_by uuid references profiles(id),
  approved_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table attendance (
  id uuid primary key default uuid_generate_v4(),
  class_booking_id uuid not null references class_bookings(id) on delete cascade,
  student_id uuid not null references students(id),
  status class_status not null,
  marked_by uuid references profiles(id),
  marked_at timestamptz not null default now()
);

-- =========================
-- ASSIGNMENTS
-- =========================

create table assignments (
  id uuid primary key default uuid_generate_v4(),
  course_tool_id uuid references course_tools(id),
  title text not null,
  description text,
  deadline timestamptz,
  created_by uuid references profiles(id),
  is_open boolean not null default true,
  created_at timestamptz not null default now()
);

create table assignment_submissions (
  id uuid primary key default uuid_generate_v4(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  text_answer text,
  file_url text,
  external_link text,
  status assignment_status not null default 'submitted',
  submitted_at timestamptz not null default now(),
  resubmission_count integer not null default 0
);

create table assignment_feedback (
  id uuid primary key default uuid_generate_v4(),
  submission_id uuid not null references assignment_submissions(id) on delete cascade,
  tutor_id uuid references tutors(id),
  score numeric(5,2),
  feedback text,
  resubmission_allowed boolean not null default false,
  marked_at timestamptz not null default now()
);

-- =========================
-- WEEKLY PRACTICE / QUIZZES
-- =========================

create table quiz_questions (
  id uuid primary key default uuid_generate_v4(),
  course_tool_id uuid references course_tools(id),
  question_text text not null,
  explanation text,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table quiz_options (
  id uuid primary key default uuid_generate_v4(),
  question_id uuid not null references quiz_questions(id) on delete cascade,
  option_text text not null,
  is_correct boolean not null default false
);

create table quiz_attempts (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  course_tool_id uuid references course_tools(id),
  score numeric(5,2),
  started_at timestamptz not null default now(),
  submitted_at timestamptz,
  result_release_at timestamptz,
  is_released boolean not null default false
);

create table quiz_answers (
  id uuid primary key default uuid_generate_v4(),
  attempt_id uuid not null references quiz_attempts(id) on delete cascade,
  question_id uuid not null references quiz_questions(id),
  selected_option_id uuid references quiz_options(id),
  is_correct boolean
);

-- =========================
-- MATERIALS / ANNOUNCEMENTS
-- =========================

create table materials (
  id uuid primary key default uuid_generate_v4(),
  course_tool_id uuid references course_tools(id),
  title text not null,
  file_url text,
  file_type text,
  uploaded_by uuid references profiles(id),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table announcements (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  body text not null,
  audience text not null default 'all_students',
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

-- =========================
-- PAYMENTS / CERTIFICATES
-- =========================

create table payments (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  amount numeric(12,2) not null,
  status payment_status not null default 'pending',
  confirmed_by uuid references profiles(id),
  confirmed_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table certificates (
  id uuid primary key default uuid_generate_v4(),
  student_id uuid not null references students(id) on delete cascade,
  course_tool_id uuid references course_tools(id),
  certificate_title text not null,
  status certificate_status not null default 'locked',
  approved_by uuid references profiles(id),
  approved_at timestamptz,
  released_at timestamptz,
  certificate_url text,
  created_at timestamptz not null default now()
);

-- =========================
-- EMAILS / AUDIT LOGS
-- =========================

create table email_templates (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  subject text not null,
  body text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table email_logs (
  id uuid primary key default uuid_generate_v4(),
  recipient_email text not null,
  subject text not null,
  status text not null default 'pending',
  related_table text,
  related_id uuid,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

create table audit_logs (
  id uuid primary key default uuid_generate_v4(),
  actor_id uuid references profiles(id),
  action text not null,
  table_name text,
  record_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);