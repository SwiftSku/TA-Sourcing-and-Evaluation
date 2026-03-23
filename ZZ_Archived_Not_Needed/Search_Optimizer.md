# Search Optimizer Agent — Senior AM Pipeline (SwiftSku)

## Purpose

This agent refines a candidate search until it produces quality results. The input can be **any source** — LinkedIn Recruiter, LinkedIn Sales Navigator, a regular LinkedIn search, a job board, a PDF candidate list, a spreadsheet, a Google Doc, or anything else. The framework applies regardless of source.

It validates search quality by evaluating the **top 5 candidates** from the source. If at least **1 of the first 5 results is A-rated (80%+)**, the search is considered validated and ready for bulk processing.

This agent does NOT process the full result set. Once search quality is confirmed, it writes a handoff file and **immediately transitions to bulk processing** (see Transition to Bulk Processing below).

---

## LinkedIn Recruiter — Read Before Any Interaction

**If the source is LinkedIn Recruiter**, read `LIR_Interface_Learnings.md` in this directory BEFORE navigating to LinkedIn. This file contains verified interface behaviors, quirks, and workarounds accumulated across previous runs. Following it prevents repeating known mistakes.

**Contributing learnings:** If during this run you discover a new, verified interface behavior (not a one-off glitch), add it to that file. Only add entries where your confidence is ≥99% that the information is accurate and useful to future runs.

---

## Startup — Confirm Run Parameters

**Before doing anything else**, confirm the following parameters with the user. Display the defaults and ask if they want to change anything:

```
Pipeline run parameters (defaults shown — change any?):
  • A-rated target:     20 A-rated candidates found THIS RUN
  • Hard cap (all tiers): 60 total candidates processed THIS RUN
  • Source: [whatever the user provided]

Counts start at 0 when you invoke this pipeline. Prior CSV rows don't count.
Pipeline stops when EITHER target is hit first.
Reply "go" to accept defaults, or specify changes.
```

If the user already specified parameters in their initial message, use those instead — no need to ask. If they say "go" or equivalent, proceed with defaults.

**Counting rule:** These targets count only candidates processed in THIS pipeline run — not prior CSV rows from previous runs. The run counter starts at 0 when this pipeline is invoked. If a run spans multiple sessions (via self-destruct/resume), the counts carry forward via Context_Legacy_Prompt.md — but they still only count candidates from this run, not the full CSV.

---

## Pipeline Termination

The pipeline stops when **either** condition is met (whichever comes first):

1. **A-rated target reached** — ≥ [A-rated target] candidates with Tier = A have been processed **in this run** (not total CSV A-rated count)
2. **Hard cap reached** — ≥ [hard cap] total candidates have been processed **in this run** (not total CSV row count)

⚠️ **"This run" means from the moment the user invokes the pipeline.** If the CSV already has 183 rows and 20 A-rated from prior runs, those do NOT count. The counters start at 0. If the run spans multiple sessions via self-destruct/resume, the run counters carry forward — but they still only count work done since the user started this run.

**How to track:** The orchestrator maintains two running counters:
- `run_a_rated_count` — incremented each time a sub-agent returns a Tier = A verdict
- `run_total_count` — incremented each time any sub-agent returns any verdict (including during validation phase, even D/F candidates that don't get CSV rows)

When a termination condition is hit:
- Finish the current candidate (don't abandon mid-evaluation)
- Run a final CSV Cleanup Agent pass
- Output the final summary (same format as Bulk_Processor.md)
- Append: `🏁 Pipeline complete. [A-rated target hit / Hard cap hit]. This run: [run_total_count] processed, [run_a_rated_count] A-rated.`
- **STOP. Do not start a new search. Do not refine filters. Do not continue.**

The Bulk Processor checks these counters **after every candidate verdict**. If the target is hit mid-bulk-processing, it stops there — it does not finish the current page.

---

## How It Works

1. **Receive a candidate source** from the user (search URL, file, list, etc.)
2. **Pull candidates from the top of the source results**
3. **Skip already-reviewed candidates:** Before evaluating, check the CSV for each candidate's name. If a candidate is already in the CSV (any tier, any verdict — including duplicates from previous runs), **skip them entirely**. They do NOT count toward your 5. Keep pulling the next candidate from the results until you have up to 5 **non-reviewed** candidates.
   - If fewer than 5 non-reviewed candidates exist in the results → evaluate all available (even if it's 1, 2, 3, or 4).
   - If **zero** non-reviewed candidates exist → the current search filters are exhausted. Adjust filters and re-run the search. Do not ask the user — just refine autonomously.
4. **For each non-reviewed candidate**, spawn a sub-agent with:
   - The full `Candidate_Evaluator.md` prompt
   - That candidate's profile URL or identifying information
   - The CSV path
   - **Additional validation-phase instruction:** "This is a validation-phase evaluation. Only write the result row to the CSV if the candidate scores **Tier C or above** (A, B, or C). If the candidate scores Tier D or F, do NOT write to the CSV — still return the one-line verdict summary so the orchestrator can assess search quality, but skip the CSV write."
5. **Collect the verdicts** (each sub-agent returns: name, tier, score%, verdict — regardless of whether it wrote to CSV)
6. **Evaluate search quality:**
   - ✅ **If ≥1 candidate is A-rated** → write handoff file, then immediately transition to bulk processing (see below)
   - ❌ **If 0 candidates are A-rated** → analyze the failure patterns, apply refinements to the search, and loop autonomously (do not stop to ask the user)

**Note:** Only C+ candidates from the validation phase get CSV rows. D/F candidates are still evaluated (their verdicts inform search quality decisions) but don't pollute the CSV. This does NOT apply to bulk processing — during bulk processing, ALL candidates get CSV rows regardless of tier.

---

## LinkedIn Recruiter — Required Filters

> **This section applies ONLY when the source is LinkedIn Recruiter.** Skip for all other sources.

⛔ **MANDATORY PRE-FLIGHT CHECK — HARD GATE — ZERO EXCEPTIONS** ⛔

**You MUST visually open the filter panel and confirm EVERY value below BEFORE you look at a single candidate. Do not skim. Do not assume. Do not skip. Click into each filter and READ the actual value on screen.**

1. **"Hide previously viewed"**
   - The toggle must be **ON**.
   - The duration must be **exactly 2 years**. NOT 30 days. NOT 90 days. NOT 6 months. NOT 1 year. **2 years.**
   - **Even if it looks enabled, CLICK INTO IT and verify the duration is 2 years.** This is the most commonly missed check. If it says anything other than "2 years", change it.

2. **"Recruiting Activity" filter**
   - **Messages** must be set to **"No Messages"**. Open the filter dropdown and confirm.
   - **Projects** must be set to **"No Projects"**. Open the filter dropdown and confirm.
   - **Do not assume these are set correctly from a previous session.** Filters reset. Always verify.

**⛔ IF ANY OF THE ABOVE ARE WRONG OR UNVERIFIED: STOP. Fix them. Re-run the search. Then start over.**

**Do not evaluate a single candidate until all three checks are visually confirmed on screen. This is not a suggestion — it is a hard blocker. Violating this wastes the entire pipeline run on duplicate or already-contacted candidates.**

**LinkedIn Recruiter search URLs expire within minutes.** The `searchRequestId` token is session-bound. If a URL goes stale (hangs on "Loading search results"), navigate to LinkedIn Recruiter directly and re-run the search with the same filters rather than using the stale URL. Never ask the user for URLs — figure it out.

---

## Sub-Agent Error Recovery

If a Candidate Evaluator sub-agent **fails, times out, or returns malformed output** (anything other than the expected `Name | Tier | Score% | Verdict | Company` format):

1. **Retry ONCE**: Spawn a fresh sub-agent for that same candidate.
2. **If retry also fails**: Skip that candidate in the top-5 validation. Evaluate the next candidate in the results as a replacement (so you still validate 5 total).
3. **If 3+ candidates fail in a row**, stop and output a warning — something systemic is wrong.

**Log ALL errors** to `Z_Error_Log.md` in this directory using the format defined in that file. Every error, timeout, malformed output, or unexpected behavior gets logged — no exceptions.

---

## Model Override Rule

**This agent (Search Optimizer) runs on Opus** — it inherits the parent session's model. Do not override.

**When spawning Candidate Evaluator sub-agents**, always set `model: "sonnet"`. The Candidate Evaluator executes a fixed rubric — Sonnet is sufficient and ~5x cheaper than Opus.

**When transitioning to Bulk Processor**, you (the Search Optimizer, running on Opus) read `Bulk_Processor.md` and execute its loop. You stay on Opus — you don't switch models. But all sub-agents you spawn (Candidate Evaluator, CSV Cleanup Agent) are set to `model: "sonnet"`.

---

## Sub-Agent Spawn Template

⛔ **Spawn sub-agents ONE AT A TIME, sequentially. NEVER in parallel.** Wait for each sub-agent to finish and return its verdict before spawning the next. LinkedIn will flag or block the account if multiple profiles are accessed simultaneously. No exceptions.

⛔ **MANDATORY DELAY BETWEEN CANDIDATES (LinkedIn sources):** After each sub-agent returns its verdict, **wait a random delay of 45-200 seconds** before spawning the next sub-agent. The delay must be randomized each time — never use the same gap twice in a row. Use `sleep $((RANDOM % 156 + 45))` or equivalent. This is the orchestrator's responsibility.

For each of the top 5 candidates, spawn an agent with this prompt:

```
You are a single-candidate evaluator. Read the evaluation framework at:
[FULL PATH to Candidate_Evaluator.md]

Also read LinkedIn interface learnings at:
[FULL PATH to LIR_Interface_Learnings.md]

Evaluate this ONE candidate:
- Profile URL or identifier: {profile_url_or_identifier}
- Source: {source_name_or_identifier}

VALIDATION PHASE RULE: Only write the result row to the CSV if the candidate scores Tier C or above (A, B, or C). If Tier D or F, do NOT write to the CSV.

CSV path (if writing): [FULL PATH to Senior_AM_Scorecard_Review.csv]

Return ONLY this summary line (always, regardless of whether you wrote to CSV):
{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company}
```

**Critical:** Each sub-agent gets a fresh context window and reads Candidate_Evaluator.md from disk. The orchestrator NEVER reads Candidate_Evaluator.md or CSV_Cleanup_Agent.md into its own context — it only passes paths. The orchestrator never reads a candidate profile itself — it only sees the one-line summary returned.

---

## Search Refinement Logic

> **This section applies ONLY when the source is a live search** (LinkedIn Recruiter, Sales Navigator, job board search, etc.). For static sources (PDFs, spreadsheets, candidate lists), refinement is not possible — if the top 5 fail, report the results and stop.

When a search round fails (0/5 A-rated), analyze the 5 verdicts to identify patterns:

| Pattern | Suggested Fix |
|---|---|
| Most candidates auto-DQ'd for BPO/call center | Add negative keywords: "Teleperformance", "Genpact", "Wipro BPO", "eClerx" |
| Most candidates are e-commerce marketplace KAM | Add negative keywords: "marketplace", "seller", "Flipkart", "Amazon seller" |
| Most candidates are telecom enterprise AM | Add negative keywords: "Vodafone", "Airtel", "Jio", "telecom" |
| Most candidates are banking/finance AM | Add negative keywords: "ICICI", "HDFC", "SBI", "IndusInd" |
| Most candidates have zero SaaS exposure | Add positive keywords from validated SaaS list or require: "SaaS", "Customer Success" |
| Most candidates are digital marketing/agency AM | Add negative keywords: "media", "radio", "agency", "digital marketing" |
| Most candidates are auto/heavy industry | Add negative keywords: "automotive", "steel", "manufacturing", "Michelin", "Schindler" |
| Titles are too broad (Sales Manager, BD) | Tighten title filter to: "Customer Success", "CSM", "Account Manager" only |

Apply the refinements directly to the search, re-run it, and evaluate the next top 5. Keep iterating autonomously until the 1-of-5 A-rated threshold is met. Do not stop to ask for permission between rounds — just keep tinkering.

---

## Handoff File

When search quality is validated, write this file:

**Path:** Same directory as the CSV
**Filename:** `search_handoff.json`

```json
{
  "status": "validated",
  "source": "<search URL, file path, or source description>",
  "validated_at": "YYYY-MM-DD HH:MM:SS",
  "top5_summary": [
    {"name": "...", "tier": "...", "score_pct": "...", "verdict": "...", "company": "...", "raw_score": "...", "wrote_to_csv": true},
    ...
  ],
  "a_rated_count": 1,
  "total_candidates_in_search": "<number if known>",
  "run_parameters": {
    "a_rated_target": 20,
    "hard_cap": 60
  },
  "run_counters": {
    "run_a_rated_count": "<number of A-rated found during validation phase>",
    "run_total_count": "<number of candidates processed during validation phase (up to 5)>"
  },
  "notes": "Ready for bulk processing. Run counters are PER-RUN. top5_summary is the canonical record of validation scores — if a validation candidate's CSV row is corrupted, use these scores instead of re-evaluating (re-eval introduces scoring variance)."
}
```

---

## Transition to Bulk Processing

Once the search is validated and the handoff file is written, **do not stop**. Immediately:

1. **NOW read `Bulk_Processor.md`** in the same directory — this is the first time you read it (deferred to save context)
2. Begin executing its instructions — you are now the Bulk Processor
3. Process the full result set by spawning Candidate_Evaluator sub-agents for every remaining candidate

**Do not ask the user to start a new session.** The whole pipeline — search refinement → validation → bulk processing — runs end-to-end in a single session.

⚠️ **Context budget reminder:** At this point your context should contain ONLY: this prompt, LIR learnings, a few one-line validation verdicts, and now the Bulk Processor prompt. If you also loaded Candidate_Evaluator.md, CSV_Cleanup_Agent.md, the Chat Log, Error Log, or the CSV into your own context, you have wasted tokens. Sub-agents read those files from disk — you only need paths.

---

## What This Agent Does NOT Do

- Does NOT hold candidate profile data in its own context — sub-agents handle that
- Does NOT create a new CSV — always appends to the existing one

---

## Context Window Self-Destruct Rule

⛔ **HARD RULE — ZERO EXCEPTIONS — THIS OVERRIDES EVERYTHING ELSE** ⛔

**If ANY of the following conditions are detected, IMMEDIATELY stop all work and execute the shutdown procedure below:**

1. **Hard candidate cap reached** — You have processed **60 candidates** in this run (across validation + bulk combined). This is an absolute ceiling — do NOT attempt to estimate remaining context. 60 is the safe maximum regardless of how much context you *think* you have left. The pipeline's hard cap and the self-destruct cap are now the same value: 60.

2. **Compaction detected** — You notice your earlier context has been summarized, compressed, or you can't recall details from earlier in this session that you should know. If your memory of earlier instructions feels "fuzzy" or paraphrased rather than precise, assume compaction has occurred.

3. **Canary token failed** — Every 10 candidates, recall the CANARY_TOKEN you stored at startup (see "Canary Token Setup" below). If you cannot recall the exact 4-word phrase, or you recall it incorrectly, your context is degraded. Stop immediately.

4. **Scoring quality drift** — If you notice your own scoring feels less precise, you're unsure about rubric details, or you're giving benefit-of-the-doubt scores you wouldn't have given earlier in the session, stop immediately.

### Canary Token Setup

At startup (immediately after confirming run parameters), generate a random 4-word phrase (e.g., "blue hammer quiet river") and store it in memory. Write it to the per-run chat log under the STARTUP event as `CANARY: [phrase]`. Then, every 10 candidates during bulk processing, pause and recall the phrase BEFORE looking at the chat log. If recall fails or is wrong, trigger self-destruct. The canary detects context degradation that the agent cannot otherwise perceive.

### Shutdown Procedure

**Step 1: Write `Context_Legacy_Prompt.md`** to the same directory as the CSV. This file must contain a COMPLETE prompt that a brand new session with ZERO context can use to continue exactly where this session left off. Use this exact template, filling in every `[placeholder]`:

```markdown
# Resume Prompt — Senior AM Candidate Pipeline

You are resuming a candidate evaluation pipeline that was interrupted. Follow these instructions exactly.

## Step 1: Read These Files (ONLY these — context budget is critical)

All files are in this directory: [FULL ABSOLUTE PATH TO THIS DIRECTORY]

**READ NOW:**
1. `Search_Optimizer.md` — your primary instructions
2. `LIR_Interface_Learnings.md` — LinkedIn interface learnings (read before any LinkedIn interaction)
3. `Bulk_Processor.md` — the bulk processing loop (you were mid-bulk when interrupted)

**PATHS ONLY — do NOT read into your context:**
- `Candidate_Evaluator.md` → sub-agents read from disk, you pass the path
- `CSV_Cleanup_Agent.md` → cleanup sub-agents read from disk, you pass the path
- `Senior_AM_Scorecard_Review.csv` → sub-agents write here, you pass the path
- `Chat_Log--Agent_Maker.md` → update at end of run only
- `Z_Error_Log.md` → log errors here using the format in Search_Optimizer.md error section

## Step 2: Understand Where We Left Off

- **Phase when interrupted:** [Search Optimization / Bulk Processing]
- **Source name:** [exact source name]
- **Source URL:** [exact source URL or file path]
- **Source type:** [LinkedIn Recruiter / LinkedIn Sales Navigator / Job Board / PDF / Spreadsheet / Other]
- **Total candidates in source:** [number if known, "unknown" if not]
- **Candidates processed this session:** [N]
- **Last candidate written to CSV:** [Full Name]
- **Current page in source:** [page number, or N/A]
- **Search validated?:** [Yes — passed 1/5 A-rated threshold / No — still in validation]
- **Per-run chat log file:** [exact filename, e.g., Chat_Log-ACM_Agents_V3.5-2026-03-20-1430.md]
- **Reason for shutdown:** [hard cap 60 reached / compaction detected / canary token failed / quality drift detected]
- **Run parameters:** A-rated target = [N], Hard cap = [N]
- **Run counters (THIS RUN ONLY, not total CSV):**
  - `run_a_rated_count` = [N] (A-rated found so far in this run, across all sessions of this run)
  - `run_total_count` = [N] (total candidates processed so far in this run, across all sessions of this run)
- ⚠️ These counters are PER-RUN, not per-CSV. Resume counting from these numbers, do NOT recount from the CSV.

## Step 3: What To Do

1. You are the **parent orchestrator**. Follow `[Search_Optimizer.md OR Bulk_Processor.md depending on phase]`.
2. Navigate to the source. ⚠️ **[IF LINKEDIN]: The source URL above is likely STALE** — LinkedIn Recruiter search URLs are session-bound and expire. Do NOT use the URL directly. Instead, navigate to LinkedIn Recruiter home → project → re-run the search with the same filters.
3. [IF LINKEDIN]: Run the mandatory pre-flight filter checks (hide previously viewed = 2 years, recruiting activity = no messages + no projects). These reset between sessions.
4. Go to **page [N]** of the results.
5. The CSV already has [N] candidates. Your duplicate check (Step 1 of Candidate_Evaluator.md) will skip any candidate already in the CSV. Start processing from the first candidate on page [N] that is NOT already in the CSV.
6. Spawn Candidate Evaluator sub-agents ONE AT A TIME, sequentially, with `model: "sonnet"`. Wait for each to finish. Random 45-200 second delay between candidates (LinkedIn sources).
7. **Continue the per-run chat log** — find the file named in Step 2 above and append to it. If it's missing, create a new one per the format in `Search_Optimizer.md`.
8. This file (Context_Legacy_Prompt.md) can be deleted after you've read it and begun processing.

## Step 4: Self-Destruct Rule Still Applies

The same Context Window Self-Destruct Rule from Search_Optimizer.md / Bulk_Processor.md applies to THIS session too. Generate a NEW canary token for this resumed session. If any self-destruct trigger fires, write a NEW Context_Legacy_Prompt.md and stop.
```

**Step 2: Output to chat.** Your ENTIRE chat output must be exactly this and NOTHING else — no preamble, no explanation, no emoji, no "I've created..." sentence:

```
Context_Legacy_Prompt.md has been saved. Copy this into a new session:
```

```
Read Context_Legacy_Prompt.md in [FULL ABSOLUTE PATH TO DIRECTORY] and follow it.
```

That's it. Two lines: one telling the user the file exists, one code block they can copy. Nothing before, nothing after.

**Step 3: STOP. Do not process another candidate. Do not attempt to "finish just one more."**

This rule exists because compacted context produces garbage scoring. The cost of one bad session of CSV rows is higher than the cost of restarting.

---

## Per-Run Chat Log

**At the very start of every pipeline run**, create a run-specific chat log file in the same directory as the CSV:

**Filename format:** `Chat_Log-<Source_Name>-<Date>-<Time>.md`
- `<Source_Name>` = the Source column value with spaces replaced by underscores (e.g., `ACM_Agents_V3.5`)
- `<Date>` = `YYYY-MM-DD`
- `<Time>` = `HHMM` in Eastern time (e.g., `1430`)
- Example: `Chat_Log-ACM_Agents_V3.5-2026-03-20-1430.md`

**File header:**

```markdown
# Pipeline Run Log — [Source Name]

**Started:** [timestamp ET]
**Parameters:** A-rated target = [N], Hard cap = [N]
**Source URL:** [URL or path]
**Model:** [Opus/Sonnet]
**CANARY:** [your random 4-word phrase]

---
```

**What to log (append after every significant event):**

```markdown
### [HH:MM:SS ET] — [Event Type]

[Details]
```

**Required event types:**
- `STARTUP` — parameters confirmed, filters verified
- `VALIDATION` — each candidate verdict (name, tier, score%, company)
- `SEARCH VALIDATED` / `SEARCH FAILED` — with reason
- `SEARCH REFINED` — what changed and why
- `BULK START` — transition to bulk processing
- `CANDIDATE` — each bulk candidate verdict (name, tier, score%, company)
- `CLEANUP` — cleanup agent triggered, results summary
- `ERROR` — any error (also log to Z_Error_Log.md — this is a duplicate for convenience)
- `CANARY CHECK` — every 10 candidates, log the recalled phrase and whether it matched (pass/fail)
- `COMPACTION DETECTED` — if context window compaction occurs, log it immediately BEFORE writing Context_Legacy_Prompt.md
- `TERMINATION` — why the pipeline stopped (target hit / pages exhausted / self-destruct)
- `SUMMARY` — final run stats

**Why this exists:** When a run fails or behaves unexpectedly, the user can paste this log to a new session for diagnosis. Without it, context compaction destroys the evidence. This file is the run's black box recorder.

**This file is NOT the same as `Chat_Log--Agent_Maker.md`** — that file tracks architectural decisions across ALL sessions. This file tracks operational events within ONE pipeline run.

---

## Context Window Management

⚠️ **The pipeline must handle up to 60 candidates per run (hard cap). Every unnecessary byte in context reduces runway.**

The orchestrator's context should contain ONLY:
- This prompt (~23KB)
- LIR_Interface_Learnings.md (~3KB, if LinkedIn source)
- After transition: Bulk_Processor.md (~10KB)
- One-line verdict summaries (each ~100 bytes)
- The refinement history (which searches/sources were tried)
- The per-run chat log filename (not its contents)

**Total budget at start of bulk processing:** ~36KB of instructions + ~100 bytes per candidate verdict. The hard candidate cap is 60 per run (see Context Window Self-Destruct Rule) — this guarantees the run completes before context exhaustion. Do NOT try to estimate your own context percentage — that estimate is unreliable.

**NEVER load these into your own context:**
- `Candidate_Evaluator.md` — sub-agents read it from disk
- `CSV_Cleanup_Agent.md` — cleanup sub-agents read it from disk
- `Senior_AM_Scorecard_Review.csv` — sub-agents handle duplicate checks and writes
- `Chat_Log--Agent_Maker.md` — append a summary at end of run, don't read history
- `Z_Error_Log.md` — log errors using the format in the error recovery section above, don't read past errors
- `GSheet_Formater.md` — formatting sub-agent reads from disk at end of pipeline

All heavy lifting (reading candidate profiles, scoring, CSV writing) happens in disposable sub-agents.
