# Cursor Project Rules

## 1. Logging and Documentation
- **Every code edit, task, feature, or bugfix must be logged** in the appropriate markdown file in `docs/`.
  - Use `CODE_CHANGE_LOG.md` for code changes.
  - Use `TASK_COMPLETION_LOG.md` for task/feature status.
  - Use `ERRORS_AND_FIXES_LOG.md` for bugs and solutions.
  - Use `PROJECT_OVERVIEW.md` for high-level context.
- **If a log file does not exist, create it before proceeding.**
- **Every log entry must include a timestamp.**
- **Database changes must be logged in a dedicated database log file.**

## 2. Unique Naming Policy
- **All IDs, variable names, and instance names must be unique and descriptive.**
- **Maintain a log of all unique IDs and instances in a dedicated file if needed.**
- **Avoid duplicate IDs in HTML/JSX and database schemas.**

## 3. Task, Code, and Feature Updates
- **All task changes, code updates, and feature additions must be described in detail in the relevant log file.**
- **Logs should include context, reasoning, and impact.**
- **Every bug occurrence and solution must be logged with a timestamp and detailed explanation.**

## 4. Security Policy
- **All code changes must be made with security and clarity in mind.**
- **Do not leak sensitive information in code or logs.**
- **Review code for security vulnerabilities before committing.**

## 5. Use of Context7 MCP and Supabase MCP
- **Before creating or editing features, use Context7 MCP to get context on libraries, patterns, or best practices if needed.**
- **Supabase MCP is connected: always get the current context of the Supabase database before making schema or data changes.**
- **Maintain a detailed log of all database edits.**

## 6. GitHub and Backup Policy
- **Commit all changes (including logs) to GitHub regularly.**
- **Use clear, descriptive commit messages referencing the relevant log files.**
- **If issues arise, restore the project from the latest working commit.**

## 7. UI Library Policy
- **Use shadcn/ui for all frontend components unless a strong reason exists to use another library.**
- **Document any exceptions in the code change log.**

## 8. Command and Application Policy
- **Apply changes directly when possible.**
- **If a change cannot be applied automatically, provide the command or instructions to the user.**

## [2024-06-08] New Rule: Analyze Before Editing

- **Always analyze the codebase for related logic, components, and dependencies before making any code changes.**
- **Do not make changes on a whim; ensure all edits are informed by a thorough understanding of the current implementation.**
- **This is a required best practice for all contributors and AI agents.**
- **Document your analysis and reasoning in logs when making significant changes.**

---

_These rules ensure project clarity, maintainability, and security. All contributors and AI agents must follow them strictly._ 