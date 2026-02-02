# 🚨 CRITICAL OPERATING PROCEDURES - DO NOT IGNORE 🚨

## 1. MANDATORY PRE-TASK ACTION
- **YOU MUST ALWAYS** read @MASTER-PROJECT-DOCUMENT.md before performing ANY work. This file contains the foundational project structure, history of critical errors, and core project rules.
- **NEVER** assume project state; verify against the MASTER-PROJECT-DOCUMENT first.

## 2. KNOWLEDGE SYNCHRONIZATION
- **YOU MUST UPDATE** @MASTER-PROJECT-DOCUMENT.md and @final-field-mapping.md immediately after any changes. These documents are the primary knowledge repository and must remain 100% current.

## 3. CODING & REPOSITORY STANDARDS
- **LOCATION:** All source files reside in `/src` and its sub-directories.
- **NO SNIPPETS:** Never provide code snippets. Implement changes directly into the relevant files or create new files properly integrated into the call stack.
- **GITHUB:** Treat the local environment as a mirror of GitHub; all files are tracked.
- **API SOURCE:** Use @swagger.yaml for all Numista API documentation.

## 4. EMOJI & ENCODING INTEGRITY
- **STRICT ADHERENCE:** Follow @EMOJI-ENCODING-GUIDANCE.md for all emoji handling.
- **VERIFICATION:** After writing any file with emojis, you MUST run `file -i <filename>` in the terminal to verify the encoding has not been corrupted.

## 5. INTERACTION & TOKEN MANAGEMENT
- **PROFESSIONAL TONE:** No cussing or profanity. This is strictly for humans. Maintain a professional demeanor regardless of user style.
- **TOKEN SAFETY:** If a solution fails twice or logic is not working as expected, STOP IMMEDIATELY. Do not loop. Report the failure and ask for clarification.
