# Learning Deep Dive

The Learning module manages the course catalog, progress snapshots, and enroll flow.

Key files:
- [apps/web/src/components/learning/learning-screen.tsx](../../../apps/web/src/components/learning/learning-screen.tsx)
- [apps/web/src/components/learning/learning-enroll-dialog.tsx](../../../apps/web/src/components/learning/learning-enroll-dialog.tsx)
- [apps/web/src/components/learning/learning-data.ts](../../../apps/web/src/components/learning/learning-data.ts)
- [apps/web/src/i18n/learning-copy.ts](../../../apps/web/src/i18n/learning-copy.ts)
- [apps/web/tests/learning-data.test.ts](../../../apps/web/tests/learning-data.test.ts)

## What the code is doing

- shows the course catalog
- shows learning progress cards
- shows assignment rows
- filters and searches courses
- opens a modal for enroll

## How the flow works

1. `LearningScreen` loads the learning overview.
2. It filters the course list locally.
3. The enroll modal collects course details.
4. `addLearningCourse()` prepends the new course.

## Important functions

### `filterLearningCourses()`

Matches course status and search query across title, owner, and due date.

### `addLearningCourse()`

Returns a new list with the new course at the top.

Java equivalent:

- a training service method that adds a course assignment record and returns a refreshed list

## SOLID in this module

- SRP: screen, modal, data, and copy are separate
- DIP: the screen consumes a helper instead of embedding enrollment logic directly

## Debugging checklist

- modal not opening: inspect `isEnrollOpen`
- course not added: inspect `addLearningCourse()`
- filters wrong: inspect `filterLearningCourses()`

