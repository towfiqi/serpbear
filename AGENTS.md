# AGENTS.md

## Purpose
This document defines baseline expectations for all contributors to maintain code quality, test coverage, and project stability.

---

## Development Guidelines

### 1. Testing Requirements
- **Always update or create tests** for any feature, bug fix, or refactor.
- Place new tests in the project’s designated test directory or add them to the existing test suite.
- Tests should fully cover the changes made, including edge cases.

### 2. Local Verification
Before committing changes:
1. **Run all tests**  
   Ensure the full test suite passes locally without errors.
2. **Lint the code**  
   Run the project's configured linter(s) or formatting tools.
3. **Fix all linting or formatting issues**  
   Use auto-fix tools when available, and manually address any remaining issues.

### 3. Change Workflow
- Implement changes in small, reviewable commits.
- Write clear and descriptive commit messages.
- Avoid pushing untested or lint-failing code.

### 4. Pull Request Expectations
- PRs must pass all automated checks (tests, linting, builds) before requesting review.
- Include a brief summary of the changes and their purpose.
- Reference related issues or tickets when applicable.

---

## Checklist Before Submitting Code
- [ ] Updated or created tests.
- [ ] All tests pass locally.
- [ ] Linting run with no errors.
- [ ] Commit messages are clear.
- [ ] PR description explains the "why" and "what."

---

## Notes
These are baseline expectations—projects may have additional requirements documented elsewhere. Always follow the most restrictive applicable rules.
