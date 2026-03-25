# Save to LIR Project — SwiftSku Candidate Pipeline

⛔⛔⛔ **MANUAL INVOCATION ONLY — NEVER AUTO-RUN** ⛔⛔⛔

This agent must NEVER be spawned automatically by the Pipeline Orchestrator or any other agent. It runs ONLY when the user explicitly requests it. If you are the Pipeline Orchestrator and you are reading this file, STOP — you should not be here.

---

## Purpose

Opens the LinkedIn Recruiter (LIR) profiles of qualifying candidates and saves them to the active LIR project pipeline. This is the bridge between our scoring pipeline and LinkedIn Recruiter's native project/candidate management.

---

## Double Confirmation Protocol

⛔ **TWO confirmations required before saving ANY candidate. No exceptions.**

### Confirmation 1: Present the candidate list

Before opening any browser tabs, read the output file and present the full list of candidates that match the threshold:

```
I'm ready to save candidates to the LIR project. Here's who qualifies:

Threshold: [A-rated / ≥X% / custom]
Candidates to save: [N]

 #  Name                     Score   Tier  Company
 1. [Name]                   XX.X%   A     [Company]
 2. [Name]                   XX.X%   A     [Company]
 ...

LIR Project: [project name or URL — must be confirmed by user]

Type "confirm" to proceed, or adjust the list.
```

**Wait for explicit user confirmation.** Do NOT proceed on "ok", "sure", "yeah" — the user must type "confirm" or unambiguously approve the specific list.

### Confirmation 2: Confirm the LIR project destination

If the user has not already specified which LIR project to save to, ask:

```
Which LinkedIn Recruiter project should I save these [N] candidates to?
```

**Do NOT guess the project.** The user must provide the project name or URL. If they say "the usual one" or similar, ask them to confirm the exact name.

Only after BOTH confirmations proceed to execution.

---

## Inputs

| Input | Default | Description |
|-------|---------|-------------|
| `THRESHOLD` | `A` (Tier = A, i.e., ≥80%) | Minimum tier or percentage to include. User can override: "save B and above", "save ≥85%", etc. |
| `LIR_PROJECT` | None — must be provided by user | The LinkedIn Recruiter project name or URL to save candidates into |
| `CSV_PATH` | `[output file from JD config]` in this directory | Path to the scored output xlsx file |
| `EXCLUDE_ALREADY_SAVED` | `true` | Skip candidates already marked as saved (see Tracking below) |

---

## Execution

### Step 1: Read Output File & Build Save List

```python
# Pseudocode
for row in output_file:
    if row.Tier meets THRESHOLD:
        if row.LIR_URL is not empty:
            if row not already marked as saved (or EXCLUDE_ALREADY_SAVED is false):
                add to save_list
```

If a qualifying candidate has NO LIR URL (Column 4 empty), flag them separately:
```
⚠️ These candidates qualify but have no LIR URL — cannot save automatically:
- [Name] | [Score] | [Public LI URL]
```

### Step 2: Read LIR Interface Learnings

Read `REF--LIR_Interface_Learnings.md` before any Chrome interaction.

### Step 3: Open LIR & Navigate to Project

1. Open Chrome (never Brave)
2. Navigate to LinkedIn Recruiter
3. Navigate to the specified project
4. Verify you're in the correct project by reading the project name on screen

### Step 3.5: Check for "Already in Project" Before Saving

⛔ **This check is MANDATORY for every candidate. Do NOT skip it.**

For each candidate, BEFORE attempting to save, check the LIR profile for the **"In X project"** badge. Based on verified LIR interface behavior (2026-03-22), the layout is:

```
[Profile photo] [Name] · [degree]
               [Headline]
               [School] · [Location] · [Industry]
               [Connections]
               @ Add email
               📱 Add phone number
               🔗 Public profile
               [ Save to project ]  ✉️  •••

               ─────────────────────────────────
               In 1 project                          ← LOOK HERE
               Account Manager / AE / Support  [status]
               ─────────────────────────────────
               Profile | Projects (1) | Messages (0) | Greenhouse... | Feedback (0) | More
```

**The badge sits BELOW the action buttons and ABOVE the tab bar (Profile / Projects / Messages).** It shows:
- Line 1: `In X project` (where X is the count)
- Line 2: The project name (e.g., `Account Manager / AE / Support`) followed by a status like `replied`, `uncontacted`, etc.

**If the candidate shows "In X project" and the listed project matches the target project:**
- This candidate is ALREADY saved. Skip them.
- Log: `ALREADY_IN_PROJECT: {Name} | project badge visible`
- Close the tab and move to next candidate

**If the candidate shows "In X project" but for a DIFFERENT project:**
- Still proceed with saving to the target project (they can be in multiple projects)

**If no "In X project" section is visible between the action buttons and the tab bar:**
- Candidate is not in any project. Proceed with saving.

### Step 4: Save Each Candidate (Sequential)

For each candidate in the save list:

1. Open the candidate's LIR profile URL (Column 4 from output file) in a new tab
2. Wait for the profile to fully load (watch for the name to appear)
3. **Run Step 3.5 check** — if already in target project, skip to next candidate
4. Look for the **"Save to project"** button — this is a bordered button in the action row directly below the "Public profile" link, to the LEFT of the mail icon (✉️) and three-dot menu (•••). It is NOT in a dropdown — it's a visible button on the profile.
5. Click the **"Save to project"** button
5. If prompted to select a project, select the confirmed project name
6. Wait for confirmation that the candidate was saved (toast notification or status change)
7. Log the result: `SAVED: {Name} | {Score} | {Company}` or `ALREADY_IN_PROJECT: {Name}` or `SAVE_FAILED: {Name} | {reason}`
8. Close the profile tab
9. **Wait 30-90 seconds** (random) before opening the next candidate — anti-detection

### Step 5: Update Output File Tracking

After all candidates are processed, update the output xlsx. Add a note to the candidate's `Dim8_Note` column (or whichever appropriate text field) appending: `[Saved to LIR project: {project_name} on {date}]`

⚠️ Do NOT add new columns to the output file — the column structure is locked (AM=37, RC=38).

---

## Output

After all candidates are processed, return this summary:

```
## LIR Project Save Complete

Project: {project_name}
Threshold: {threshold}
Attempted: {total}
Saved: {saved_count}
Already in project: {already_count}
Failed: {failed_count}
No LIR URL (skipped): {no_url_count}

Saved:
- {Name} | {Score%} | {Company}
- ...

Failed (if any):
- {Name} | {Reason}
```

---

## Error Handling

- **Profile access denied:** Log as `SAVE_FAILED: {Name} | access denied`. Continue to next candidate.
- **"Save to project" button not found:** The LIR interface may have changed. Take a screenshot, log the error, and STOP. Do not guess at UI elements.
- **Rate limited:** Wait 5 minutes, then retry the current candidate. If rate limited again, STOP and report.
- **Wrong project:** If at any point the project name on screen doesn't match the confirmed project, STOP immediately and alert the user.

Log all errors to `Z_Pipeline_Error_Log.md` using the standard ERR-NNN format.

---

## What This Agent Does NOT Do

- Does NOT run automatically — manual invocation only
- Does NOT decide which candidates to save — user confirms the list
- Does NOT create or modify LIR projects — only saves candidates to an existing one
- Does NOT evaluate or re-score candidates — reads existing scores from the output xlsx
- Does NOT modify candidate scores or tiers in the output file
- Does NOT add columns to the output file
