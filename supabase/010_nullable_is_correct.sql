-- 010_nullable_is_correct.sql
-- Allow NULL in is_correct for unscored questions (Short Answer practice / solutions review mode).
-- In scored tests (MCQ, Numerical), is_correct is true or false.
-- In unscored practice tests, students review model answers without submitting, so is_correct is NULL.

ALTER TABLE public.test_attempt_questions ALTER COLUMN is_correct DROP NOT NULL;
