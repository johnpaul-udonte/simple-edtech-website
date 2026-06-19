-- Jlux Academy LMS Seed Data
-- Run this AFTER schema.sql.

insert into courses (title, description, is_active)
values (
  'Data Analysis',
  'A practical data analysis programme covering Excel, Power BI, SQL, and Python.',
  true
)
on conflict do nothing;

insert into course_tools (course_id, title, description, sort_order)
select
  c.id,
  tool.title,
  tool.description,
  tool.sort_order
from courses c
cross join (
  values
    ('Excel', 'Spreadsheet analysis, formulas, pivot tables, charts, and dashboards.', 1),
    ('Power BI', 'Data modelling, DAX, dashboards, and business intelligence reporting.', 2),
    ('SQL', 'Database querying, joins, filtering, aggregation, and business data extraction.', 3),
    ('Python', 'Data cleaning, automation, analysis, and practical data projects.', 4)
) as tool(title, description, sort_order)
where c.title = 'Data Analysis';

insert into lessons (course_tool_id, title, description, class_count, sort_order)
select
  ct.id,
  lesson.title,
  lesson.description,
  lesson.class_count,
  lesson.sort_order
from course_tools ct
cross join (
  values
    ('Foundation', 'Introduction and setup for the tool.', 1, 1),
    ('Core Skills', 'Main practical skills and guided exercises.', 3, 2),
    ('Business Project', 'Real-world project and assignment.', 2, 3),
    ('Review and Assessment', 'Practice, correction, and completion review.', 1, 4)
) as lesson(title, description, class_count, sort_order);