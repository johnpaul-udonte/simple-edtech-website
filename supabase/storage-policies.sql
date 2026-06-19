-- Jlux Academy LMS Storage Buckets and Policies
-- Run this AFTER schema.sql and rls-policies.sql.

-- =========================
-- STORAGE BUCKETS
-- =========================

insert into storage.buckets (id, name, public)
values
  ('profile-pictures', 'profile-pictures', true),
  ('assignment-submissions', 'assignment-submissions', false),
  ('learning-materials', 'learning-materials', false),
  ('certificates', 'certificates', false)
on conflict (id) do nothing;

-- =========================
-- PROFILE PICTURES
-- =========================
-- Folder structure:
-- profile-pictures/{user_id}/avatar.png

create policy "Users can upload own profile picture"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can update own profile picture"
on storage.objects for update
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Users can delete own profile picture"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'profile-pictures'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "Profile pictures are publicly readable"
on storage.objects for select
using (bucket_id = 'profile-pictures');

-- =========================
-- ASSIGNMENT SUBMISSIONS
-- =========================
-- Folder structure:
-- assignment-submissions/{student_id}/{assignment_id}/filename.ext

create policy "Students can upload assignment files into own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = public.current_student_id()::text
);

create policy "Students can read own assignment files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] = public.current_student_id()::text
);

create policy "Tutors can read assigned student assignment files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'assignment-submissions'
  and (storage.foldername(name))[1] in (
    select s.id::text
    from students s
    where s.assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage assignment files"
on storage.objects for all
to authenticated
using (
  bucket_id = 'assignment-submissions'
  and public.is_admin()
)
with check (
  bucket_id = 'assignment-submissions'
  and public.is_admin()
);

-- =========================
-- LEARNING MATERIALS
-- =========================
-- Folder structure:
-- learning-materials/{tool_name}/filename.ext

create policy "Students can read learning materials"
on storage.objects for select
to authenticated
using (bucket_id = 'learning-materials');

create policy "Tutors and admins can upload learning materials"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'learning-materials'
  and (public.is_tutor() or public.is_admin())
);

create policy "Tutors and admins can update learning materials"
on storage.objects for update
to authenticated
using (
  bucket_id = 'learning-materials'
  and (public.is_tutor() or public.is_admin())
)
with check (
  bucket_id = 'learning-materials'
  and (public.is_tutor() or public.is_admin())
);

create policy "Admins can delete learning materials"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'learning-materials'
  and public.is_admin()
);

-- =========================
-- CERTIFICATES
-- =========================
-- Folder structure:
-- certificates/{student_id}/{certificate_id}.pdf

create policy "Students can read own certificate files"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] = public.current_student_id()::text
);

create policy "Tutors can read assigned student certificates"
on storage.objects for select
to authenticated
using (
  bucket_id = 'certificates'
  and (storage.foldername(name))[1] in (
    select s.id::text
    from students s
    where s.assigned_tutor_id = public.current_tutor_id()
  )
);

create policy "Admins can manage certificate files"
on storage.objects for all
to authenticated
using (
  bucket_id = 'certificates'
  and public.is_admin()
)
with check (
  bucket_id = 'certificates'
  and public.is_admin()
);