# Learning Module

The Learning module manages course catalog entries, enrollments, and progress snapshots.
It supports a local enroll flow through a modal.

Key files:
- [apps/web/src/components/learning/learning-screen.tsx](../../apps/web/src/components/learning/learning-screen.tsx)
- [apps/web/src/components/learning/learning-enroll-dialog.tsx](../../apps/web/src/components/learning/learning-enroll-dialog.tsx)
- [apps/web/src/components/learning/learning-data.ts](../../apps/web/src/components/learning/learning-data.ts)
- [apps/web/src/i18n/learning-copy.ts](../../apps/web/src/i18n/learning-copy.ts)
- [apps/web/tests/learning-data.test.ts](../../apps/web/tests/learning-data.test.ts)

## What it does

- shows course catalog cards
- shows learning progress cards
- shows learning assignment rows
- filters by course status
- searches courses and owners
- opens a modal to add a new course assignment

## Flow

1. `LearningScreen` loads the course overview snapshot.
2. Search and filter state narrow the visible course list.
3. `LearningEnrollDialog` collects course details.
4. `addLearningCourse()` prepends the new course to the catalog.
5. The catalog and assignment tables rerender from local state.

## Java equivalent

- this is similar to a Spring LMS page with a service-backed catalog
- the dialog is like a course enrollment command form
- the helper functions are like a small domain service for learning assignments

## How to debug

- If the modal does not open, check `isEnrollOpen`.
- If the new course is not added, inspect `addLearningCourse()`.
- If filters look wrong, inspect `filterLearningCourses()`.

## Implementation notes

- The module is currently mock-driven.
- Later the same UI can render live LMS records from the backend.

