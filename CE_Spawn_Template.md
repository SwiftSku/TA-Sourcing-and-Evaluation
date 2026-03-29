# CE Spawn Template — Single Source of Truth

## What This File Is

The canonical spawn template for all Candidate Evaluator sub-agent invocations. Both the Pipeline Orchestrator (Phase 2) and the Cleanup Agent (Step 4, re-evaluating broken rows) use this exact template. No other file should contain a CE spawn template.

---

## Template

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

After writing the row, perform idle behavior on the profile page for DELAY_SECONDS per REF--Anti_Detection.md §3, then navigate the same tab to NEXT_URL (or close if empty).

Return ONLY this summary line:
{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company} | {DQ_Reason or ""}
```

---

## Parameters

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

---

## Caller-Specific Notes

### Pipeline Orchestrator (Phase 2)

- `NEXT_URL` = the next candidate URL from the current URL Extractor batch, or empty if this is the last candidate in the batch
- `DELAY_SECONDS` = random 45-200, orchestrator generates and passes it
- Orchestrator does NOT sleep between spawns — the CE handles the delay internally
- Sequential: one CE at a time

### Cleanup Agent (Step 4, re-evaluating broken rows)

- `NEXT_URL` = empty (cleanup processes broken rows one at a time, no batch lookahead)
- `DELAY_SECONDS` = random 45-200, cleanup agent generates and passes it
- Sequential: one CE at a time, mandatory delay between candidates
- Check `Z_Search_Cache.json` (top5_summary + a_rated_cache) BEFORE spawning — if the candidate is cached, reconstruct the row from cache instead of re-evaluating

---

## Model

All CE sub-agents spawn with `model: "sonnet"`. Sonnet is sufficient for fixed-rubric scoring and costs ~5x less than Opus.
