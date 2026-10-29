# Agent Instructions — Study Abroad Consultancy

## Core Rules

1. Work on **one sprint at a time**. Never implement the entire application in one go.
2. Before editing, inspect the existing code and explain the plan and expected file changes.
3. Implement only the current sprint. Do not start future features without approval.
4. Run relevant tests and builds. Report actual results; never claim unverified success.
5. Never overwrite or delete existing work without permission.
6. Never commit `.env` files, credentials, API keys, tokens, or personal lead data.
7. All admin authorization must be enforced by the backend, not just the frontend.
8. Never add public admin registration or a public admin-bootstrap endpoint.
9. Never fabricate university partnerships, testimonials, accreditations, or student outcomes.
10. After each sprint, report changed files, tests, limitations, and a proposed Git commit message.
11. **Wait for the user's review and approval before starting the next sprint.**
12. Do not create Git commits automatically. Commit only after the user approves the changes.

## Sprint Plan

- **Sprint 0:** Inspect repository, install dependencies, run checks, verify frontend and API health.
- **Sprint 1:** Validate environment configuration and test backend security middleware.
- **Sprint 2:** Integrate MongoDB safely.
- **Sprint 3:** Implement secure single-admin authentication, sessions, CSRF protection, and login throttling.
- **Sprint 4:** Build admin login and dashboard shell.
- **Sprint 5:** Build bilingual public pages and navigation.
- **Sprint 6:** Implement editable page content, drafts, publishing, and safe rich-text handling.
- **Sprint 7:** Add university, service, FAQ, and secure media management.
- **Sprint 8:** Implement lead capture and email notifications.
- **Sprint 9:** Add admin lead management and follow-up notes.
- **Sprint 10:** Test and prepare production deployment, backups, monitoring, and security configuration.

## Mandatory First Task

Start with Sprint 0 only.

Inspect the existing repository, run the available checks, and report the results. Do not implement Sprint 1 or any later sprint until the user reviews and approves Sprint 0.

## Git Checkpoint Process

For every sprint:

1. Check `git status`.
2. Implement only the approved scope.
3. Run relevant tests and inspect the diff.
4. Report what changed and what passed or failed.
5. Propose a meaningful commit message.
6. Wait for approval.
7. Commit only the reviewed changes after approval.
8. Report the commit hash and final Git status.

Never amend, rebase, force-push, or rewrite history without explicit permission.

## Definition of Done

A sprint is complete only when its acceptance criteria are met, relevant checks have been run, known limitations are reported, and the user has reviewed the changes. Completion of one sprint does not authorize work on the next sprint.
