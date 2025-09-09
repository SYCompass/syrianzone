# Compass Application Refactor

This document outlines the plan for refactoring the Political Compass application.

## Completed Tasks


## In Progress Tasks

- [ ] Create `TASKS.md` for planning.
- [ ] Remove `create.html` and related files (`create.js`, `create-style.css`).
- [ ] Refactor data loading to use a CSV file from Google Sheets.
- [ ] Implement question randomization.
- [ ] Implement keyboard navigation for answers (1-5 keys).
- [ ] Increase image download resolution.
- [ ] Hide question category from the UI.
- [ ] Update `index.html` to remove links to `create.html`.

## Future Tasks


## Implementation Plan

The application will be refactored to improve data management, user experience, and code maintainability.

### Data Loading
- The questions will be loaded from a Google Sheets CSV file, similar to the implementation in `party/script.js`.
- The `questions.js` file will be deprecated and removed.

### User Interface
- The question category will be hidden from the user during the quiz.
- The "Create your own compass" feature will be removed.

### User Experience
- Users will be able to answer questions using number keys (1-5).
- The order of questions will be randomized for each new test.

### Image Export
- The resolution of the exported compass image will be increased for better quality.

### Relevant Files

- `compass/app.js`: Main application logic. Will be heavily modified.
- `compass/index.html`: Main HTML file. Will be modified to remove links to the creation page and to support new features.
- `compass/questions.js`: Will be removed.
- `compass/create.html`: To be removed.
- `compass/create.js`: To be removed.
- `compass/create-style.css`: To be removed.
- `compass/TASKS.md`: This file.
