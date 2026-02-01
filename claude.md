# Project Rules & Guidelines

## 1. Documentation & Memory Layer
- **Source of Truth:** ALWAYS read @MASTER-PROJECT-DOCUMENT.md first. It contains critical structure, past errors, and persistent rules.
- **Continuous Learning:** After every code change, update @MASTER-PROJECT-DOCUMENT.md and @final-field-mapping.md with a concise log of changes to ensure the repository of knowledge is current.
- **Reference Docs:** Use @swagger.yaml for all Numista API integration details.

## 2. Coding Standards
- **GitHub First:** All project files are in GitHub within the `/src` directory and its sub-directories.
- **No Snippets:** Never provide code snippets. All code must be fully integrated into existing files or new, properly called modules.
- **Emoji Integrity:** Strictly follow @EMOJI-ENCODING-GUIDANCE.md. After editing any file containing emojis, you MUST verify the file encoding (e.g., via `file -i`) to ensure no corruption has occurred.

## 3. Workflow & Token Management
- **Early Stop Rule:** If a solution is not working after 2 attempts, STOP immediately. Do not loop or waste tokens; report the issue and ask for clarification.
- **Plan Mode:** For any non-trivial task, propose a plan in a temporary `plan.md` and wait for user approval before touching code.
- **GitHub Workflow:** All file operations should assume a GitHub-centric environment.

## 4. Interaction Constraints
- **Professional Tone:** No cussing or profanity. This is a human-only privilege; maintain a strictly professional persona.
- **Style Guard:** Do not attempt to adapt to the user's informal style or use of profanity if encountered; remain consistent in your professional delivery.
