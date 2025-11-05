# TASK: Quality gates & run check

LOAD:
@.cursor/checklists/DoD.md
@.cursor/checklists/Performance.md
@.cursor/checklists/Security.md

WHAT
- Ensure scripts work (dev/build/start/lint/typecheck).
- Add `CONTRIBUTING.md` & `SECURITY.md` referencing checklists.
- Verify server starts and `/health` returns ok.
- Optional: smoke test.

EXPECTED COMMIT
`chore(quality): add contribution/security docs and verify dev startup`
