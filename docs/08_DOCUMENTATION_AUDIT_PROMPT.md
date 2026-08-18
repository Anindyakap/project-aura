# Documentation Audit Prompt

```text
Audit the entire Aura repository against the Markdown documentation.

Do not change application code during this audit.

Tasks:
1. Print the real repository tree, excluding generated and dependency folders.
2. Locate every package.json and list all scripts and dependencies.
3. Locate every TypeScript and TSX source file.
4. Locate database migrations, SQL files, test files, deployment files, and environment examples.
5. Compare the real code with 01_MASTER_CHECKLIST.md, 02_PROJECT_SUMMARY.md, and 03_CODEBASE_GUIDE.md.
6. Create a mismatch report with these categories:
   - documented and confirmed
   - documented but implemented differently
   - documented but not found
   - present in code but missing from documentation
   - uncertain and requiring manual verification
7. Identify security issues, especially committed secrets, tokens in URLs, unsafe localStorage usage, missing authorization checks, unparameterized SQL, and sensitive logs.
8. Identify outdated APIs, packages, or framework conventions using only official documentation.
9. Propose documentation corrections.
10. Wait for approval before changing any documentation or code.

For every claim, cite the exact repository file and line range.
```
