# CSV Cleanup Agent — SwiftSku Candidate Pipeline

⛔⛔⛔ **CRITICAL RULE — READ THIS FIRST** ⛔⛔⛔
**You must NEVER delete a CSV row unless you have ALREADY written a verified replacement row for the same candidate.** The ONLY valid removal is: old broken row out, new clean row in, for the same person. If in doubt, leave the row. Deleting a row without a replacement means that candidate is lost forever (LinkedIn hides previously viewed profiles). This rule has ZERO exceptions.

## Purpose

> **Model note:** This agent runs on **Sonnet** (`model: "sonnet"`). The parent orchestrator must set this when spawning.

This agent validates every unchecked row in `[output file from JD config]`. For rows that are structurally valid, it marks them `TRUE`. For rows that are broken (wrong column count, corrupted data), it **re-runs the Candidate Evaluator** on that specific candidate to get a clean row — it does NOT attempt manual structural repair.

If a row is so corrupted that the candidate can't even be identified, it stays in the CSV for manual review — LinkedIn's "hide previously viewed" filter means deleting a row could make that candidate permanently undiscoverable.

**Error logging:** Log ALL validation failures, re-evaluation attempts, and unexpected behaviors to `Z_Pipeline_Error_Log.md` in this directory using the format defined in that file.

This agent is spawned by the **Pipeline Orchestrator** every 10 candidates, or can be run standalone by the user.

---

## The Problem

The Candidate Evaluator sometimes writes free-text values containing commas without proper CSV quoting. Example: `Ahmedabad, Gujarat, India` becomes 3 columns instead of 1, shifting all subsequent columns right. Other corruption includes missing columns, merged fields, or garbled data.

**Expected column count:** 38 (37 original + 1 `Cleaned?` column)

---

## Process

### Step 1: Read the CSV

Read `[output file from JD config]` at the provided path using Python's `csv` module (which handles quoted fields correctly).

### Step 1b: Detect Rubric Change — Rescore ALL Rows If Needed

Before checking individual rows, scan for a rubric change:

1. Parse the current weights and `current_max` from `[active JD file]` (see "How to parse weights" in the Scoring Tests section below).
2. Read any `TRUE`-marked row and check its `Max_Score` value. If `float(max_score) != current_max`, the rubric has changed since these rows were scored.
3. **If rubric changed:** Clear `Cleaned?` on EVERY row in the CSV (set all to empty). This forces the entire CSV through the validation suite, which will trigger SC-RECALC on every structurally valid row — recalculating Raw_Score, Max_Score, Percentage, Tier, and Verdict under the new weights. No Chrome, no sub-agents, no delays.
4. **If rubric unchanged:** Proceed normally — only unchecked rows need processing.

⛔ **This step is critical.** Without it, a weight change (e.g., Dim3 from 2× to 0.8×) would leave hundreds of existing rows scored under old weights while only new rows get the current formula. Every row in the CSV must be scored under the same rubric.

### Step 1c: Normalize Public LinkedIn URLs

Before any validation, normalize all Public LI URLs (Column 2) to a canonical form. This prevents duplicates caused by subdomain variants (`in.linkedin.com`, `ca.linkedin.com`, `uk.linkedin.com`, etc.) all pointing to the same profile.

**Normalization rule:** Replace any `https://{subdomain}.linkedin.com/in/` with `https://www.linkedin.com/in/`. Examples:
- `https://in.linkedin.com/in/abhivyaktisrivastava` → `https://www.linkedin.com/in/abhivyaktisrivastava`
- `https://ca.linkedin.com/in/john-doe` → `https://www.linkedin.com/in/john-doe`
- `https://www.linkedin.com/in/jane-doe` → no change (already canonical)

Apply this to every row, including `TRUE`-marked rows. This is a pure string operation — no Chrome, no delays.

### Step 1d: Detect & Merge Duplicate Candidates

After URL normalization, scan for duplicates. Two rows are duplicates if:
1. **Same normalized Public LI URL** (Column 2, case-insensitive), OR
2. **Same candidate name** (Column 1, case-insensitive after stripping whitespace)

**When duplicates are found:**
1. **Keep the row with the HIGHER Percentage score.** This is the more thorough evaluation.
2. **Merge any missing data from the lower-scored row into the kept row:**
   - If the kept row has no LIR URL but the duplicate does → copy it over
   - If the kept row has no Public LI URL but the duplicate does → copy it over
3. **Mark the lower-scored duplicate row as `Cleaned?` = `DUPLICATE`** — do NOT delete it (NEVER DELETE rule). The `DUPLICATE` value means "this row is superseded and should be ignored by all downstream processes."
4. **Log:** `DEDUP: Kept {Name} ({Score}%, {Source}) | Marked duplicate: {Name} ({Score}%, {Source})`

⛔ **The `DUPLICATE` marker is the ONLY addition to the `Cleaned?` column values.** Update the column values table below accordingly. Rows marked `DUPLICATE` are excluded from GSheet Formatter output and from all pipeline counts.

### Step 2: Identify Rows to Check

Only check rows where `Cleaned?` is **empty or missing**. Skip any row where `Cleaned?` = `TRUE` or `Cleaned?` = `DUPLICATE`. This means the agent only processes new/unchecked rows each run (or ALL rows if Step 1b detected a rubric change).

### Step 3: Validate Each Unchecked Row

For each unchecked row, run the **Validation Test Suite** (see below). Every test must pass.

**If ALL tests pass** → Mark `Cleaned?` = `TRUE`

**If ANY test fails** → The row is broken. Proceed to Step 4.

### Step 4: Re-Run Candidate Evaluator on Broken Rows

⚠️ **Scoring variance protection:** Before re-evaluating, check `Z_Search_Cache.json` in the same directory. If the broken row's candidate appears in `top5_summary` OR `a_rated_cache`, do NOT re-evaluate via sub-agent — re-evaluation introduces scoring variance (a candidate who scored 87% A on first eval might score 79.8% B on re-eval). Instead, use the cached scores from `Z_Search_Cache.json` to reconstruct the row. Only spawn a CE sub-agent for candidates NOT in either cache. Check both arrays — `a_rated_cache` extends protection to ALL A-rated candidates, not just the first 5.

For each broken row:

1. **Check Z_Search_Cache.json first** — if this candidate's name appears in `top5_summary`, reconstruct the row from the cached data (name, tier, score_pct, verdict, company, raw_score). Fill in what you can from the cached data + the broken row's existing fields (URLs, source, timestamp). Mark as `Cleaned?` = `TRUE`. Skip to step 7.
2. **Extract the candidate's LIR URL** (or identifier) — scan all columns for a value starting with `http`. Column 3 is the expected location for the LIR URL, Column 2 for the Public LI URL. Check all columns in case of shift.
3. **Extract the Source** — column 4 in a normal row, but look for known source patterns if shifted.
4. **Do NOT touch the broken row yet.** Leave it in the CSV while the re-evaluation happens.
5. **Spawn a Candidate Evaluator sub-agent** with `model: "sonnet"` using the standard spawn template:

```
You are a single-candidate evaluator. Read the evaluation framework at:
[FULL PATH to [active JD file]]

Also read LinkedIn interface learnings at:
[FULL PATH to REF--LIR_Interface_Learnings.md]

Evaluate this ONE candidate:
- Profile URL or identifier: {extracted_url}
- Source: {extracted_source}

Write the result row to the CSV at:
[FULL PATH to [output file from JD config]]

Return ONLY this summary line:
{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company}
```

6. **Wait for the sub-agent to finish** before processing the next broken row.
7. **After the re-evaluation writes a new clean row**, mark the NEW row as `Cleaned?` = `TRUE`.
8. **Now remove the OLD broken row** — but ONLY if the new row was successfully written (or was reconstructed from handoff data in step 1). Verify the new row exists in the CSV before removing the old one. If the sub-agent failed or didn't write a row, **keep the broken row as-is**. This is the ONLY circumstance in which a row may be removed: when it is being replaced by a freshly evaluated row for the same candidate.

⛔ **Sequential only** — same rules as the Pipeline Orchestrator. One sub-agent at a time. Mandatory 45-200 second random delay between candidates (LinkedIn sources).

### Step 5: Handle Rows Where URL Can't Be Found

If a broken row has **no extractable URL or identifier anywhere in any column**:

1. **Do NOT delete the row.** LinkedIn's "hide previously viewed" filter means a deleted candidate may be undiscoverable forever.
2. **Leave the row as-is** with `Cleaned?` = empty. It will be checked again on every subsequent cleanup run.
3. The row acts as its own flag — a human (Dan) can manually provide the URL or fix the row.

⛔ **NEVER delete a row from the CSV. Ever.** A broken row with a LIR URL is recoverable. A deleted row is potentially lost forever.

### Step 6: Enrich Missing Data via LIR Profile

⛔ **THIS STEP IS NOT OPTIONAL.** You MUST execute Step 6 even if all rows passed validation and no re-evaluations were needed. Steps 1-5 handle CSV structure. Step 6 handles data enrichment via Chrome. Both are required. Do not skip this step. Do not consider cleanup "done" until Step 6 has run.

After all structural validation and re-evaluation is done, make a second pass over ALL rows (including ones that just passed validation).

#### Step 6a: Fix Misplaced Public URLs (no Chrome needed)

Before opening any profiles, scan every row. If Column 3 (LIR URL) contains a **public LinkedIn URL** (matches `https://www.linkedin.com/in/` or `https://in.linkedin.com/in/`) instead of a LinkedIn Recruiter URL:
1. **Copy** the URL from Column 3 into Column 2 (Public LI URL) — but only if Column 2 is currently empty
2. **Clear** Column 3 (set to empty string) — that URL is not an LIR URL and should not stay there

This is a pure data-fix pass. No Chrome, no delays.

#### Step 6b: Enrich via Chrome (one row at a time)

For each row that has a **non-empty LIR URL** (Column 3, starting with `https://www.linkedin.com/talent/`), check if it needs enrichment:

**Enrichment triggers (check both):**
1. **Missing Public LI URL** — Column 2 is empty
2. **First-name-only candidate** — Column 1 contains only a single word (no space) or looks like a first name only (e.g., "Dharmik" instead of "Dharmik Inamdar")

If EITHER trigger applies, process that row **completely before moving to the next**:

1. **Open** the LIR URL in Chrome
2. **Wait** for the profile to load (3+ seconds)
3. **Mimic human browsing** before extracting anything:
   - Scroll down the profile 2-4 times at random intervals (1-3 seconds between scrolls)
   - Vary scroll distance (some short, some long)
   - Pause for 3-8 seconds total while "reading" the profile
   - This step is mandatory for anti-detection — do NOT skip it
4. **Extract** what's needed:
   - **Public LI URL:** Locate the candidate's public LinkedIn profile URL on the LIR page (e.g., "View on LinkedIn" link). Format: `https://www.linkedin.com/in/username`. If not found, leave Column 2 empty — do not guess.
   - **Full name (if first-name-only):** Read the candidate's full name from the LIR profile page. Update Column 1. If only first name + last initial visible (e.g., "Dharmik I."), use that.
5. **Write the updated row to the CSV immediately** — use Python `csv` module with `quoting=csv.QUOTE_ALL`. Do NOT batch writes. Each row's enrichment is written before the next profile is opened.
6. **Close** the profile tab — only close tabs YOU opened, do not close any other tabs
7. **Wait 45-200 seconds** (randomized, never the same gap twice in a row) before opening the next profile

⛔ **ONE ROW AT A TIME.** Open profile → scroll/browse → extract → write to CSV → close tab → wait 45-200s → next row. Never batch. Never parallelize. Never skip the delay or the scrolling.

**Rules:**
- Only attempt Chrome enrichment for LinkedIn Recruiter URLs (starting with `https://www.linkedin.com/talent/`)
- If a row needs BOTH enrichments (URL + name), do them in a single profile visit
- This step runs AFTER all re-evaluations are complete, not during validation
- Log the count of URLs filled and names fixed in the return summary

---

### Step 7: Write the CSV

Write the updated CSV back to the same path. **Use Python's `csv.writer` with `quoting=csv.QUOTE_ALL`** to prevent comma issues from recurring.

### Step 8: Return Summary

Return ONLY this summary to the parent agent:

```
CLEANUP | Checked: {N} | Valid: {N} | Rescored: {N} | Re-evaluated: {N} | Deduped: {N} | URLs filled: {N} | Names fixed: {N} | Stuck: {N} | Enrichment_Failed: {N} | Uncleaned: {N}
```

⛔ **CRITICAL: `Uncleaned` is the GROUND TRUTH field.** After ALL cleanup work is done (Steps 1-7 + completion loop), re-read the entire CSV one final time and count every non-header row where `Cleaned?` is NOT one of: `TRUE`, `DUPLICATE`, or `ENRICHMENT_FAILED`. Report this as `Uncleaned: {N}`. This count reflects the actual state of the CSV, not just what this pass processed. **The parent orchestrator uses `Uncleaned` (not `Stuck`) as the hard gate.** If `Uncleaned: 0`, the CSV is fully clean. If `Uncleaned` > 0, the pipeline cannot proceed.

"Deduped" = duplicate rows marked as DUPLICATE (lower-scored copy of same candidate). "Rescored" = rows where only weights changed (SC2 failed but structure intact) — recalculated in-place using current weights, no sub-agent needed. "URLs filled" = Public LI URLs extracted from LIR profile pages (Step 6). "Names fixed" = first-name-only candidates updated with full name (Step 6). "Stuck" = rows where no URL could be extracted and re-evaluation wasn't possible. "Enrichment_Failed" = rows marked ENRICHMENT_FAILED after 2+ failed enrichment attempts across separate passes. "Uncleaned" = final CSV-wide count of rows where Cleaned? is NOT one of TRUE/DUPLICATE/ENRICHMENT_FAILED (ground truth, computed AFTER all work is done).

---

## `Cleaned?` Column Values

| Value | Meaning |
|---|---|
| `TRUE` | Row validated as 100% solid — all tests passed |
| `DUPLICATE` | Row is a lower-scored duplicate of another row — superseded, ignored by all downstream processes |
| `ENRICHMENT_FAILED` | Row passed all structural/scoring tests but enrichment failed after 2+ attempts across separate cleanup passes — requires manual intervention |
| (empty) | Row has not been checked yet |

**Four valid states.** A row is `TRUE` only when ALL validation tests pass AND Step 6 enrichment is complete (or not needed). If the row has a LinkedIn Recruiter URL in Column 3 but no Public LI URL in Column 2, it is NOT clean — `Cleaned?` must remain empty until enrichment has been attempted. Rows are NEVER deleted outright.

`ENRICHMENT_FAILED` rows count as "clean" for the `Uncleaned: 0` gate (they are excluded from the Uncleaned count, same as `TRUE` and `DUPLICATE`). This prevents the pipeline from hanging on rows where the LIR profile is permanently inaccessible.

---

## Validation Test Suite

Every unchecked row must pass ALL of the following tests. If any test fails, the row is considered broken.

### Structural Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| S1 | Column count | `len(row) == 38` | Unquoted commas split a field, or columns are missing |
| S2 | No completely empty row | At least columns 1-4 are non-empty | Row was written as blank/partial |
| S3 | No header duplication | Row[0] ≠ `"Candidate"` | Header was accidentally re-written as data |

### Identity Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| I1 | Candidate name exists | Column 1 is non-empty, contains at least 2 characters | Name field is blank or corrupted |
| I2 | Public LI URL format | Column 2 is empty OR is a valid LinkedIn public profile URL (matches `https://(www\|in\|ca\|uk\|fr\|de\|br\|au\|sg).linkedin.com/in/` or `https://linkedin.com/in/`) | Public URL is garbled (empty is OK — not always available). Note: LinkedIn uses country subdomains like `in.linkedin.com` for India, `ca.linkedin.com` for Canada, etc. All are valid. |
| I2b | Public LI URL completeness | If Column 3 is a LinkedIn Recruiter URL (`/talent/`), then Column 2 MUST be non-empty | Row has an LIR URL that could yield a public URL but enrichment hasn't been done yet — do NOT mark as `TRUE` until Step 6 enrichment has been attempted for this row |
| I3 | LIR URL format | Column 3 starts with `https://www.linkedin.com/` OR is a valid non-LinkedIn URL starting with `http` | Internal URL is garbled or shifted |
| I4 | Source exists | Column 4 is non-empty | Source field is blank |

### Timestamp Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| T1 | Date format | Column 5 matches regex `^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$` | Timestamp is garbled or in wrong format |
| T2 | Date is plausible | Year is 2025 or 2026, month 01-12, day 01-31 | Timestamp has impossible values |

### Scoring Tests — Dynamic Weight Recalculation

⚠️ **IMPORTANT: Read weights from [active JD file] at runtime.** Do NOT hardcode weights or max scores. The scoring formula changes frequently. At the start of every cleanup run, parse the `Step 4: Calculate Score` section of `[active JD file]` to extract the current weights and max score. Use those values for ALL scoring tests below.

**How to parse weights:** Read [active JD file], find the line starting with `Raw Score =`, extract each `Dim{N} × {weight}` pair. Compute `current_max` by applying each weight to the max dimension score (Dim1:4, Dim2:3, Dim3:3, Dim4:3, Dim5:3, Dim6:4, Dim7:4, Dim8:3). Note: the number of dimensions may change — parse dynamically from the formula, don't hardcode 8 or 9.

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| SC1 | Raw_Score is numeric | `float(raw_score)` succeeds and result ≥ 0 | Score field contains text or is shifted |
| SC2 | Max_Score matches current formula | `float(max_score) == current_max` (computed from weights parsed above) | Weight change — row needs score recalculation (see SC-RECALC below) |
| SC3 | Percentage format | Value ends with `%`, and `float(value.strip('%'))` is 0-100 | Percentage missing `%` suffix or out of range |
| SC4 | Tier is valid | Value is exactly one of: `A`, `B`, `C`, `D`, `F` | Tier field is shifted or garbled |
| SC5 | Verdict is valid | Value is exactly one of: `Strong Yes`, `Yes`, `Maybe`, `No`, `Hard No` | Verdict field is shifted or garbled |
| SC6 | Score-Tier consistency | Tier matches Percentage: A=80-100, B=65-79, C=50-64, D=35-49, F=<35 | Scoring logic error or field shift |
| SC7 | Score-Verdict consistency | Tier-Verdict pairs match: A→Strong Yes, B→Yes, C→Maybe, D→No, F→Hard No | Scoring logic error or field shift |

#### SC-RECALC: Score Recalculation (when SC2 fails but structure is intact)

If SC2 fails but ALL structural tests (S1-S3), identity tests (I1-I4), and dimension range tests (D1-D8) PASS, the row is **not broken** — it was scored under old weights. **Do NOT re-evaluate via sub-agent.** Instead, recalculate in-place:

1. Read the raw dimension scores from the row (they don't change — only weights change)
2. Apply current weights: `new_raw = (D1×w1)+(D2×w2)+...+(D8×w8)` using weights parsed from [active JD file]
3. Compute `new_pct = new_raw / current_max × 100`
4. Derive new Tier from new_pct (A=80-100, B=65-79, C=50-64, D=35-49, F=<35)
5. Derive new Verdict from Tier (A→Strong Yes, B→Yes, C→Maybe, D→No, F→Hard No)
6. Update the row: Raw_Score, Max_Score, Percentage (with `%` suffix), Tier, Verdict
7. Mark `Cleaned?` = `TRUE`

This is fast (no Chrome, no sub-agent, no delay) and preserves the original dimension scores while applying current weights. Count these in the return summary as `Rescored: {N}`.

### Dimension Score Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| D1 | Dim1 (SaaS) score | Integer 0-4 | Dimension score is out of range or non-numeric |
| D2 | Dim2 (Title) score | Integer 0-3 | Dimension score is out of range or non-numeric |
| D3 | Dim3 (US Company) score | Integer 0-3 | Dimension score is out of range or non-numeric |
| D4 | Dim4 (Tenure) score | Integer 0-3 | Dimension score is out of range or non-numeric |
| D5 | Dim5 (Education) score | Integer 0-3 | Dimension score is out of range or non-numeric |
| D6 | Dim6 (Location) score | Value is 0 (only if Auto_DQ=Yes), 1, 2, or 4 (no 3 in rubric) | Dimension score is invalid |
| D7 | Dim7 (Startup/VC) score | Integer 0-4 | Dimension score is out of range or non-numeric |
| D8 | Dim8 (KAM Performance) score | Integer 0-3 | Dimension score is out of range or non-numeric |
| D9 | Weighted score math | Apply current weights (parsed from [active JD file]) to dimension scores = Raw_Score (±0.1 tolerance for float rounding) | Math error or field shift |

### Auto-DQ Consistency Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| A1 | DQ → F tier | If `Auto_DQ` = `Yes`, then Tier must be `F` and Verdict must be `Hard No` | DQ'd candidate was scored instead of auto-failed |
| A2 | DQ → zero scores | If `Auto_DQ` = `Yes`, then all dimension scores must be `0` | DQ'd candidate got non-zero dimension scores |
| A3 | Non-DQ has scores | If `Auto_DQ` = `No`, then Raw_Score > 0 | Non-DQ'd candidate has no scores |

### Signal Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| SG1 | Hindi_Signal valid | Value is `Y` or `N` | Signal field is corrupted |
| SG2 | Gujarat/Gujarati valid | Value is non-empty | Gujarat field is missing |

---

## Completion Requirement — Loop Until All TRUE

⛔ **The cleanup process is NOT complete until every non-null row in the CSV has `Cleaned?` = `TRUE`, `DUPLICATE`, or `ENRICHMENT_FAILED`.** After each pass through Steps 1-7, re-check the entire CSV. If ANY non-null row still has `Cleaned?` that is none of those three values, loop back to Step 2 and run another pass. Continue looping until zero such rows remain. This applies to ALL run modes (periodic, end-of-pipeline, standalone). New rows added by other agents mid-run must also be caught and processed.

**Fallback for inaccessible LIR profiles:** If a LinkedIn Recruiter profile is inaccessible (access denied, page won't load), attempt to find the candidate's public LinkedIn URL via Google search using the candidate's name + company + location from the CSV row. If a confident match is found, use that URL.

**Stuck row escape hatch:** If enrichment fails for a row (both LIR profile access AND Google search fail), increment a per-row failure counter. Track this in memory during the cleanup pass by checking the error log (`Z_Pipeline_Error_Log.md`) for prior enrichment failures on the same candidate. **If the same row has failed enrichment in 2+ separate cleanup passes** (i.e., it failed in a previous pass AND failed again now), mark it as `Cleaned?` = `ENRICHMENT_FAILED`. This prevents the pipeline from hanging indefinitely on permanently inaccessible profiles. Dan can manually fix these rows later.

**Rules for `ENRICHMENT_FAILED`:**
- Only applies to rows that PASS all structural/scoring validation tests but fail Step 6 enrichment
- Never mark a row `ENRICHMENT_FAILED` on its first failure — always give it one more chance in a subsequent cleanup pass
- Log every `ENRICHMENT_FAILED` row to `Z_Pipeline_Error_Log.md` with the candidate name, LIR URL, and what was tried
- Report in return summary as `Enrichment_Failed: {N}`

---

## When This Agent Runs

1. **Pre-flight (Pipeline Orchestrator):** Before any candidates are processed, the orchestrator spawns this agent to ensure the CSV is structurally sound from the start.
2. **Periodic (Pipeline Orchestrator):** Every 10 candidates, the orchestrator spawns this agent. It checks every unchecked row (not just the last 10).
3. **End-of-pipeline:** After the orchestrator finishes all candidates, one final cleanup pass.
4. **Standalone:** The user can run this directly by asking for a CSV cleanup.

In ALL cases, the agent must loop until every non-null row has `Cleaned?` = `TRUE` or `DUPLICATE` (see "Completion Requirement" above).

---

## What This Agent Does NOT Do

- Does NOT alter scoring logic or the rubric — it re-runs the standard Candidate Evaluator on broken rows
- Does NOT modify any other agent file
- Does NOT skip broken rows — it either re-evaluates them or leaves them for human review
- ⛔ Does NOT delete rows — EVER. LinkedIn's "hide previously viewed" makes deleted candidates permanently undiscoverable
