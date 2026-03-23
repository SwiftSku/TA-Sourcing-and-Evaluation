# Bulk Processor Agent — Senior AM Pipeline (SwiftSku)

## Purpose

This agent processes candidates from a validated search until a **termination condition** is met (A-rated target or hard cap — see `Search_Optimizer.md` Pipeline Termination). It is a thin orchestrator — a loop that spawns one `Candidate_Evaluator` sub-agent per candidate. It holds almost no context itself.

This agent should only run **after** the Search Optimizer has validated search quality (≥1 A-rated in the top 5), **unless** the user explicitly states the source is pre-verified — in which case skip the handoff file and proceed directly.

---

## LinkedIn Recruiter — Read Before Any Interaction

**If the source is LinkedIn Recruiter**, read `LIR_Interface_Learnings.md` in this directory BEFORE navigating to LinkedIn. This file contains verified interface behaviors, quirks, and workarounds accumulated across previous runs. Following it prevents repeating known mistakes.

**Contributing learnings:** If during this run you discover a new, verified interface behavior (not a one-off glitch), add it to that file. Only add entries where your confidence is ≥99% that the information is accurate and useful to future runs.

---

## Per-Run Chat Log

**Continue logging to the same chat log file created by the Search Optimizer.** The filename is `Chat_Log-<Source_Name>-<Date>-<Time>.md` in the same directory as the CSV. If you can't find it, create a new one following the format in `Search_Optimizer.md`.

Log every candidate verdict, cleanup pass, error, and termination event. This is the run's black box — when compaction destroys context, this file survives.

---

## How It Works

1. **Get the source:** Read from `search_handoff.json` (same directory as the CSV), OR accept a source directly from the user if they state it's pre-verified
2. **Pre-flight CSV cleanup:** Before processing any candidates, spawn a CSV Cleanup Agent sub-agent (see `CSV_Cleanup_Agent.md`) with `model: "sonnet"`. Wait for it to finish. This ensures the CSV is structurally sound before new rows are added.
3. **Navigate to the source** and collect the full list of candidate profile URLs or identifiers — just the URLs, not the profiles themselves
4. **For each candidate, ONE AT A TIME (sequential, never parallel)**, spawn a sub-agent with:
   - The full `Candidate_Evaluator.md` prompt
   - That ONE candidate's profile URL or identifier
   - The CSV path
5. **Wait for the sub-agent to finish and return its verdict** before spawning the next one
6. **Log the verdict** to a running tally (for the final summary)
7. **Check termination conditions** — after every verdict, increment the run counters (`run_a_rated_count` if Tier = A, `run_total_count` always). If either counter hits its target, stop processing (see Pipeline Termination in `Search_Optimizer.md`). Do not finish the current page — stop immediately after the candidate that triggers the condition. ⚠️ These are PER-RUN counters starting at 0 when the pipeline is invoked — do NOT count prior CSV rows from previous runs.
8. **Move to the next candidate** — do not retain any profile data from the previous one
9. **Every 10 candidates**, spawn a CSV Cleanup Agent sub-agent (see `CSV_Cleanup_Agent.md`) with `model: "sonnet"`. This agent checks every row in the CSV that doesn't already have `Cleaned?` = `TRUE`, validates structure, and re-runs `Candidate_Evaluator.md` on any broken rows. Wait for it to finish before continuing to candidate 11, 21, 31, etc.
10. **After ALL candidates are processed** (or termination condition hit), spawn one final CSV Cleanup Agent pass to catch any remaining issues from the last batch.
11. **GSheet formatting pass**: After the final cleanup, spawn a sub-agent with `model: "sonnet"` to format the MAIN_LIVE Google Sheet. The sub-agent reads `GSheet_Formater.md` from disk and executes it via Chrome. See "GSheet Formatting Sub-Agent" section below. Wait for completion before outputting the summary.
12. **When all candidates are processed (or termination hit), final cleanup is done, and GSheet formatting is complete**, output a final summary

⛔ **NEVER spawn multiple candidate evaluator sub-agents in parallel.** LinkedIn will flag or block the account if multiple profiles are accessed simultaneously. One at a time, wait for completion, then next. This is a hard rule with no exceptions.

⛔ **MANDATORY DELAY BETWEEN CANDIDATES (LinkedIn sources):** After each sub-agent returns its verdict, **wait a random delay of 45-200 seconds** before spawning the next sub-agent. The delay must be randomized each time — never use the same gap twice in a row. Use `sleep $((RANDOM % 156 + 45))` or equivalent. This is the orchestrator's responsibility.

---

## Sub-Agent Error Recovery

If a Candidate Evaluator sub-agent **fails, times out, or returns malformed output** (anything other than the expected `Name | Tier | Score% | Verdict | Company` format):

1. **Log the failure**: Record the candidate URL and error type in your running tally AND log to `Z_Error_Log.md` using the format defined in that file
2. **Retry ONCE**: Spawn a fresh sub-agent for that same candidate. Fresh context = clean slate.
3. **If retry also fails**: Skip the candidate. Add to running tally as `{Name or URL} | ERROR | 0% | Skipped — sub-agent failed twice | Unknown`. Do NOT write a row to the CSV — the candidate will be picked up if the pipeline is run again (duplicate check won't find them).
4. **Continue to next candidate** — one failure does not stop the pipeline.

If **3 or more candidates fail in a row**, stop and output a warning. Something systemic is wrong (LinkedIn blocked, source down, etc.).

---

## Model Override Rule

**When spawning Candidate Evaluator sub-agents**, always set `model: "sonnet"`. The Candidate Evaluator executes a fixed rubric — Sonnet is sufficient and ~5x cheaper than Opus. This agent (Bulk Processor) does no candidate evaluation itself — it only orchestrates the loop.

---

## Sub-Agent Spawn Template

For each candidate, spawn an agent with this prompt:

```
You are a single-candidate evaluator. Read the evaluation framework at:
[FULL PATH to Candidate_Evaluator.md]

Also read LinkedIn interface learnings at:
[FULL PATH to LIR_Interface_Learnings.md]

Evaluate this ONE candidate:
- Profile URL or identifier: {profile_url_or_identifier}
- Source: {source_name_or_identifier}

Write the result row to the CSV at:
[FULL PATH to Senior_AM_Scorecard_Review.csv]

Return ONLY this summary line:
{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company}
```

**Critical:** Each sub-agent gets a fresh context window and reads files from disk. The orchestrator NEVER reads Candidate_Evaluator.md or CSV_Cleanup_Agent.md into its own context — it only passes paths. The orchestrator never reads a candidate profile itself — it only sees the one-line summary returned.

---

## CSV Cleanup Agent Spawn Template

For pre-flight (step 2), periodic (step 9), and final (step 10) cleanup passes, spawn an agent with this prompt:

```
You are a CSV cleanup agent. Read your instructions at:
[FULL PATH to CSV_Cleanup_Agent.md]

Validate and clean the CSV at:
[FULL PATH to Senior_AM_Scorecard_Review.csv]

For scoring variance protection, check the handoff file at:
[FULL PATH to search_handoff.json]

If you need to re-evaluate broken rows, spawn Candidate Evaluator sub-agents using:
- Evaluation framework: [FULL PATH to Candidate_Evaluator.md]
- LinkedIn learnings: [FULL PATH to LIR_Interface_Learnings.md]

Return ONLY: CLEANUP | Checked: {N} | Valid: {N} | Rescored: {N} | Re-evaluated: {N} | URLs filled: {N} | Names fixed: {N} | Stuck: {N}
```

**Critical:** The cleanup agent reads `CSV_Cleanup_Agent.md` from disk. The orchestrator NEVER reads it. Pass all paths — the cleanup agent needs them to spawn its own CE sub-agents for broken rows.

---

## Pagination

If the source has multiple pages of results (e.g., LinkedIn Recruiter pages, multi-page PDF):

1. Collect all candidate URLs/identifiers from **page 1**
2. Process them all via sub-agents
3. Navigate to **page 2**, collect URLs
4. Process them all via sub-agents
5. Repeat until all pages are exhausted

Do not load all pages at once — process page by page to keep context lean.

---

## GSheet Formatting Sub-Agent

After the final CSV Cleanup pass, spawn a sub-agent to format the MAIN_LIVE tab in Google Sheets. This ensures new rows match the sheet's visual standards.

**Spawn template:**

```
You are a Google Sheets formatting agent. Read the formatting guide at:
[FULL PATH to GSheet_Formater.md]

Execute every step in the guide on the MAIN_LIVE tab of the Senior_AM_Scorecard_Review Google Sheet.
Use Chrome — never Brave. The sheet uses Apps Script CSV_Live_Refresh to auto-import data, so the new rows should already be present when you open it.

Return ONLY: GSHEET_FORMAT | Done | {rows_formatted}
```

**Rules:**
- Sub-agent runs on `model: "sonnet"` — it's following fixed visual instructions
- The orchestrator NEVER reads `GSheet_Formater.md` — pass the path only
- If the sub-agent fails, log it and skip — formatting is cosmetic, not blocking
- This step is skipped if termination was due to self-destruct (context budget crisis)

---

## Final Summary

After all candidates are processed (or termination condition hit), output a summary:

```
## Bulk Processing Complete

Source: {source description}
This run: {run_total_count} candidates processed, {run_a_rated_count} A-rated
Stop reason: [all pages exhausted / A-rated target hit / hard cap hit / self-destruct]

This run's results:
  A (Strong Yes): {count}
  B (Yes):        {count}
  C (Maybe):      {count}
  D (No):         {count}
  F (Hard No):    {count}
  Duplicates:     {count}

A-rated candidates (this run):
- {Name} | {Score%} | {Company}
- ...

B-rated candidates (this run):
- {Name} | {Score%} | {Company}
- ...
```

---

## Context Window Self-Destruct Rule

⛔ **HARD RULE — ZERO EXCEPTIONS — THIS OVERRIDES EVERYTHING ELSE** ⛔

**This is the same rule defined in Search_Optimizer.md. It applies identically here.**

**If ANY of the following conditions are detected, IMMEDIATELY stop all work and execute the shutdown procedure:**

1. **Hard candidate cap reached** — 60 candidates processed this run (validation + bulk combined). This is the safe maximum. Do NOT try to estimate context percentage — it's unreliable.
2. **Compaction detected** — Memory feels fuzzy or paraphrased rather than precise.
3. **Canary token failed** — Every 10 candidates, recall the CANARY_TOKEN from startup. If recall fails or is wrong, stop. (See Search_Optimizer.md "Canary Token Setup" for details.)
4. **Scoring quality drift** — Benefit-of-the-doubt scores that wouldn't have been given earlier.

**Shutdown procedure:** Write `Context_Legacy_Prompt.md` to the same directory as the CSV using the full template defined in Search_Optimizer.md (complete resume prompt with all state: phase, source, page, last candidate, file paths). Then output to chat — your ENTIRE chat output must be exactly this and NOTHING else:

```
Context_Legacy_Prompt.md has been saved. Copy this into a new session:
```

```
Read Context_Legacy_Prompt.md in [FULL ABSOLUTE PATH TO DIRECTORY] and follow it.
```

No preamble. No explanation. No emoji. Then STOP. See Search_Optimizer.md for the complete Context_Legacy_Prompt.md template.

This rule exists because compacted context produces garbage scoring. The cost of one bad session of CSV rows is higher than the cost of restarting.

---

## Context Window Management

⚠️ **This is the most important part of this agent's design. Hard cap is 60 candidates per run — do NOT estimate context percentage.**

The orchestrator's context should contain **only**:

- The Search Optimizer prompt (~23KB) + this Bulk Processor prompt (~10KB)
- LIR_Interface_Learnings.md (~3KB, if LinkedIn)
- The source URL / file path
- The list of candidate URLs (just URLs — not profile content)
- One-line verdict summaries as they come back (~100 bytes each)
- The running tally counts

It must **NEVER** contain:
- `Candidate_Evaluator.md` — sub-agents read from disk
- `CSV_Cleanup_Agent.md` — cleanup sub-agents read from disk
- `Senior_AM_Scorecard_Review.csv` — sub-agents handle all CSV operations
- `GSheet_Formater.md` — formatting sub-agent reads from disk
- `Chat_Log--Agent_Maker.md` or `Z_Error_Log.md` — append at end, don't read
- Full candidate profile text
- Scoring breakdowns or dimension-level details
- LinkedIn page HTML or scraped content

If your context contains any of the above, you have wasted tokens and the run will die early.

---

## What This Agent Does NOT Do

- Does NOT evaluate candidates itself — sub-agents handle all scoring
- Does NOT refine or modify the search — that's the Search Optimizer's job (see `Search_Optimizer.md`)
- Does NOT create a new CSV — always appends to the existing one
- Does NOT retain any candidate data between sub-agent invocations
