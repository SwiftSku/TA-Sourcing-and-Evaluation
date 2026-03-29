# Doctor Report — 2026-03-28 (v4 — Full Re-Audit)

## Summary

- **Files audited:** 18 active files across root and Target_Companies/
- **JD files / roles found:** 2 — Senior Account Manager (AM), Recruiting Coordinator (RC)
- **Issues found:** 6 (Critical: 0, High: 0, Medium: 2, Low: 4)
- **Output file health:**
  - AM: **NEAR-CLEAN** — 0 scoring errors, 0 duplicates, 0 Max_Score mismatches. 29 rows awaiting Chrome enrichment (Public LI URLs).
  - RC: **CLEAN** — 0 uncleaned rows, 0 Max_Score mismatches, 0 DQ violations. 1 minor CE scoring drift (0.6 on one row, tier unaffected).

---

## Medium Issues

### M1: Output_Cleanup.md stale example says "RC excludes bonuses: max=52.8"

**File:** `Output_Cleanup.md`, line ~235 (in "How to parse weights and current_max")
**Problem:** The parenthetical says `(AM includes bonuses in the denominator: max=55.0; RC excludes bonuses: max=52.8)`. The RC max is 53.4, not 52.8 — this was an old rubric value. The instruction itself correctly says "Read `current_max` directly from the `Max possible` line" so a Sonnet agent following the rule would get 53.4 from the JD. But the wrong example value could confuse a fast-reading agent.
**Fix:** Change `52.8` to `53.4` in the parenthetical.

### M2: AM JD Step 8 return format has 5 fields; CE_Spawn_Template has 6

**File:** `JD--Acct_Mgr.md`, Step 8 (~line 374)
**Problem:** AM JD says `{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company}` (5 fields). The CE_Spawn_Template says `{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company} | {DQ_Reason or ""}` (6 fields). RC JD Step 8 correctly has 6 fields. A Sonnet CE agent reading both the AM JD and the spawn template gets conflicting instructions — it might omit DQ_Reason for AM candidates, which the Orchestrator wouldn't expect.
**Fix:** Update AM JD Step 8 to the 6-field format matching CE_Spawn_Template and RC JD.

---

## Low Issues

### L1: Orchestrator comment says CE returns 5 fields (line ~73)

**File:** `2_Pipeline_Orchestrator.md`, line 73
**Text:** `Each CE sub-agent returns exactly: {Name} | {Tier} | {Score%} | {Verdict} | {Company}`
**Fix:** Add `| {DQ_Reason or ""}` to match CE_Spawn_Template.

### L2: Save_To_LIR.md uses `CSV_PATH` parameter name

**File:** `Save_To_LIR.md`, line 61
**Problem:** URL_Extractor.md was renamed from `CSV_PATH` to `OUTPUT_PATH`. Save_To_LIR still uses `CSV_PATH`. Cosmetic only — Save_To_LIR is manually invoked and the description says "xlsx file".
**Fix:** Rename to `OUTPUT_PATH` for consistency.

### L3: Z_Pipeline_Error_Log.md header says "RC=38" (stale)

Won't affect agents. Historical note only.

### L4: RC row 204 (Maya Desai) has 0.6 CE scoring drift

**Problem:** Computed Base_Score from dim scores × JD weights = 16.6, stored Base_Score = 17.2. Diff = 0.6. The CE sub-agent appears to have used a slightly different weight for one dimension. Tier (D) and Verdict (No) are correct either way (40.1% vs 41.2% → both D).
**Impact:** None. One row, no tier change.
**Fix:** No action needed. Preserving CE's original evaluation.

---

## Data Fixes Applied During This Audit

| Row | Candidate | Fix | How |
|-----|-----------|-----|-----|
| 39 | Piyush Malviya | Restored missing Dim1_Score = 2 | Back-calculated from stored Base_Score (20.2 = 2×5 + rest) |
| 156 | Pratham Patel | Cleaned severely corrupted DQ row | Recovered company from scattered cols, set proper DQ fields, zeroed dim scores |
| 201 | Himadree Patel | Reconstructed from scattered field-shift data | Back-calculated scores from stored Pct (13.8% → Base=7.4 → Dim1=1, Dim6=4) |

---

## Output File Audit

### AM: `_OUTPUT--Acct_Mgr.xlsx` — ✅ NEAR-CLEAN

| Metric | Value |
|--------|-------|
| Data rows | 616 |
| Column count | 37 (matches JD) |
| max_row | 617 (0 inflation) |
| Max_Score mismatches | **0** |
| Raw_Score math errors | **0** |
| Tier-Pct mismatches | **0** |
| Score-Tier errors | **0** |
| Verdict errors | **0** |
| DQ violations | **0** |
| Name duplicates | **0** |
| URL duplicates | **0** |
| Cleaned=TRUE | 558 |
| DUPLICATE | 29 |
| Uncleaned | 29 (awaiting Chrome enrichment — missing Public LI URLs) |
| Tier distribution | A=54, B=113, C=81, D=46, F=264 |

### RC: `_OUTPUT--Recruiting_Coord.xlsx` — ✅ CLEAN

| Metric | Value |
|--------|-------|
| Data rows | 214 |
| Column count | 40 (matches JD) |
| max_row | 215 (0 inflation) |
| Max_Score mismatches | **0** |
| Raw_Score math errors | **0** (1 CE drift at ±0.6, tier unaffected) |
| Tier-Pct mismatches | **0** |
| Score-Tier errors | **0** |
| Verdict errors | **0** |
| DQ violations | **0** |
| Name duplicates | **0** |
| URL duplicates | **0** |
| Cleaned=TRUE | 205 |
| DUPLICATE | 8 |
| ENRICHMENT_FAILED | 1 |
| Uncleaned | **0** |
| Tier distribution | A=2, B=10, C=22, D=37, F=134 |

---

## Clean Bill of Health — Instruction Files

All instruction files pass cross-reference verification:

1. ✅ **Both JD files** — Tier tables use `≥80%` with `.99` boundary ranges, handle >100% for RC
2. ✅ **Output_Cleanup.md** — SC6/SC-RECALC use `≥80`, dynamic weight parsing, I2b skip logic, D-range check. Completion loop requires Uncleaned=0.
3. ✅ **CE_Spawn_Template.md** — 6-field return (includes DQ_Reason), SOURCE_NAME handles empty-for-RC
4. ✅ **2_Pipeline_Orchestrator.md** — Cleanup return format includes Deduped + Enrichment_Failed, URL Extractor uses OUTPUT_PATH
5. ✅ **URL_Extractor.md** — Parameter renamed to OUTPUT_PATH, Step 6b URL validation, pre-filter on search cards
6. ✅ **Save_To_LIR.md** — Dynamic column lookup, no hardcoded column counts
7. ✅ **REF--Anti_Detection.md** — All 6 sections present, all cross-references resolve correctly
8. ✅ **REF--LIR_Interface_Learnings.md** — Scoped to interface-only, mandatory filters documented
9. ✅ **Scoring formulas** — AM: 55.0 (bonuses in denominator), RC: 53.4 (bonuses additive). Both verified against JD Step 4.
10. ✅ **Backward-walk write pattern** — Present in both JD files, Output_Cleanup warns against styling empty rows
11. ✅ **Model assignments** — Opus (orchestrator), Sonnet (all sub-agents). Consistent everywhere.
12. ✅ **No hardcoded column counts** — Cleanup, Save_To_LIR, and CE all read from JD dynamically
13. ✅ **Dedup logic** — Name + URL dedup in Output_Cleanup, URL normalization for subdomain variants
14. ✅ **DQ handling** — Both JDs define DQ triggers, both specify 0-score/F/Hard No pattern, Cleanup A1-A3 tests enforce
15. ✅ **RC column headers** match JD Column order exactly (40 cols, Cleaned? at #40)
16. ✅ **AM column headers** match JD Column order exactly (37 cols, Cleaned? at #37)

## Cross-Role Consistency

### Identical (verified):
- Cols 1-4 meaning: Candidate, Greenhouse URL, Public LI URL, LIR URL ✅
- DQ → scores 0, Tier F, Verdict Hard No ✅
- Tier thresholds: A≥80, B=65-79.99, C=50-64.99, D=35-49.99, F<35 ✅
- Verdict mapping consistent ✅
- Cleaned? = last column ✅
- Gujarat/Gujarati column exists in both ✅
- Backward-walk write pattern ✅
- Anti-detection rules referenced ✅

### Expected variations (verified internally consistent):
- AM: 37 cols, 5 base + 3 bonus, max=55.0 (bonuses in denominator), has Source col, has Hindi_Signal col
- RC: 40 cols, 7 base + 2 bonus, max=53.4 (bonuses additive, not in denominator), no Source col, no Hindi_Signal col, has separate Base_Score/US_Co_Bonus/Startup_Bonus cols

---

## Comparison: v1 → v3 → v4

| Metric | v1 (pre-fix) | v3 (prior audit) | v4 (this audit) |
|--------|-------------|------------------|-----------------|
| Instruction file issues | 8 | **0** | **2** (M1 stale example, M2 AM return format) |
| AM Max_Score mismatches | 241 | **0** | **0** |
| AM math errors | 0 | **0** | **0** |
| AM duplicates | 16 | **0** | **0** |
| RC max_row inflation | 804 | **0** | **0** |
| RC column count | 41 | **40** | **40** |
| RC Max_Score mismatches | 157 | **0** | **0** |
| RC math errors | 20 | **0** | **0** (1 CE drift, L4) |
| RC DQ violations | 4 | **0** | **0** |
| RC duplicates | 2 | **0** | **0** |
| RC Cleaned rows | 181 | 204 | **205** |
| RC Uncleaned rows | 25 | 1 | **0** |
| Total issues | 22 (6C/6H/6M/4L) | 3 (0C/0H/0M/3L) | **6** (0C/0H/2M/4L) |
