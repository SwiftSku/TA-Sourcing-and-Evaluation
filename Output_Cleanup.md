# Cleanup Agent — SwiftSku Candidate Pipeline

⛔⛔⛔ **CRITICAL RULE — READ THIS FIRST** ⛔⛔⛔
**You must NEVER delete a row unless you have ALREADY written a verified replacement row for the same candidate.** The ONLY valid removal is: old broken row out, new clean row in, for the same person. If in doubt, leave the row. Deleting a row without a replacement means that candidate is lost forever (LinkedIn hides previously viewed profiles). This rule has ZERO exceptions.

## Purpose

> **Model note:** This agent runs on **Sonnet** (`model: "sonnet"`). The parent orchestrator must set this when spawning.

This agent validates every unchecked row in `[output file from JD config]`. For rows that are structurally valid, it marks them `TRUE`. For rows that are broken (wrong column count, corrupted data), it **re-runs the Candidate Evaluator** on that specific candidate to get a clean row — it does NOT attempt manual structural repair.

If a row is so corrupted that the candidate can't even be identified, it stays in the output file for manual review — LinkedIn's "hide previously viewed" filter means deleting a row could make that candidate permanently undiscoverable.

**Error logging:** Log ALL validation failures, re-evaluation attempts, and unexpected behaviors to `Z_Pipeline_Error_Log.md` in this directory using the format defined in that file.

This agent is spawned by the **Pipeline Orchestrator** every 10 candidates, or can be run standalone by the user.

---

## The Problem

The Candidate Evaluator sometimes writes malformed data — missing columns, merged fields, or garbled data. Other corruption includes wrong column count or shifted fields.

**Expected column count:** Read from the active JD file's column schema. Count the numbered columns in the "Column order" block. Do NOT hardcode — column counts change when dimensions are added/removed.

---

## Process

### Step 1: Read the Output File

Read `[output file from JD config]` at the provided path using Python's `openpyxl` module.

### Step 1b: Detect Rubric Change — Rescore ALL Rows If Needed

Before checking individual rows, scan for a rubric change:

1. Parse the current weights and `current_max` from `[active JD file]` (see "How to parse weights and current_max" in the Scoring Tests section below). Read `current_max` directly from the JD's Step 4 `Max possible` line — do NOT compute it.
2. Read any `TRUE`-marked row and check its `Max_Score` value. If `float(max_score) != current_max`, the rubric has changed since these rows were scored.
3. **If rubric changed:** Clear `Cleaned?` on EVERY row in the output file (set all to empty). This forces the entire file through the validation suite, which will trigger SC-RECALC on every structurally valid row — recalculating all score columns (Base_Score and bonus columns if the role has them, plus Raw_Score, Max_Score, Percentage, Tier, and Verdict) under the new weights. No Chrome, no sub-agents, no delays.
4. **If rubric unchanged:** Proceed normally — only unchecked rows need processing.

⛔ **This step is critical.** Without it, a weight change (e.g., Dim3 from 2× to 0.8×) would leave hundreds of existing rows scored under old weights while only new rows get the current formula. Every row in the output file must be scored under the same rubric.

### Step 1c: Normalize Public LinkedIn URLs

Before any validation, normalize all Public LI URLs (Column 3) to a canonical form. This prevents duplicates caused by subdomain variants (`in.linkedin.com`, `ca.linkedin.com`, `uk.linkedin.com`, etc.) all pointing to the same profile.

**Normalization rule:** Replace any `https://{subdomain}.linkedin.com/in/` with `https://www.linkedin.com/in/`. Examples:
- `https://in.linkedin.com/in/abhivyaktisrivastava` → `https://www.linkedin.com/in/abhivyaktisrivastava`
- `https://ca.linkedin.com/in/john-doe` → `https://www.linkedin.com/in/john-doe`
- `https://www.linkedin.com/in/jane-doe` → no change (already canonical)

Apply this to every row, including `TRUE`-marked rows. This is a pure string operation — no Chrome, no delays.

### Step 1d: Detect & Merge Duplicate Candidates

After URL normalization, scan for duplicates. Two rows are duplicates if:
1. **Same normalized Public LI URL** (Column 3, case-insensitive), OR
2. **Same candidate name** (Column 1, case-insensitive after stripping whitespace)

**When duplicates are found:**
1. **Keep the row with the HIGHER Percentage score.** This is the more thorough evaluation.
2. **Merge any missing data from the lower-scored row into the kept row:**
   - If the kept row has no LIR URL but the duplicate does → copy it over
   - If the kept row has no Public LI URL but the duplicate does → copy it over
3. **Mark the lower-scored duplicate row as `Cleaned?` = `DUPLICATE`** — do NOT delete it (NEVER DELETE rule). The `DUPLICATE` value means "this row is superseded and should be ignored by all downstream processes."
4. **Log:** `DEDUP: Kept {Name} ({Score}%) | Marked duplicate: {Name} ({Score}%)` — include Source if the role has a Source column, omit if not

⛔ **The `DUPLICATE` marker is the ONLY addition to the `Cleaned?` column values.** Update the column values table below accordingly. Rows marked `DUPLICATE` are excluded from all pipeline counts.

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
2. **Extract the candidate's LIR URL** (or identifier) — scan all columns for a value starting with `http`. Column 4 is the expected location for the LIR URL, Column 3 for the Public LI URL. Check all columns in case of shift.
3. **Extract the Source** (AM only — RC has no Source column). For AM, column 5 is Source. Look for known source patterns (`LinkedIn Recruiter`, `Greenhouse`, etc.) — if shifted, scan other columns. For RC, skip this step (Source is not used).
4. **Do NOT touch the broken row yet.** Leave it in the output file while the re-evaluation happens.
5. **Spawn a Candidate Evaluator sub-agent** with `model: "sonnet"` using the template in `CE_Spawn_Template.md`. Fill in all parameters per that file's "Cleanup Agent (Step 4)" section. Key inputs:
   - `PROFILE_URL` = extracted from the broken row
   - `SOURCE_NAME` = extracted from the broken row (empty string if the role has no Source column)
   - `DELAY_SECONDS` = random 45-200 (generate here, never same twice in a row)
   - `NEXT_URL` = empty (cleanup processes one at a time)

6. **Wait for the sub-agent to finish** before processing the next broken row.
7. **After the re-evaluation writes a new clean row**, mark the NEW row as `Cleaned?` = `TRUE`.
8. **Now remove the OLD broken row** — but ONLY if the new row was successfully written (or was reconstructed from handoff data in step 1). Verify the new row exists in the output file before removing the old one. If the sub-agent failed or didn't write a row, **keep the broken row as-is**. This is the ONLY circumstance in which a row may be removed: when it is being replaced by a freshly evaluated row for the same candidate.

⛔ **Sequential only** — one sub-agent at a time. Anti-detection delays per `REF--Anti_Detection.md` §4 (LinkedIn sources).

### Step 5: Handle Rows Where URL Can't Be Found

If a broken row has **no extractable URL or identifier anywhere in any column**:

1. **Do NOT delete the row.** LinkedIn's "hide previously viewed" filter means a deleted candidate may be undiscoverable forever.
2. **Leave the row as-is** with `Cleaned?` = empty. It will be checked again on every subsequent cleanup run.
3. The row acts as its own flag — a human (Dan) can manually provide the URL or fix the row.

⛔ **NEVER delete a row from the output file. Ever.** A broken row with a LIR URL is recoverable. A deleted row is potentially lost forever.

### Step 6: Enrich Missing Data via LIR Profile

⛔ **THIS STEP IS NOT OPTIONAL.** You MUST execute Step 6 even if all rows passed validation and no re-evaluations were needed. Steps 1-5 handle file structure. Step 6 handles data enrichment via Chrome. Both are required. Do not skip this step. Do not consider cleanup "done" until Step 6 has run.

After all structural validation and re-evaluation is done, make a second pass over ALL rows (including ones that just passed validation).

#### Step 6a: Fix Misplaced Public URLs (no Chrome needed)

Before opening any profiles, scan every row. If Column 4 (LIR URL) contains a **public LinkedIn URL** (matches `https://www.linkedin.com/in/` or `https://in.linkedin.com/in/`) instead of a LinkedIn Recruiter URL:
1. **Copy** the URL from Column 4 into Column 3 (Public LI URL) — but only if Column 3 is currently empty
2. **Clear** Column 4 (set to empty string) — that URL is not an LIR URL and should not stay there

This is a pure data-fix pass. No Chrome, no delays.

#### Step 6b: Enrich via Chrome (one row at a time)

> **📄 Read `REF--Anti_Detection.md` for all anti-detection rules.** Key sections for Cleanup enrichment: **§1** (profile browsing), **§4** (inter-profile delay), **§5** (tab hygiene — close each tab after processing).

For each row that has a **non-empty LIR URL** (Column 4, starting with `https://www.linkedin.com/talent/`), check if it needs enrichment:

**Enrichment triggers (check both):**
1. **Missing Public LI URL** — Column 3 is empty
2. **First-name-only candidate** — Column 1 contains only a single word (no space) or looks like a first name only (e.g., "Dharmik" instead of "Dharmik Inamdar")

If EITHER trigger applies, process that row **completely before moving to the next**:

1. **Open** the LIR URL in Chrome
2. **Wait** for the profile to load (3+ seconds)
3. **Anti-detection browsing** per `REF--Anti_Detection.md` §1 — dwell, scroll, highlight before extracting
4. **Extract** what's needed:
   - **Public LI URL:** Locate the "Public profile" link on the LIR page (near the candidate's name/photo area). Read the `href` — format: `https://www.linkedin.com/in/{slug}`. ⛔ **NEVER guess or construct a URL from the candidate's name.** If the link is not present, leave Column 3 empty. After extracting, run the I2c slug-name sanity check: at least one word from the candidate's name must appear in the URL slug. If it doesn't match, the link may point to a different person — discard it and leave Column 3 empty.
   - **Full name (if first-name-only):** Read the candidate's full name from the LIR profile page. Update Column 1. If only first name + last initial visible (e.g., "Dharmik I."), use that.
5. **Write the updated row to the xlsx immediately** — use Python `openpyxl`. Do NOT batch writes. Each row's enrichment is written before the next profile is opened.
6. **Close** the profile tab — only close tabs YOU opened
7. **Wait 45-200 seconds** per `REF--Anti_Detection.md` §4 before opening the next profile

⛔ **ONE ROW AT A TIME.** Open profile → browse → extract → write → close tab → wait → next row. Never batch. Never parallelize.

**Rules:**
- Only attempt Chrome enrichment for LinkedIn Recruiter URLs (starting with `https://www.linkedin.com/talent/`)
- If a row needs BOTH enrichments (URL + name), do them in a single profile visit
- This step runs AFTER all re-evaluations are complete, not during validation
- Log the count of URLs filled and names fixed in the return summary

---

### Step 7: Write the Output File

Write the updated xlsx back to the same path using `openpyxl`. Preserve all existing formatting (column widths, alignment, freeze panes).

⛔ **NEVER apply formatting to empty rows.** Only modify cells in rows that contain data. Styling empty rows inflates `max_row` and causes the CE sub-agent to write new candidates hundreds of rows below the actual data. If you need to find the last data row, walk column A backwards — do NOT trust `ws.max_row`.

### Step 8: Return Summary

Return ONLY this summary to the parent agent:

```
CLEANUP | Checked: {N} | Valid: {N} | Rescored: {N} | Re-evaluated: {N} | Deduped: {N} | URLs filled: {N} | Names fixed: {N} | Stuck: {N} | Enrichment_Failed: {N} | Uncleaned: {N}
```

⛔ **CRITICAL: `Uncleaned` is the GROUND TRUTH field.** After ALL cleanup work is done (Steps 1-7 + completion loop), re-read the entire output file one final time and count every non-header row where `Cleaned?` is NOT one of: `TRUE`, `DUPLICATE`, or `ENRICHMENT_FAILED`. Report this as `Uncleaned: {N}`. This count reflects the actual state of the output file, not just what this pass processed. **The parent orchestrator uses `Uncleaned` (not `Stuck`) as the hard gate.** If `Uncleaned: 0`, the file is fully clean. If `Uncleaned` > 0, the pipeline cannot proceed.

"Deduped" = duplicate rows marked as DUPLICATE (lower-scored copy of same candidate). "Rescored" = rows where only weights changed (SC2 failed but structure intact) — recalculated in-place using current weights, no sub-agent needed. "URLs filled" = Public LI URLs extracted from LIR profile pages (Step 6). "Names fixed" = first-name-only candidates updated with full name (Step 6). "Stuck" = rows where no URL could be extracted and re-evaluation wasn't possible. "Enrichment_Failed" = rows marked ENRICHMENT_FAILED after 2+ failed enrichment attempts across separate passes. "Uncleaned" = final file-wide count of rows where Cleaned? is NOT one of TRUE/DUPLICATE/ENRICHMENT_FAILED (ground truth, computed AFTER all work is done).

---

## `Cleaned?` Column Values

| Value | Meaning |
|---|---|
| `TRUE` | Row validated as 100% solid — all tests passed |
| `DUPLICATE` | Row is a lower-scored duplicate of another row — superseded, ignored by all downstream processes |
| `ENRICHMENT_FAILED` | Row passed all structural/scoring tests but enrichment failed after 2+ attempts across separate cleanup passes — requires manual intervention |
| (empty) | Row has not been checked yet |

**Four valid states.** A row is `TRUE` only when ALL validation tests pass AND Step 6 enrichment is complete (or not needed). If the row has a LinkedIn Recruiter URL in Column 4 but no Public LI URL in Column 3, it is NOT clean — `Cleaned?` must remain empty until enrichment has been attempted. Rows are NEVER deleted outright.

`ENRICHMENT_FAILED` rows count as "clean" for the `Uncleaned: 0` gate (they are excluded from the Uncleaned count, same as `TRUE` and `DUPLICATE`). This prevents the pipeline from hanging on rows where the LIR profile is permanently inaccessible.

---

## Validation Test Suite

Every unchecked row must pass ALL of the following tests. If any test fails, the row is considered broken.

### Structural Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| S1 | Column count | `len(row) == expected_col_count` (read from JD file's Column order block) | Unquoted commas split a field, or columns are missing |
| S2 | No completely empty row | Column 1 (Candidate name) is non-empty AND at least one URL column (Column 3 or Column 4) is non-empty | Row was written as blank/partial |
| S3 | No header duplication | Row[0] ≠ `"Candidate"` | Header was accidentally re-written as data |

### Identity Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| I1 | Candidate name exists | Column 1 is non-empty, contains at least 2 characters | Name field is blank or corrupted |
| I1b | Greenhouse URL format | Column 2 is empty OR is a valid Greenhouse URL (matches `https://app*.greenhouse.io/`) | Greenhouse URL is garbled (empty is OK — filled manually) |
| I2 | Public LI URL format | Column 3 is empty OR is a valid LinkedIn public profile URL (matches `https://(www\|in\|ca\|uk\|fr\|de\|br\|au\|sg).linkedin.com/in/` or `https://linkedin.com/in/`) | Public URL is garbled (empty is OK — not always available). Note: LinkedIn uses country subdomains like `in.linkedin.com` for India, `ca.linkedin.com` for Canada, etc. All are valid. |
| I2b | Public LI URL completeness | If Column 4 is a LinkedIn Recruiter URL (`/talent/`), then Column 3 MUST be non-empty. **⚠️ I2b failure does NOT make a row "broken" for Step 4 purposes.** If I2b is the ONLY failing test, skip Step 4 — leave `Cleaned?` empty and let Step 6 enrichment fill the Public LI URL. Only send to Step 4 if other tests also fail. | Row has an LIR URL that could yield a public URL but enrichment hasn't been done yet — do NOT mark as `TRUE` until Step 6 enrichment has been attempted for this row |
| I2c | Public LI URL slug-name match | If Column 3 is non-empty, extract the slug (the part after `/in/`), split it on `-`, remove any trailing alphanumeric hash segments (segments that are all digits or >6 chars of mixed alphanumeric), then check if at least ONE word from the candidate's name (Column 1, case-insensitive) appears in the slug parts. E.g., "Priya Patel" + slug `priya-patel-a1b2c3` → match ("priya" found). "Faizan Shaikh" + slug `faizan-shaikh` → match. But "Faizan Shaikh" + slug `john-doe-developer` → FAIL. | **The public URL likely belongs to a different person with the same name.** This is a critical data integrity issue — the CE may have guessed/constructed the URL instead of extracting it from the LIR profile's "Public profile" link. Clear Column 3 (set to empty) and leave `Cleaned?` empty so enrichment is re-attempted in Step 6. Log: `URL_SLUG_MISMATCH: {Name} | {URL} — slug does not match candidate name, cleared.` |
| I3 | LIR URL format | Column 4 starts with `https://www.linkedin.com/` OR is a valid non-LinkedIn URL starting with `http` | Internal URL is garbled or shifted |
| I4 | Source exists | Column 5 is non-empty (AM only; RC has no Source column — skip this test) | Source field is blank |

### Timestamp Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| T1 | Date format | Date Added column matches regex `^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$` (AM: Column 6; RC: Column 5) | Timestamp is garbled or in wrong format |
| T2 | Date is plausible | Year is 2025 or 2026, month 01-12, day 01-31 | Timestamp has impossible values |

### Scoring Tests — Dynamic Weight Recalculation

⚠️ **IMPORTANT: Read weights from [active JD file] at runtime.** Do NOT hardcode weights or max scores. The scoring formula changes frequently. At the start of every cleanup run, parse the active JD file to extract the current weights, max scores, and bonus multipliers. Use those values for ALL scoring tests below.

**How to parse weights and current_max:**

1. Read the active JD file's **Step 4: Calculate Score** formula block. This contains the exact formula, weights, and the `Max possible` value.
2. **Read `current_max` directly from the `Max possible` line** — do NOT compute it yourself. Each role defines its own denominator differently (AM includes bonuses in the denominator: max=55.0; RC excludes bonuses: max=52.8). The JD file is the single source of truth for this value.
3. Also read the **Rubric Summary** table (near the bottom) to get each dimension's name, weight, and max raw score. Use this for dimension range validation.
4. Extract the **Percentage formula** from Step 4 — specifically what the denominator is (e.g., `/55.0` for AM, `/52.8` for RC). Use this same denominator in SC-RECALC.
5. The number of dimensions, their names, weights, max scores, and whether bonuses are in the denominator all vary by role — parse everything dynamically, never hardcode.

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| SC1 | Raw_Score is numeric | `float(raw_score)` succeeds and result ≥ 0 | Score field contains text or is shifted |
| SC2 | Max_Score matches current formula | `float(max_score) == current_max` (read from JD's Step 4 `Max possible` line — see parsing instructions above) | Weight change — row needs score recalculation (see SC-RECALC below) |
| SC3 | Percentage format | Value ends with `%`, and `float(value.strip('%'))` is ≥ 0 (can exceed 100% if role has additive bonus dimensions) | Percentage missing `%` suffix or negative |
| SC4 | Tier is valid | Value is exactly one of: `A`, `B`, `C`, `D`, `F` | Tier field is shifted or garbled |
| SC5 | Verdict is valid | Value is exactly one of: `Strong Yes`, `Yes`, `Maybe`, `No`, `Hard No` | Verdict field is shifted or garbled |
| SC6 | Score-Tier consistency | Tier matches Percentage: A=≥80, B=65-79.99, C=50-64.99, D=35-49.99, F=<35 (note: percentage can exceed 100% for roles with additive bonuses — still tier A) | Scoring logic error or field shift |
| SC7 | Score-Verdict consistency | Tier-Verdict pairs match: A→Strong Yes, B→Yes, C→Maybe, D→No, F→Hard No | Scoring logic error or field shift |

#### SC-RECALC: Score Recalculation (when SC2 fails but structure is intact)

If SC2 fails but ALL structural tests (S1-S3), identity tests (I1-I4), and dimension range tests PASS, the row is **not broken** — it was scored under old weights. **Do NOT re-evaluate via sub-agent.** Instead, recalculate in-place:

1. Read the raw dimension scores from the row (they don't change — only weights change)
2. Compute `base_score` by applying current weights to each base dimension: `base = Σ(dim_score × weight)` for all base dims parsed from the JD's Step 4 formula
3. Compute EACH bonus dimension separately: `bonus_i = bonus_score_i × multiplier_i` (e.g., for RC: `us_co_bonus = b1 × 0.8`, `startup_bonus = b2 × 2`). Then `bonus_total = Σ(bonus_i)`. Keep the individual values — roles with separate bonus columns (e.g., RC) need them written out.
4. `raw_score = base_score + bonus_total`
5. Compute `new_pct = raw_score / current_max × 100` using the `current_max` read directly from the JD's Step 4 `Max possible` line (NOT computed — see "How to parse weights" above). Note: for roles where bonuses are excluded from the denominator (e.g., RC), pct can exceed 100%.
6. Derive new Tier from new_pct (A=≥80, B=65-79.99, C=50-64.99, D=35-49.99, F=<35)
7. Derive new Verdict from Tier (A→Strong Yes, B→Yes, C→Maybe, D→No, F→Hard No)
8. Update the row's score columns as defined by the JD file's Column order block. For roles with separate Base_Score and bonus columns (e.g., RC), update all of them. For roles with only Raw_Score (e.g., AM), update Raw_Score directly. Always update: Raw_Score, Max_Score, Percentage (with `%` suffix), Tier, Verdict
9. Mark `Cleaned?` = `TRUE`

This is fast (no Chrome, no sub-agent, no delay) and preserves the original dimension scores while applying current weights. Count these in the return summary as `Rescored: {N}`.

### Dimension Score Tests

⚠️ **Parse dimension names, ranges, and count from the active JD file's Rubric Summary table and Column order block.** Do NOT hardcode dimension names or ranges — they differ by role (AM has 5 base dims + 3 bonus dims, RC has 7 base dims + 2 bonus dims, etc.).

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| D-range | Each base dimension score | Integer 0 to that dimension's Max (from rubric table). If the rubric specifies discrete valid values (e.g., 0/2/4 only), check against those exact values, not the full 0-to-max range. If Auto_DQ=Yes, all must be 0. | Dimension score is out of range or non-numeric |
| D-bonus | Each bonus dimension score | Integer 0 to that bonus's Max Raw (from rubric table) | Bonus score is out of range or non-numeric |
| D-math | Weighted score math | Apply current weights (base dims + bonus dims parsed from JD rubric) → computed Raw_Score matches row's Raw_Score (±0.2 tolerance for float rounding) | Math error or field shift |

### Auto-DQ Consistency Tests

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| A1 | DQ → F tier | If `Auto_DQ` = `Yes`, then Tier must be `F` and Verdict must be `Hard No` | DQ'd candidate was scored instead of auto-failed |
| A2 | DQ → zero scores | If `Auto_DQ` = `Yes`, then all dimension scores must be `0` | DQ'd candidate got non-zero dimension scores |
| A3 | Non-DQ has scores | If `Auto_DQ` = `No`, then Raw_Score > 0 | Non-DQ'd candidate has no scores |

### Signal Tests

⚠️ **Parse signal columns from the active JD file's Column order block.** Not all roles have the same signal columns (e.g., AM has Hindi_Signal, RC does not).

| # | Test | Pass Criteria | What Failure Means |
|---|---|---|---|
| SG1 | Hindi_Signal valid (AM only) | If the column exists in this role's schema: value is `Y` or `N` | Signal field is corrupted |
| SG2 | Gujarat/Gujarati valid | Value is non-empty | Gujarat field is missing |

---

## Completion Requirement — Loop Until All TRUE

⛔ **The cleanup process is NOT complete until every non-null row in the output file has `Cleaned?` = `TRUE`, `DUPLICATE`, or `ENRICHMENT_FAILED`.** After each pass through Steps 1-7, re-check the entire output file. If ANY non-null row still has `Cleaned?` that is none of those three values, loop back to Step 2 and run another pass. Continue looping until zero such rows remain. This applies to ALL run modes (periodic, end-of-pipeline, standalone). New rows added by other agents mid-run must also be caught and processed.

**Fallback for inaccessible LIR profiles:** If a LinkedIn Recruiter profile is inaccessible (access denied, page won't load), attempt to find the candidate's public LinkedIn URL via Google search using the candidate's name + company + location from the row. If a confident match is found, use that URL.

**Stuck row escape hatch:** If enrichment fails for a row (both LIR profile access AND Google search fail), increment a per-row failure counter. Track this in memory during the cleanup pass by checking the error log (`Z_Pipeline_Error_Log.md`) for prior enrichment failures on the same candidate. **If the same row has failed enrichment in 2+ separate cleanup passes** (i.e., it failed in a previous pass AND failed again now), mark it as `Cleaned?` = `ENRICHMENT_FAILED`. This prevents the pipeline from hanging indefinitely on permanently inaccessible profiles. Dan can manually fix these rows later.

**Rules for `ENRICHMENT_FAILED`:**
- Only applies to rows that PASS all structural/scoring validation tests but fail Step 6 enrichment
- Never mark a row `ENRICHMENT_FAILED` on its first failure — always give it one more chance in a subsequent cleanup pass
- Log every `ENRICHMENT_FAILED` row to `Z_Pipeline_Error_Log.md` with the candidate name, LIR URL, and what was tried
- Report in return summary as `Enrichment_Failed: {N}`

---

## When This Agent Runs

1. **Pre-flight (Pipeline Orchestrator):** Before any candidates are processed, the orchestrator spawns this agent to ensure the output file is structurally sound from the start.
2. **Periodic (Pipeline Orchestrator):** Every 10 candidates, the orchestrator spawns this agent. It checks every unchecked row (not just the last 10).
3. **End-of-pipeline:** After the orchestrator finishes all candidates, one final cleanup pass.
4. **Standalone:** The user can run this directly by asking for a cleanup.

In ALL cases, the agent must loop until every non-null row has `Cleaned?` = `TRUE`, `DUPLICATE`, or `ENRICHMENT_FAILED` (see "Completion Requirement" above).

---

## What This Agent Does NOT Do

- Does NOT alter scoring logic or the rubric — it re-runs the standard Candidate Evaluator on broken rows
- Does NOT modify any other agent file
- Does NOT skip broken rows — it either re-evaluates them or leaves them for human review
- ⛔ Does NOT delete rows — EVER. LinkedIn's "hide previously viewed" makes deleted candidates permanently undiscoverable

---

## Maintenance Checklist — Keep These In Sync

When column counts, max scores, or dimension weights change in a JD file, the following must also be updated:

1. **This file (`Output_Cleanup.md`)** — the "Expected column count" instruction above must remain dynamic (read from JD). Do NOT re-introduce hardcoded numbers.
2. **`_Agent_Flowchart.svg`** — if agent names, file names, or pipeline flow changes, regenerate using `render_flowchart_svg.py` per `Z__In_Use_Ref_Files/_Flowchart_Preferences.md`.
