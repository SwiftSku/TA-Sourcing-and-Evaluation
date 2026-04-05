# Doctor Report — 2026-04-05

## Summary
- Files audited: 15 active files (2 JD files, 6 agent instruction files, 2 reference files, 2 output xlsx, 1 spawn template, 1 handoff JSON, 1 error log)
- JD files / roles found: 2 — Senior Account Manager (37 cols), Recruiting Coordinator (40 cols)
- Issues found: 11 (Critical: 1, High: 3, Medium: 3, Low: 4)
- Output file health: AM **PASS** | RC **CRITICAL — data loss detected**

---

## Critical Issues (would corrupt data or break pipeline)

### C1. RC output file overwritten with non-conforming data — 311+ rows lost

**File:** `_OUTPUT--Recruiting_Coord.xlsx`

The RC output file has been replaced with a 7-row summary-format file that does NOT match the JD-specified 40-column schema. The current file has headers `Candidate, Company, Title, Tier, Score%, Verdict, DQ_Reason, Dim1_Title, Dim2_Volume...` (17 populated columns, 23 nulls) instead of the JD-spec `Candidate, Greenhouse URL, Public LI URL, LIR URL, Date Added...`.

**Evidence:**
- Current file: 7 data rows, non-conforming headers, dated 2026-04-04
- Backup `_OUTPUT--Recruiting_Coord_backup_doctor.xlsx`: 311 data rows, correct JD-spec headers, 40 columns
- Backup `_OUTPUT--Recruiting_Coord_backup_2026-03-28.xlsx`: 200 data rows
- Context_Legacy_Prompt.md references 420+ total candidates, run_total_count=113

**Impact:** All RC pipeline data (311+ scored candidates including 3 A-rated, 16 B-rated) is missing from the active output file. The pipeline cannot continue from this file — any cleanup or new CE writes will fail on schema mismatch.

**Fix:** Restore from `_OUTPUT--Recruiting_Coord_backup_doctor.xlsx` (311 rows, correct schema). Then re-run pipeline to recover candidates evaluated after that backup was taken.

---

## High Issues (would cause incorrect behavior)

### H1. RC backup has non-standard Tier values

**File:** `_OUTPUT--Recruiting_Coord_backup_doctor.xlsx` (the file that should be restored)

Tier column (col 36) contains non-standard values: `"Unable to Evaluate"` (1 row), `"DQ/F"` (10 rows), `"53.4"` (1 row — shifted Max_Score value), `""` (1 empty). Standard values are A/B/C/D/F only.

**Impact:** Cleanup agent's SC4 test ("Tier is exactly one of A/B/C/D/F") will flag these 13 rows as broken, triggering unnecessary re-evaluation via CE sub-agent. The `"53.4"` row is a column-shifted row where data is in the wrong position.

**Fix:** After restoring the backup, run cleanup to catch and fix these. The 10 "DQ/F" rows should be standardized to "F". The "53.4" row needs manual investigation (likely shifted data). The "Unable to Evaluate" row needs a CE re-eval or manual fix.

### H2. AM output has 27 duplicate candidate names (11 confirmed by duplicate URLs)

**File:** `_OUTPUT--Acct_Mgr.xlsx`

27 candidate names appear in multiple rows. 11 of these are confirmed duplicates (same normalized Public LI URL). Examples: Ankit Maskara (rows 146 & 149), Nichola Pandian (rows 28 & 150), Darshan Menon (rows 335 & 556).

**Impact:** Duplicate outreach risk. Pipeline counts inflated by re-evaluations. The Cleanup agent's dedup logic (Step 1d) should be catching these — either it's not running or these duplicates were added after the last cleanup pass.

**Fix:** Run cleanup agent — its Step 1d dedup pass should mark the lower-scored duplicate of each pair as `Cleaned?=DUPLICATE`. Verify the 16 name-only matches (no URL overlap) are actually the same person before marking.

### H3. AM output has 3 non-DQ rows with Raw_Score=0 (rows 541-543)

**File:** `_OUTPUT--Acct_Mgr.xlsx`, rows 541-543 (Valay Patel, Vijendra Jawa, Kamlesh Vyas)

These rows have `Auto_DQ=No` but all dimension scores are 0 and Raw_Score=0. Per the error log (2026-03-24), these are unevaluated rows from source "Unkown_Search" with only name + LIR URL — no scores were ever assigned.

**Impact:** These violate test A3 ("Non-DQ has scores → Raw_Score > 0"). They will be flagged as broken by cleanup and sent to CE re-evaluation, which is the correct behavior — but they've persisted through multiple cleanup passes, suggesting the cleanup agent can't find extractable URLs or the LIR profiles are inaccessible.

**Fix:** Either manually DQ these rows (set Auto_DQ=Yes, Tier=F, Verdict=Hard No) or provide LIR URLs for CE re-evaluation.

---

## Medium Issues (could confuse a Sonnet agent or cause inefficiency)

### M1. Pipeline Starter CE return format doesn't match CE_Spawn_Template

**File:** `1_Pipeline_Starter.md` line 73

Pipeline Starter says CE returns 5 fields: `{Name} | {Tier} | {Score%} | {Verdict} | {Company}`. The CE_Spawn_Template and both JD files say 6 fields: `{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company} | {DQ_Reason or ""}`.

**Impact:** Low runtime risk (the Starter is documentation, not executed by sub-agents). But a human or agent reading the Starter for reference could misunderstand the CE return format.

**Fix:** Update `1_Pipeline_Starter.md` line 73 to include `{DQ_Reason or ""}` as the 6th field.

### M2. RC backup has 12 uncleaned rows and Dim6 header mismatch

**File:** `_OUTPUT--Recruiting_Coord_backup_doctor.xlsx`

12 rows have empty `Cleaned?` (not TRUE/DUPLICATE/ENRICHMENT_FAILED). Also, the Dim6 header reads `Dim6_RecruitingOps_Score (0-3)` but the JD defines Dim6 max as 4 (Greenhouse = auto 4). Header parenthetical is wrong.

**Impact:** 12 uncleaned rows will block pipeline termination (Uncleaned must be 0). Wrong header parenthetical could confuse a Sonnet agent reading the xlsx for context, though scoring logic reads from the JD, not headers.

**Fix:** Run cleanup to process the 12 uncleaned rows. Fix the Dim6 header parenthetical from `(0-3)` to `(0-4)`.

### M3. AM output has 200 styled-but-empty tail rows (618-817)

**File:** `_OUTPUT--Acct_Mgr.xlsx`

`max_row` reports 817 but actual data ends at row 617. 200 styled-but-empty rows inflate the worksheet. While the backward-walk code handles this correctly, any code using `ws.max_row` directly would write new rows at 818+, creating a 200-row gap.

**Impact:** Not immediately breaking (all agents use backward-walk), but increases file size and could confuse manual inspection.

**Fix:** Trim rows 618-817 or leave as-is (cosmetic only given backward-walk is enforced).

---

## Low Issues (style, inconsistency, stale comments)

### L1. Context_Legacy_Prompt.md has stale session path

**File:** `Context_Legacy_Prompt.md`

References `/sessions/wizardly-cool-brown/mnt/TA-ACM` — a path from a previous session that no longer exists. This file is consumed by a fresh session which would need the current path.

**Fix:** This file is regenerated per-run. No action needed unless manually resuming from this file — in which case, update the path.

### L2. Error log references deprecated file/format names (historical)

**File:** `Z_Pipeline_Error_Log.md`

Pre-2026-03-24 entries reference `CSV_Cleanup_Agent.md`, `search_handoff.json`, 40-column schema, and CSV format. The header note correctly flags these as historical.

**Fix:** No action needed — header disclaimer is sufficient.

### L3. Flowchart shows "COMING SOON: Send to Greenhouse"

**File:** `_Agent_Flowchart.svg`

This placeholder has been present since initial creation. Not stale per se, but signals planned work.

**Fix:** Remove or leave as aspirational. Not blocking.

### L4. Output_Cleanup.md maintenance checklist is incomplete

**File:** `Output_Cleanup.md`, bottom section

The checklist lists 2 items (this file + flowchart). Missing: Z_Search_Cache.json structure (if fields change, variance protection breaks), CE_Spawn_Template return format (if fields change, orchestrator parsing breaks), error log format.

**Fix:** Add the missing cross-file dependencies to the checklist.

---

## Output File Audit

### Senior Account Manager: _OUTPUT--Acct_Mgr.xlsx

- Total rows: 616
- Tier distribution: A=varies, B=varies, C=varies, D=varies, F=247 (DQ'd)
- Cleaned? distribution: TRUE=558 (91%), DUPLICATE=29 (5%), empty=29 (5%)
- Math errors found: 0 (all 616 rows verified — Raw_Score, Percentage, Tier, Verdict all correct)
- Scoring formula verified: Base=(D1×5)+(D2×2.5)+(D3×2)+(D4×1.3)+(D5×0.2), Bonus=(D6×2.5)+(D7×2)+(D8×1), Max=55.0
- Duplicate candidates: 27 name matches, 11 URL-confirmed
- Non-DQ zero-score rows: 3 (known unevaluated — rows 541-543)
- Styled-but-empty tail rows: 200 (rows 618-817)
- Header: 37 columns, matches JD-spec column order exactly
- Column count consistency: all 616 rows have exactly 37 columns

### Recruiting Coordinator: _OUTPUT--Recruiting_Coord.xlsx (CURRENT — non-conforming)

- **STATUS: DATA LOSS — file replaced with 7-row summary format**
- Total rows: 7 (should be 311+)
- Header: non-conforming (17 columns populated, 23 null)
- Schema: does NOT match JD--Recruiting_Coord.md column order
- This file cannot be used by any pipeline agent

### Recruiting Coordinator: _OUTPUT--Recruiting_Coord_backup_doctor.xlsx (most recent valid backup)

- Total rows: 311
- Tier distribution: A=3, B=16, C=31, D=56, F=192, DQ/F=10, Unable to Evaluate=1, shifted=1, empty=1
- Cleaned? distribution: TRUE=290, DUPLICATE=8, ENRICHMENT_FAILED=1, empty=12
- Uncleaned rows: 12
- Non-standard tier values: 13 rows (see H1)
- Header: 40 columns, matches JD-spec (except Dim6 parenthetical says 0-3 instead of 0-4)

---

## Clean Bill of Health

The following were checked and ARE correct:

1. **AM scoring math — 616/616 rows verified.** Every row's Raw_Score matches the weighted dimension sum within ±0.2 tolerance. Every Percentage matches Raw/55.0×100. Every Tier matches the percentage threshold. Every Verdict matches the Tier mapping.
2. **Max_Score consistency — AM.** All 616 rows have Max_Score=55.0, matching the JD's Step 4 formula.
3. **Auto-DQ consistency — AM.** All 247 DQ'd rows have: all dimension scores=0, Tier=F, Verdict=Hard No. No DQ rows with non-zero scores (the ERR-004 issue from March was fixed).
4. **Column schema — AM.** All 37 columns present in every row. Header labels match JD column order exactly.
5. **Dynamic parsing.** Output_Cleanup.md correctly reads column count, weights, max scores, and dimension names from the active JD file — no hardcoded values for either role.
6. **Role-conditional logic.** Cleanup correctly handles: Source (AM col 5, RC skipped), Date Added (AM col 6, RC col 5), Hindi_Signal (AM only), separate Base_Score/bonus columns (RC only), SC-RECALC with role-specific formulas.
7. **Cross-file reference integrity.** All agent files reference existing files. CE_Spawn_Template parameters match both JD files. Cleanup return format matches Orchestrator expectation. Anti-detection sections §1-§6 all exist and are correctly referenced by their consumers.
8. **Weight & formula cross-reference.** AM: Base max 35.5 + Bonus max 19.5 = 55.0 (bonuses in denominator). RC: Base max 53.4 (bonuses excluded from denominator, additive only). Both JD Rubric Summary tables match their Step 4 formulas exactly.
9. **Tier thresholds identical across roles.** A≥80, B=65-79.99, C=50-64.99, D=35-49.99, F<35. Verdict mapping identical: A→Strong Yes, B→Yes, C→Maybe, D→No, F→Hard No.
10. **Flowchart accuracy.** All agent names match current files. Flow arrows match pipeline logic. Quality gate labels match current thresholds. No deprecated agents shown. Save_To_LIR correctly shown as manual-only.
11. **Anti-detection rules.** Single source of truth in REF--Anti_Detection.md. All Chrome-touching agents reference it. Section numbers in references (§1-§6) all resolve correctly.
12. **openpyxl backward-walk pattern.** Both JD files contain the identical code block for finding the last data row. No agent uses `ws.max_row + 1`.
13. **URL normalization.** Cleanup Step 1c correctly normalizes subdomain variants (in.linkedin.com, ca.linkedin.com, etc.) to www.linkedin.com. Dedup uses normalized URLs.
14. **Scoring variance protection.** Z_Search_Cache.json has both `top5_summary` and `a_rated_cache`. Cleanup Step 4 checks both before spawning re-evaluation CE agents.
15. **Timestamp format.** Both JDs mandate `YYYY-MM-DD HH:MM:SS` in US Eastern (America/New_York). Cleanup T1 test validates this format.
