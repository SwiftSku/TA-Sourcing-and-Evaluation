# CE Spawn Template — Single Source of Truth

## What This File Is

The canonical spawn template for all Candidate Evaluator sub-agent invocations. Both the Pipeline Orchestrator (Phase 2) and the Cleanup Agent (Step 4, re-evaluating broken rows) use this exact template. No other file should contain a CE spawn template.

---

## Template Modes

There are two modes: **single-rubric** (legacy, used for non-recruiting roles like Account Manager) and **dual-rubric** (used when two recruiting roles share a candidate pool).

### Single-Rubric Template (default)

```
You are a single-candidate evaluator. Read the evaluation framework at:
{JD_FILE_PATH}

Also read LinkedIn interface learnings at:
{LIR_LEARNINGS_PATH}

Also read anti-detection rules at:
{ANTI_DETECTION_PATH}

Evaluate this ONE candidate:
- Profile URL or identifier: {PROFILE_URL}
- Source: {SOURCE_NAME}
- DELAY_SECONDS: {DELAY_SECONDS}
- NEXT_URL: {NEXT_URL}

Write the result row to:
{OUTPUT_FILE_PATH}

After writing the row, write your verdict to a file so the parent can read it without inheriting your Chrome context:

⛔ **VERDICT FILE (MANDATORY):** Write ONLY the summary line below to `_VERDICT.txt` in the same directory as the output xlsx. Overwrite any existing content. This file is the parent's sole channel for reading your result — the parent will read and delete it.

```
echo "{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company} | {DQ_Reason or ""}" > _VERDICT.txt
```

Then perform idle behavior on the profile page for DELAY_SECONDS per REF--Anti_Detection.md §3, then navigate the same tab to NEXT_URL (or close if empty).

Do NOT return any other output to the parent. The verdict file IS your return.
```

### Dual-Rubric Template (for recruiting pipeline — RC + Sr Sales Recruiter)

⛔ **Use this template when the orchestrator is running in dual-JD mode.** The CE evaluates the candidate against BOTH rubrics in a single invocation, then writes to whichever role's output file produces the higher score.

```
You are a single-candidate evaluator running in DUAL-RUBRIC mode.

Read BOTH evaluation frameworks:
- PRIMARY: {PRIMARY_JD_FILE_PATH}
- SECONDARY: {SECONDARY_JD_FILE_PATH}

Also read LinkedIn interface learnings at:
{LIR_LEARNINGS_PATH}

Also read anti-detection rules at:
{ANTI_DETECTION_PATH}

Evaluate this ONE candidate against BOTH rubrics:
- Profile URL or identifier: {PROFILE_URL}
- Source: {SOURCE_NAME}
- DELAY_SECONDS: {DELAY_SECONDS}
- NEXT_URL: {NEXT_URL}

OUTPUT FILES (write to the WINNING role's file only):
- PRIMARY output: {PRIMARY_OUTPUT_FILE_PATH}
- SECONDARY output: {SECONDARY_OUTPUT_FILE_PATH}

DUAL-EVALUATION PROCESS:
1. Read the candidate's full profile ONCE (do NOT re-read for each rubric).
2. Check auto-disqualifiers for BOTH roles. A candidate may be DQ'd from one role but not the other.
3. Score against the PRIMARY rubric → compute percentage.
4. Score against the SECONDARY rubric → compute percentage.
5. Compare the two percentages:
   - If BOTH are DQ/F → write to the PRIMARY output file as DQ/F.
   - If one is DQ/F and the other isn't → the non-DQ role wins. Write to that role's output file.
   - If both have valid scores → the HIGHER percentage wins. Write to that role's output file.
   - If tied → the PRIMARY role wins (tie goes to the priority role).
6. In the Whys column, add a line: "Dual-eval: also scored {LosingRole} at {LosingScore%}"
7. Also check for duplicates in BOTH output files before scoring.

After writing the row, write your verdict to a file so the parent can read it without inheriting your Chrome context:

⛔ **VERDICT FILE (MANDATORY):** Write ONLY the summary line below to `_VERDICT.txt` in the same directory as the output xlsx. Overwrite any existing content. This file is the parent's sole channel for reading your result — the parent will read and delete it.

```
echo "{Full Name} | {WinningRole} | {Tier} | {Score%} | {Verdict} | {Current Company} | {LosingRole}:{LosingScore%} | {DQ_Reason or ""}" > _VERDICT.txt
```

Then perform idle behavior on the profile page for DELAY_SECONDS per REF--Anti_Detection.md §3, then navigate the same tab to NEXT_URL (or close if empty).

Do NOT return any other output to the parent. The verdict file IS your return.
```

---

## Parameters

### Single-Rubric Parameters

| Parameter | Description | Who provides it |
|-----------|-------------|----------------|
| `JD_FILE_PATH` | Full path to the active JD file (e.g., `JD--Acct_Mgr.md`) | Both callers — read from Pipeline Config |
| `LIR_LEARNINGS_PATH` | Full path to `REF--LIR_Interface_Learnings.md` | Both callers |
| `ANTI_DETECTION_PATH` | Full path to `REF--Anti_Detection.md` | Both callers |
| `PROFILE_URL` | Candidate's LIR profile URL or identifier | Orchestrator: from URL Extractor. Cleanup: extracted from broken row. |
| `SOURCE_NAME` | Source identifier for the Source column | Orchestrator: from run params. Cleanup: extracted from broken row. |
| `DELAY_SECONDS` | Random 45-200, never same twice in a row | Both callers generate this value |
| `NEXT_URL` | Next candidate's URL, or empty if last in batch | Orchestrator: next URL from extractor list. Cleanup: empty (cleanup processes one at a time). |
| `OUTPUT_FILE_PATH` | Full path to the output xlsx file | Both callers — read from JD config `output_file` |

### Dual-Rubric Additional Parameters

| Parameter | Description | Who provides it |
|-----------|-------------|----------------|
| `PRIMARY_JD_FILE_PATH` | Full path to the priority role's JD file | Orchestrator — from run params |
| `SECONDARY_JD_FILE_PATH` | Full path to the secondary role's JD file | Orchestrator — from run params |
| `PRIMARY_OUTPUT_FILE_PATH` | Full path to the priority role's output xlsx | Orchestrator — read from primary JD config |
| `SECONDARY_OUTPUT_FILE_PATH` | Full path to the secondary role's output xlsx | Orchestrator — read from secondary JD config |

> **Note:** In dual-rubric mode, the `JD_FILE_PATH` and `OUTPUT_FILE_PATH` single-rubric params are NOT used. Use the `PRIMARY_*` and `SECONDARY_*` params instead.

---

## Caller-Specific Notes

### Pipeline Orchestrator (Phase 2)

- `NEXT_URL` = the next candidate URL from the current URL Extractor batch, or empty if this is the last candidate in the batch
- `DELAY_SECONDS` = random 45-200, orchestrator generates and passes it
- Orchestrator does NOT sleep between spawns — the CE handles the delay internally
- Sequential: one CE at a time
- **Dual-rubric mode:** The orchestrator specifies which JD is PRIMARY (the priority role for this run). The CE's return line includes both scores so the orchestrator can track A-rates per role.

### Cleanup Agent (Step 4, re-evaluating broken rows)

- `NEXT_URL` = empty (cleanup processes broken rows one at a time, no batch lookahead)
- `DELAY_SECONDS` = random 45-200, cleanup agent generates and passes it
- Sequential: one CE at a time, mandatory delay between candidates
- Check `Z_Search_Cache.json` (top5_summary + a_rated_cache) BEFORE spawning — if the candidate is cached, reconstruct the row from cache instead of re-evaluating
- **Dual-rubric mode:** Cleanup should re-evaluate using the same dual template. Check both output files for the broken row's candidate name to determine which file needs the fix.

---

## Model

All CE sub-agents spawn with `model: "sonnet"`. Sonnet is sufficient for fixed-rubric scoring and costs ~5x less than Opus.

---

## Dual-Rubric Return Line Format

In dual-rubric mode, the CE return line has additional fields:

```
{Full Name} | {WinningRole} | {Tier} | {Score%} | {Verdict} | {Current Company} | {LosingRole}:{LosingScore%} | {DQ_Reason or ""}
```

**Examples:**
```
Priya Patel | Sr Sales Recruiter | A | 85.2% | Strong Yes | BrowserStack | Recruiting Coordinator:72.1% |
Ankit Shah | Recruiting Coordinator | B | 74.4% | Yes | Zycus | Sr Sales Recruiter:61.3% |
Raj Desai | Sr Sales Recruiter | F | 0% | Hard No | Teleperformance | Recruiting Coordinator:0% | BPO career
```

The orchestrator parses the `WinningRole` field to track A-rates per role and the `LosingRole:Score%` field for analytics.
