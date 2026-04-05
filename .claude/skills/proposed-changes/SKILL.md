---
name: proposed-changes
description: Present all proposed file edits in a structured table before making them. Use this skill whenever Claude is about to make multiple edits to existing files — especially instruction files, config files, or any file where an incorrect edit could break downstream agents or workflows. Trigger on "show me what you'll change", "proposed changes", "what edits", "review before editing", "/ProposedChanges", or any time 3+ file edits are queued up. Also activate proactively when edits span multiple files or touch files consumed by automated agents — the cost of a bad edit is high enough that a review gate is worth the 30 seconds.
---

# Proposed Changes

## Purpose

Before making edits to existing files, present every proposed change in a single table so the user can approve, reject, or modify individual changes before anything is touched. This prevents wasted work, catches misunderstandings early, and gives the user a clear audit trail of what's about to happen and why.

## When to activate

- 3 or more edits are planned across one or more files
- Any edit to a file consumed by automated agents (instruction files, templates, config)
- User explicitly asks to review changes first
- High-consequence edits (schema changes, scoring logic, guard code)

## Format

Use a stacked card layout — one numbered block per change. This avoids horizontal scrolling and lets the user scan vertically. Each card has a header line with the key identifiers, then indented details:

```
**#1** · `filename.md` · Line ~73 · **95%**
Current: `{Name} | {Tier} | {Score%} | {Verdict} | {Company}`
Proposed: `{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company} | {DQ_Reason or ""}`
Why: CE_Spawn_Template returns 6 fields; this file says 5 — would drop DQ_Reason

**#2** · `other_file.md` · Section "Weights" · **85%**
Current: `max=52.8`
Proposed: `max=53.4`
Why: RC max updated to 53.4 after rubric change; old value could mislead Sonnet agents
```

The header line packs the essentials: change number (for "do 1-4, skip 5"), filename, location, and confidence. The body shows what changes and why. Keep "Why" to one sentence.

For very short changes, collapse to two lines:
```
**#4** · `Save_To_LIR.md` · Line 61 · **85%**
`CSV_PATH` → `OUTPUT_PATH` — renamed everywhere else already
```

## Confidence scoring

The confidence score reflects two things combined: (1) how certain you are the change is factually correct, and (2) how confident you are the user will want it made. Guide:

- **95-99%** — Objectively verifiable fix. You can point to a canonical source that proves the current text is wrong (e.g., a template file that defines the correct format, a config value that's been updated elsewhere).
- **85-94%** — Strong evidence but requires checking one more thing, or the fix is clear but the file is documentation-only so the urgency is debatable.
- **70-84%** — Reasonable inference. You believe this is right based on patterns in the codebase, but haven't verified the exact line or the change involves some subjective judgment.
- **Below 70%** — Flag explicitly. You think this might help but you're not sure — maybe the current text is intentional, or the fix could have side effects you haven't fully traced.

Be honest. Inflated confidence wastes the user's trust. If you'd want to `grep` or `read` a file before committing to the change, that uncertainty should show in the score.

## After presenting

Wait for the user's go/no-go. They might say:
- "Do all of them" → execute all edits
- "Do 1-4, skip 5" → execute selectively
- "Change #3 to X instead" → modify and execute
- "Hold off" → don't touch anything

After executing approved changes, present a brief confirmation — not a second table, just a line like "Done — applied #1-4, skipped #5."

## Example

User: "Fix the return format mismatches across the instruction files"

Response:

**#1** · `JD--Acct_Mgr.md` · Step 8 (~line 374) · **95%**
Current: `{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company}`
Proposed: `{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company} | {DQ_Reason or ""}`
Why: CE_Spawn_Template has 6 fields; AM JD is the only file missing DQ_Reason

**#2** · `1_Pipeline_Starter.md` · Line ~73 · **90%**
Current: `{Name} | {Tier} | {Score%} | {Verdict} | {Company}`
Proposed: `{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company} | {DQ_Reason or ""}`
Why: Docs say 5 fields, CE actually returns 6 — misleads anyone reading this file

Go ahead with all, or skip any?
