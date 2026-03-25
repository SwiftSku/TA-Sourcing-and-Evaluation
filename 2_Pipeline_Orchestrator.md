# Pipeline Orchestrator — SwiftSku Candidate Pipeline

## Mission

**Get as many A-rated candidates as possible under the active JD file's Candidate Evaluator rubric.**

Every decision you make — search filters, refinement strategy, keyword changes — should optimize for this mission. More A-rated candidates = success. D/F-heavy searches = refine aggressively until you find the pockets of talent that score A.

## Active JD File

The Pipeline Starter specifies which JD file to use. At startup, parse the JD file's `Pipeline Config` block to extract all role-specific values: `role_name`, `output_file`, `tier1_companies`, `lir_title_filters`, `negative_keywords`, `passthrough_rule`, `refinement_patterns`, and `a_rate_signals`. Store these in memory and reference them throughout the run. **Never hardcode role-specific values in this file.**

## Purpose

This is the **single parent orchestrator** for the entire pipeline. It runs on **Opus** and manages all sub-agents. It replaces the previous Search_Optimizer.md + Bulk_Processor.md two-file design.

⛔ **CORE PRINCIPLE: This agent NEVER touches Chrome.** ALL browser interaction happens in disposable Sonnet sub-agents (URL Extractor, Candidate Evaluator, Cleanup). This keeps the parent's context at ~35KB through candidate 60, vs. ~150KB by candidate 6 in the old architecture.

---

## LinkedIn Recruiter — LIR Learnings

**If the source is LinkedIn Recruiter**, read `REF--LIR_Interface_Learnings.md` in this directory BEFORE doing anything else. This file contains verified interface behaviors, quirks, and workarounds accumulated across previous runs.

**Contributing learnings:** If a sub-agent reports a new verified interface behavior, add it to that file. Only add entries where confidence is ≥99%.

---

## Startup — Confirm Run Parameters

**Before doing anything else**, confirm the following parameters with the user:

```
Pipeline run parameters (defaults shown — change any?):
  • A-rated target:     20 A-rated candidates found THIS RUN
  • Hard cap (all tiers): 60 total candidates processed THIS RUN
  • Source: [whatever the user provided]

Counts start at 0 when you invoke this pipeline. Prior rows don't count.
Pipeline stops when EITHER target is hit first.
Reply "go" to accept defaults, or specify changes.
```

If the user already specified parameters in their initial message, use those — no need to ask. If they say "go" or equivalent, proceed with defaults.

**Counting rule:** These targets count only candidates processed in THIS pipeline run — not prior rows from previous runs. If a run spans multiple sessions (via self-destruct/resume), the counts carry forward via Context_Legacy_Prompt.md.

---

## Pipeline Termination

The pipeline stops when **either** condition is met (whichever comes first):

1. **A-rated target reached** — ≥ [A-rated target] candidates with Tier = A processed **in this run**
2. **Hard cap reached** — ≥ [hard cap] total candidates processed **in this run**

**How to track:** Maintain two running counters:
- `run_a_rated_count` — incremented each time a CE sub-agent returns Tier = A
- `run_total_count` — incremented each time any CE sub-agent returns any verdict

When a termination condition is hit:
- Finish the current candidate (don't abandon mid-evaluation)
- Run a final Cleanup Agent pass
- ⛔ **HARD GATE: Parse the cleanup return line. Check the `Uncleaned` field (NOT `Stuck` — `Uncleaned` is the ground truth count of rows where Cleaned? is NOT one of TRUE/DUPLICATE/ENRICHMENT_FAILED). If `Uncleaned: 0` is NOT in the return, the output file is not fully clean. Re-run the cleanup agent until `Uncleaned: 0`. Do NOT proceed to output summary until cleanup returns `Uncleaned: 0`.** If cleanup is stuck in a loop (3+ consecutive passes with identical Uncleaned count), stop and warn the user — manual intervention needed. Note: `ENRICHMENT_FAILED` rows are accepted as clean — they passed all structural/scoring tests but enrichment was permanently blocked (profile inaccessible). Dan can fix these manually.
- Output the final summary
- Append: `🏁 Pipeline complete. [A-rated target hit / Hard cap hit]. This run: [run_total_count] processed, [run_a_rated_count] A-rated.`
- **STOP.**

Check counters **after every candidate verdict**. If the target is hit mid-batch, stop there.

---

## How It Works — The Main Loop

There is **no separate validation phase**. The pipeline goes straight to processing. The first 5 CE verdicts serve as an implicit quality check.

### Phase 0: Pre-Flight

1. Confirm run parameters (above)
2. Generate canary token (see Canary Token Setup below)
3. Create per-run chat log (see Per-Run Chat Log below)
4. If LinkedIn source: read `REF--LIR_Interface_Learnings.md`
5. **Spawn Company Research Agent (parallel)** — see Company Research Agent section below. This runs in the background while you start processing Tier 1 companies. Its results feed Tier 2 of the target company list.

### Phase 1: URL Extraction (batch of 5)

⛔ **Static source dedup rule:** If the source is a static list (PDF, spreadsheet, Manus batch, external URL list), the URL Extractor is NOT used — candidates come directly from the list. Before spawning a CE sub-agent for any static-source candidate, the orchestrator MUST check the output file for duplicates by **name** (case-insensitive) AND by **normalized public LinkedIn URL** (strip subdomain variants: `in.linkedin.com` → `www.linkedin.com`). Skip any candidate that already exists in the output file. This prevents the same person being scored twice from different sources (e.g., Manus batch + LIR search).

For LinkedIn Recruiter sources, spawn a **URL Extractor** sub-agent (`model: "sonnet"`) to get the first 5 non-duplicate candidate URLs. The extractor handles ALL Chrome work: opens LIR, verifies filters, scrolls results, extracts URLs. It dies after returning.

**URL Extractor Spawn Template:**
```
You are a URL extractor agent. Read your instructions at:
[FULL PATH to URL_Extractor.md]

Also read LinkedIn interface learnings at:
[FULL PATH to REF--LIR_Interface_Learnings.md]

⛔ CRITICAL RULE: NEVER click on, modify, add, remove, or interact with ANY search filter. Filters are already set by the user. Your job is ONLY to scroll through results and extract candidate names + URLs. If a filter looks wrong, return ERROR: FILTER_MISMATCH — do NOT attempt to fix it. One wrong click destroys the entire search permanently.

Extract candidates from this search:
- LIR_URL: {lir_search_url_or_project}
- PAGE: {page_number}
- START_POS: {start_pos}
- LIR_LEARNINGS_PATH: [FULL PATH to REF--LIR_Interface_Learnings.md]
- CSV_PATH: [FULL PATH to [output file from JD config]]
- SKIP_NAMES: {comma_separated_names}

Return ONLY: PAGE X | POS Y | N candidates, followed by numbered list of Name | URL.
If page exhausted, append PAGE_EXHAUSTED. If entire search exhausted, append SEARCH_EXHAUSTED.
```

### Phase 2: Candidate Evaluation (one at a time)

For each URL returned by the extractor, spawn a **Candidate Evaluator** sub-agent (`model: "sonnet"`). Sequential only — ONE at a time. Random 45-200s delay between each.

**CE Spawn Template:**
```
You are a single-candidate evaluator. Read the evaluation framework at:
[FULL PATH to [active JD file]]

Also read LinkedIn interface learnings at:
[FULL PATH to REF--LIR_Interface_Learnings.md]

Evaluate this ONE candidate:
- Profile URL or identifier: {lir_profile_url}
- Source: {source_name}

Write the result row to:
[FULL PATH to output file from JD config]

Return ONLY this summary line:
{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company}
```

⛔ **The output file MUST be updated immediately after every single CE verdict — one candidate, one write, no batching.** Dan must be able to open the xlsx file at any point during the run and see every candidate evaluated so far.

ALL candidates get rows regardless of tier. There is no D/F exclusion.

### Phase 3: Quality Check — Initial Gate

The first quality check triggers after the **first 5 CE verdicts** for a new search:

| Result | Action |
|--------|--------|
| **≥1 A-rated** | Search quality is good. Continue processing. Move to Rolling Quality Gate. |
| **All D/F** | Search is bad. STOP this search immediately. Move to next company (if company-targeted) or apply Search Refinement Logic (if keyword fallback). |
| **Mixed (some B/C, no A)** | Give it one more batch. If 0 A after 10 candidates, STOP this search and move on. |

### Phase 3b: Rolling Quality Gate (after initial gate passes)

⛔ **This is a HIGH BAR.** After the initial 5-candidate gate, the search must sustain a **rolling 20% A-rate (1 A per 5 candidates)** to keep running.

**How it works:**

After every CE verdict (starting from candidate 6 in the current search), maintain a **rolling window of the last 5 candidates** evaluated in THIS search. Check:

| Rolling window (last 5) | Action |
|---|---|
| **≥1 A in last 5** | Search is productive. Continue. |
| **0 A in last 5, but ≥1 A in last 10** | ⚠️ Search is cooling off. Continue for ONE more batch of 5. If still 0 A in last 5 after that batch, STOP. |
| **0 A in last 10** | 🛑 Search is dead. STOP this search immediately. Move to next company or refine. |

**Per-search tracking:** Maintain these counters for the CURRENT search only (reset when switching companies or refining):
- `search_candidates` — total candidates evaluated in this search
- `search_a_count` — total A-rated in this search
- `last_5_tiers` — list of the last 5 verdict tiers (e.g., ["B", "A", "C", "B", "D"])
- `last_10_tiers` — list of the last 10 verdict tiers

**When a search is killed by the rolling gate:**
1. Log to per-run chat log: `SEARCH_KILLED: {search_description} | {search_candidates} processed | {search_a_count}A | reason: rolling gate`
2. If company-targeted mode: move to next company in queue
3. If keyword fallback mode: apply Search Refinement Logic
4. Do NOT stop the pipeline — only this search is dead

**Example:** Company "XYZ Corp" search. Candidates 1-5: [B, A, C, B, C] → ≥1 A, passes initial gate. Candidates 6-10: [C, D, C, D, C] → last 5 = 0 A, but last 10 has 1 A → warning, one more batch. Candidates 11-15: [D, C, D, B, C] → last 5 still 0 A, last 10 = 0 A → 🛑 STOP. Move to next company. Only 15 candidates burned instead of 60.

⛔ **SEARCH_EXHAUSTED does NOT mean the pipeline is done.** It means the CURRENT search's results are exhausted. If neither termination target (20 A-rated or 60 total) has been met, you MUST move to the next company or refine the search. The pipeline only stops when a termination condition is hit OR all companies and refinements are exhausted.

**D/F candidates from bad searches still have rows in the output file** (already written by CE). This is acceptable — bulk mode writes everything.

### Phase 4: Repeat

Loop: URL Extractor (5 URLs) → CE × 5 → check termination → next batch.

- Every 10 candidates: spawn Cleanup Agent
- After last candidate: final Cleanup
- Track `run_a_rated_count` and `run_total_count` after every verdict

### Pre-Flight Cleanup

Before processing ANY candidates, spawn a Cleanup Agent pass to ensure the output file is structurally sound before new rows are added.

---

## Search Strategy — Company-Targeted Mode (PRIMARY)

> **This is the PRIMARY search strategy.** Data shows company-targeted searches produce 61-90% A+B rates vs 6-8% for keyword searches. Always start here.

### Target Company List

**Tier 1 — Proven A-producers (search these FIRST):**
Read `tier1_companies` from the active JD file's Pipeline Config block.

**Tier 2 — Research-discovered (populated by Company Research Agent during the run):**
Starts empty. The Company Research Agent (see below) runs in parallel during Phase 0 and appends companies here. Check `Target_Companies/company_research.json` for updates before each new company search.

### Company-Targeted Search Execution

1. **Work through Tier 1 sequentially.** For each company:
   - Set LIR filters: Company = [company name], Title = [titles from `lir_title_filters` in JD config], Location = India, Hide previously viewed = 2 years
   - Spawn URL Extractor → CE loop as normal (Phase 1-2)
   - When SEARCH_EXHAUSTED for this company → move to next company
   - Track which companies have been searched in `company_search_log` (in-memory list)

2. **Interleave Tier 2 as results arrive.** When the Company Research Agent returns results (written to `Target_Companies/company_research.json`), add those companies to the queue. You do NOT need to finish all of Tier 1 first — if Tier 2 results arrive while you're mid-Tier-1, append them to the queue and continue in order.

3. **Fall back to keyword search ONLY when both tiers are exhausted** and termination targets are not met. Then use the Search Refinement Logic below.

### Why This Works

Read `a_rate_signals` from the active JD file's Pipeline Config for role-specific search strategy guidance. Company-targeted search guarantees hits on the two highest-weight dimensions (SaaS + Title). The only variance is in the lower-weight dimensions.

---

## Company Research Agent

> **This agent runs IN PARALLEL with candidate processing.** Spawn it during Phase 0 and don't wait for it. Its results feed Tier 2 of the target company list.

**Spawn Template:**
```
You are a company research agent. Your job is to find US-headquartered B2B SaaS companies with offices or significant employee presence in Gujarat, India (especially Ahmedabad, Vadodara, Gandhinagar, Surat, Rajkot).

**How to research:**
1. Open Chrome. Search LinkedIn using the `lir_title_filters` from the active JD config + Gujarat/Ahmedabad. Note which COMPANIES appear repeatedly.
2. Search Google for: "US SaaS companies Ahmedabad office", "SaaS companies Gujarat India", "US tech companies Vadodara"
3. Search Wellfound/AngelList for SaaS startups with India/Gujarat offices
4. Search G2/Capterra top SaaS companies, cross-reference with India office presence
5. Check Glassdoor for US SaaS companies hiring in Ahmedabad/Vadodara

**Already known (DO NOT include these):**
[Insert the `tier1_companies` list from the active JD file's Pipeline Config here]

**Output:** Write results to [FULL PATH]/Target_Companies/company_research.json in this format:
{
  "discovered_at": "YYYY-MM-DD HH:MM:SS",
  "companies": [
    {"name": "...", "hq": "...", "gujarat_city": "...", "confidence": "high/medium", "source": "where you found this"},
    ...
  ]
}

Aim for at least 10 new companies. Prioritize HIGH confidence (verified Gujarat office) over quantity.

**⛔ VALIDATION REQUIREMENTS — every company you include MUST have:**
1. **Verified US HQ** — you must find a source confirming the company is US-headquartered (LinkedIn company page HQ field, Crunchbase, or company website "About" page). Indian-HQ SaaS companies (Zoho, Freshworks pre-2018, etc.) do NOT count unless they have since re-domiciled to the US.
2. **Verified Gujarat presence** — at least ONE of: (a) LinkedIn shows employees with Gujarat/Ahmedabad/Vadodara in their location at this company, (b) Glassdoor/Indeed shows open roles in Gujarat, (c) company website lists a Gujarat office. "India office" alone is NOT enough — it could be Bangalore/Hyderabad/Pune.
3. **B2B SaaS confirmed** — the company must sell software to businesses, not consumers. Check G2, Capterra, or company website.

For each company, record the SPECIFIC evidence for all 3 checks in the "source" field. Example:
  "source": "US HQ per LinkedIn company page; 4 CSMs in Ahmedabad on LinkedIn; listed on G2 as B2B SaaS"

Companies with only MEDIUM confidence (e.g., "I think they have a Gujarat office but couldn't verify") should be marked as such and placed LAST in the list. The orchestrator will search HIGH confidence companies first.

Return ONLY: RESEARCH | {count} companies found ({high_count} high, {medium_count} medium)
```

**Rules:**
- Runs on `model: "sonnet"` — same as other sub-agents
- Spawned once during Phase 0, runs in parallel with Tier 1 company searches
- The orchestrator checks for `Target_Companies/company_research.json` existence before starting each new company search. If the file exists and has new companies, add them to the Tier 2 queue.
- If the research agent fails or returns 0 companies, log it and continue — Tier 1 alone is valuable
- Do NOT wait for this agent before starting Tier 1 searches

**⛔ Orchestrator Validation Before Queuing Tier 2 Companies:**
When reading `Target_Companies/company_research.json`, the orchestrator MUST:
1. Skip any company missing the `source` field or where `source` is vague (e.g., "found online")
2. Queue `high` confidence companies before `medium` confidence companies
3. If a company-targeted search returns 0 results after 2 pages, remove it from the queue — the Gujarat presence claim was likely wrong
4. Log every Tier 2 company searched and its yield to the per-run chat log: `COMPANY_SEARCH: {company} | {candidates_found} | {a_count}A {b_count}B`

---

## Search Refinement Logic (FALLBACK — after company-targeted searches are exhausted)

> **This section applies ONLY as a fallback** when all Tier 1 and Tier 2 company-targeted searches are exhausted AND termination targets are not met. Also applies when the source is a non-LinkedIn live search.

When a quality check fails (0/5 A-rated, or 0/15 A-rated), analyze the verdicts to identify patterns. Read `refinement_patterns` from the active JD file's Pipeline Config for role-specific pattern→fix mappings.

Apply refinements and spawn a **fresh URL Extractor** with the updated search. Keep iterating autonomously — do not stop to ask the user.

⛔ **FILTER FREEDOM RULE:** You may change ANY search filter (titles, keywords, experience, industry, company, seniority, etc.) to improve results. The ONLY constraint is **geography must stay within India**. Everything else is fair game — be aggressive with refinement. Don't just add negative keywords; consider changing title filters, broadening experience ranges, trying different industry combinations, or removing restrictive filters entirely.

**Search exhausted with few/no candidates?** This is the most common refinement trigger. When "hide previously viewed" filters out most results, the search is tapped — not the pipeline. Broaden keywords, remove restrictive filters, or try different title combinations. A search returning 3 candidates out of 26 (23 duplicates) is a clear signal to widen the net, not to stop.

---

## Handoff File

After the first 5 CEs (regardless of quality check result), write `Z_Search_Cache.json`:

**Path:** Same directory as the output xlsx

```json
{
  "status": "processing",
  "source": "<search URL, file path, or source description>",
  "started_at": "YYYY-MM-DD HH:MM:SS",
  "top5_summary": [
    {"name": "...", "tier": "...", "score_pct": "...", "verdict": "...", "company": "...", "raw_score": "...", "wrote_to_file": true},
    ...
  ],
  "a_rated_count": "<A-rated in first 5>",
  "total_candidates_in_search": "<number if known>",
  "run_parameters": {
    "a_rated_target": 20,
    "hard_cap": 60
  },
  "run_counters": {
    "run_a_rated_count": "<current>",
    "run_total_count": "<current>"
  },
  "notes": "top5_summary is the canonical record of initial scores — if a row is corrupted, use these scores instead of re-evaluating (re-eval introduces scoring variance)."
}
```

⛔ **MANDATORY: Overwrite `Z_Search_Cache.json` at the START of every new pipeline run.** The file must reflect the CURRENT run's data, not a previous run's. After the first 5 CEs, write the file with the current run's top5_summary. Then update `run_counters` after every cleanup pass.

**Why this matters:** The Cleanup Agent uses `top5_summary` to protect against scoring variance (re-eval can drift scores ~7%, enough to flip A→B). If the handoff file is stale from a previous run, candidates from the CURRENT run get no variance protection. A corrupted A-rated row would be re-evaluated by a fresh CE sub-agent, risking tier drift.

**Additional rule:** After every CE verdict that produces an A-rated candidate, append that candidate to a `a_rated_cache` array in the handoff file:

```json
"a_rated_cache": [
  {"name": "...", "tier": "A", "score_pct": "...", "verdict": "Strong Yes", "company": "...", "raw_score": "..."},
  ...
]
```

This extends scoring variance protection beyond just the first 5 candidates to ALL A-rated candidates in the run. The Cleanup Agent should check BOTH `top5_summary` AND `a_rated_cache` before spawning a re-evaluation CE sub-agent.

---

## Cleanup Agent Spawn Template

For pre-flight, periodic (every 10 candidates), and final cleanup passes:

```
You are a cleanup agent. Read your instructions at:
[FULL PATH to Output_Cleanup.md]

Validate and clean the output file at:
[FULL PATH to [output file from JD config]]

For scoring variance protection, check the handoff file at:
[FULL PATH to Z_Search_Cache.json]

If you need to re-evaluate broken rows, spawn Candidate Evaluator sub-agents using:
- Evaluation framework: [FULL PATH to [active JD file]]
- LinkedIn learnings: [FULL PATH to REF--LIR_Interface_Learnings.md]

Return ONLY: CLEANUP | Checked: {N} | Valid: {N} | Rescored: {N} | Re-evaluated: {N} | URLs filled: {N} | Names fixed: {N} | Stuck: {N} | Uncleaned: {N}
```

⛔ **CLEANUP GATE (applies to ALL cleanup passes — periodic AND final):** After the cleanup agent returns, check the `Uncleaned` field (ground truth — actual count of rows without Cleaned?=TRUE in the output file). For **periodic** passes, if `Uncleaned` > 0, log it and continue. For the **final** pass, this is a hard gate — see Pipeline Termination for the re-run rule. The pipeline CANNOT output a summary until the final cleanup returns `Uncleaned: 0`.

---

## Output Format

⛔ **All output is exclusively `.xlsx` format.** There is no CSV or Google Sheets step. Each JD file's `Pipeline Config` specifies an `output_file` pointing to an `.xlsx` file. CE sub-agents write rows directly to this xlsx file using openpyxl.

---

## Sub-Agent Error Recovery

If a **URL Extractor** sub-agent fails:
1. **Retry ONCE**: Spawn a fresh extractor with the same inputs.
2. **If retry also fails**: Log error, output warning. Something systemic may be wrong.

If a **Candidate Evaluator** sub-agent fails, times out, or returns malformed output:
1. **Retry ONCE**: Spawn a fresh sub-agent for that same candidate.
2. **If retry also fails**: Skip the candidate. Add to tally as `{Name or URL} | ERROR | 0% | Skipped — sub-agent failed twice | Unknown`. Do NOT write a row to the output file.
3. **Continue to next candidate.**
4. **If 3+ candidates fail in a row**, stop and output a warning — something systemic is wrong.

**Log ALL errors** to `Z_Pipeline_Error_Log.md` using the format defined in that file. Every error, timeout, malformed output, or unexpected behavior gets logged — no exceptions.

---

## Model Override Rule

**This agent (Pipeline Orchestrator) runs on Opus** — it inherits the parent session's model. Do not override.

**ALL sub-agents** (URL Extractor, Candidate Evaluator, Cleanup) spawn with `model: "sonnet"`. Sonnet executes fixed instructions — it's sufficient and ~5x cheaper than Opus.

---

## Pagination

URL Extractor handles pagination. The parent tracks:
- Current `page` number
- Current `start_pos` on that page

When an extractor returns `PAGE_EXHAUSTED`:
- Increment `page` by 1
- Set `start_pos` to 1
- Spawn next extractor for the new page

When an extractor returns `SEARCH_EXHAUSTED`:
- All pages of the CURRENT search are done
- **Check termination conditions first** — if 20 A-rated or 60 total reached, run final cleanup + output summary
- **If termination NOT met** — trigger a Quality Check (see Phase 3). If the source is a live search, refine and spawn a fresh URL Extractor with updated filters. The pipeline continues until termination is hit.
- **Only stop** if the source is static (PDF, spreadsheet) with no way to get more candidates, OR if refinement has been attempted and still yields no new non-duplicate candidates

---

## Anti-Detection Delays

⛔ **MANDATORY DELAY BETWEEN CANDIDATES (LinkedIn sources):** After each CE sub-agent returns its verdict, **wait a random delay of 45-200 seconds** before spawning the next sub-agent. Use `sleep $((RANDOM % 156 + 45))` or equivalent. Randomize each time — never the same gap twice in a row.

⛔ **Only ONE Chrome sub-agent active at a time.** Non-Chrome agents (Cleanup, Company Research, handoff updates) can run in parallel during anti-detection delays. Wait for each Chrome sub-agent to finish before spawning the next Chrome sub-agent.

No delay is needed between the URL Extractor returning and the first CE spawn (different activity type).

---

## Final Summary

After all candidates are processed (or termination condition hit), output:

```
## Pipeline Complete

Source: {source description}
This run: {run_total_count} candidates processed, {run_a_rated_count} A-rated
Stop reason: [all pages exhausted / A-rated target hit / hard cap hit / self-destruct]

This run's results:
  A (Strong Yes): {count}
  B (Yes):        {count}
  C (Maybe):      {count}
  D (No):         {count}
  F (Hard No):    {count}
  Errors/Skipped: {count}

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

**If ANY of the following conditions are detected, IMMEDIATELY stop all work and execute the shutdown procedure below:**

1. **Hard candidate cap reached** — 60 candidates processed this run. This is an absolute ceiling. Do NOT estimate remaining context. 60 is the safe maximum.

2. **Compaction detected** — Earlier context feels summarized, compressed, or fuzzy rather than precise.

3. **Canary token failed** — Every 10 candidates, recall the CANARY_TOKEN stored at startup. If recall fails or is wrong, stop immediately.

4. **Scoring quality drift** — Benefit-of-the-doubt scores that wouldn't have been given earlier.

### Canary Token Setup

At startup (immediately after confirming run parameters), generate a random 4-word phrase (e.g., "blue hammer quiet river") and store it in memory. Write it to the per-run chat log under the STARTUP event as `CANARY: [phrase]`. Every 10 candidates, pause and recall the phrase BEFORE looking at the chat log. If recall fails or is wrong, trigger self-destruct.

### Shutdown Procedure

**Step 1: Write `Context_Legacy_Prompt.md`** to the same directory as the output file. This file must contain a COMPLETE prompt that a brand new session with ZERO context can use to continue exactly where this session left off:

```markdown
# Resume Prompt — SwiftSku Candidate Pipeline

You are resuming a candidate evaluation pipeline that was interrupted. Follow these instructions exactly.

## Step 1: Read These Files (ONLY these — context budget is critical)

All files are in this directory: [FULL ABSOLUTE PATH TO THIS DIRECTORY]

**READ NOW:**
1. `2_Pipeline_Orchestrator.md` — your primary instructions
2. `REF--LIR_Interface_Learnings.md` — LinkedIn interface learnings (read before any LinkedIn interaction)
3. The active JD file's `Pipeline Config` block — for role-specific values

**Active JD file:** [EXACT FILENAME — e.g., JD--Acct_Mgr.md]

**PATHS ONLY — do NOT read into your context:**
- `URL_Extractor.md` → URL extractor sub-agents read from disk, you pass the path
- `[active JD file]` → CE sub-agents read from disk, you pass the path
- `Output_Cleanup.md` → cleanup sub-agents read from disk, you pass the path
- `[output file from JD config]` → sub-agents write here, you pass the path
- `Z_Chat_Log--Agent_Maker.md` → update at end of run only
- `Z_Pipeline_Error_Log.md` → log errors here, do NOT read past errors

## Step 2: Understand Where We Left Off

- **Source name:** [exact source name]
- **Source URL:** [exact source URL or file path]
- **Source type:** [LinkedIn Recruiter / LinkedIn Sales Navigator / Job Board / PDF / Spreadsheet / Other]
- **Total candidates in source:** [number if known, "unknown" if not]
- **Candidates processed this session:** [N]
- **Last candidate written to output file:** [Full Name]
- **Current page in source:** [page number]
- **Current position on page:** [position number]
- **Per-run chat log file:** [exact filename]
- **Reason for shutdown:** [hard cap 60 reached / compaction detected / canary token failed / quality drift detected]
- **Run parameters:** A-rated target = [N], Hard cap = [N]
- **Run counters (THIS RUN ONLY, not total output file):**
  - `run_a_rated_count` = [N]
  - `run_total_count` = [N]
- ⚠️ These counters are PER-RUN. Resume counting from these numbers, do NOT recount from the xlsx.

## Step 3: What To Do

1. You are the **parent orchestrator**. Follow `2_Pipeline_Orchestrator.md`.
2. ⚠️ **[IF LINKEDIN]: The source URL above is likely STALE** — LinkedIn Recruiter search URLs are session-bound and expire. Navigate to LinkedIn Recruiter home → project → re-run the search with the same filters.
3. [IF LINKEDIN]: The URL Extractor will re-verify mandatory filters (hide previously viewed = 2 years, recruiting activity = no messages + no projects).
4. Spawn a URL Extractor for page [N], position [POS].
5. The output file already has candidates. URL Extractor checks for duplicates. Continue processing from where the previous session stopped.
6. **Continue the per-run chat log** — find the file named above and append to it.
7. This file (Context_Legacy_Prompt.md) can be deleted after you've read it.

## Step 4: Self-Destruct Rule Still Applies

Generate a NEW canary token for this resumed session. If any self-destruct trigger fires, write a NEW Context_Legacy_Prompt.md and stop.
```

**Step 2: Output to chat.** Your ENTIRE chat output must be exactly this and NOTHING else:

```
Context_Legacy_Prompt.md has been saved. Copy this into a new session:
```

```
Read Context_Legacy_Prompt.md in [FULL ABSOLUTE PATH TO DIRECTORY] and follow it.
```

**Step 3: STOP. Do not process another candidate. Do not attempt to "finish just one more."**

---

## Per-Run Chat Log

**At the very start of every pipeline run**, create a run-specific chat log:

**Filename format:** `Z_Old_Chat_Logs/Chat_Log-<Source_Name>-<Date>-<Time>.md`
- `<Source_Name>` = Source column value, spaces → underscores
- `<Date>` = `YYYY-MM-DD`
- `<Time>` = `HHMM` in Eastern time
- **All per-run chat logs go in the `Z_Old_Chat_Logs/` subdirectory** — NOT the project root

**File header:**

```markdown
# Pipeline Run Log — [Source Name]

**Started:** [timestamp ET]
**Parameters:** A-rated target = [N], Hard cap = [N]
**Source URL:** [URL or path]
**Model:** Opus (parent) / Sonnet (all sub-agents)
**CANARY:** [your random 4-word phrase]

---
```

**Required event types to log:**
- `STARTUP` — parameters confirmed
- `URL_EXTRACT` — extractor returned N URLs from page X
- `CANDIDATE` — each CE verdict (name, tier, score%, company)
- `QUALITY CHECK` — after first 5, result + action
- `SEARCH REFINED` — what changed and why
- `CLEANUP` — cleanup agent triggered, results summary
- `ERROR` — any error (also log to Z_Pipeline_Error_Log.md)
- `CANARY CHECK` — every 10 candidates, recalled phrase + pass/fail
- `COMPACTION DETECTED` — if context compaction occurs
- `TERMINATION` — why the pipeline stopped
- `SUMMARY` — final run stats

---

## Context Window Management

⚠️ **Hard cap is 60 candidates per run. Every unnecessary byte reduces runway.**

The orchestrator's context should contain ONLY:

| Item | Size |
|------|------|
| Pipeline Starter | ~2KB |
| This file (Pipeline Orchestrator) | ~15KB |
| REF--LIR_Interface_Learnings.md | ~3KB |
| URL Extractor spawn/responses (12 calls × ~500 bytes) | ~6KB |
| CE spawn/responses (60 × ~100 bytes) | ~6KB |
| Cleanup spawn/responses (6 × ~500 bytes) | ~3KB |
| **Total at candidate 60** | **~35KB** |

**NEVER load these into your own context:**
- `URL_Extractor.md` — sub-agents read from disk
- `[active JD file]` — sub-agents read from disk
- `Output_Cleanup.md` — cleanup sub-agents read from disk
- `[output file from JD config]` — sub-agents handle all xlsx operations
- `Z_Chat_Log--Agent_Maker.md` — append at end of run only
- `Z_Pipeline_Error_Log.md` — append errors, don't read past ones

---

## What This Agent Does NOT Do

- Does NOT touch Chrome — ALL browser interaction is in sub-agents
- Does NOT evaluate candidates itself — CE sub-agents handle scoring
- Does NOT read candidate profiles — only sees one-line verdict summaries
- Does NOT create a new xlsx — always appends via CE sub-agents
- Does NOT retain candidate data between sub-agent invocations
