# Doctor Report — 2026-03-31 (Post-Fix)

## Summary
- Files audited: 14 active files + 3 output xlsx files
- JD files / roles found: 2 (Senior Account Manager, Recruiting Coordinator)
- Issues found: 3 (Critical: 0, High: 0, Medium: 1, Low: 2)
- Output file health: AM = CLEAN | RC = CLEAN
- Previous run: 14 issues (3 Critical, 4 High, 4 Medium, 3 Low) — all Critical and High issues resolved

---

## What Was Fixed (this session)

### RC xlsx — Scoring & Data Integrity
- **7 rows** with zeroed Base_Score recalculated (rows 51, 60, 67, 107, 114, 117, 119) — Max_Score corrected from 52.8/0.0 → 53.4, all scores recalculated from dimension data
- **Row 204** (Maya Desai): Base_Score corrected 17.2 → 16.6, Raw_Score 22.0 → 21.4
- **Row 272** (Prajwal Konuri): Tier corrected C → D, Verdict Maybe → No
- **Row 301** (Subhro Bose): Shifted data repaired — Tier had "53.4", Verdict had "0%"
- **Row 304** (Dipak Badgujar): Impossible Startup_Bonus (56.93) recalculated from raw Bonus2 score

### RC xlsx — Invalid Tier/Verdict Values
- **28 DQ rows** (268-299, 309) had non-standard Tier values ("DQ/F", "Unable to Evaluate") and extended verdict text — all normalized to Tier=F, Verdict="Hard No"

### RC xlsx — Duplicates
- **13 URL duplicate pairs** resolved — lower-scored copies marked DUPLICATE in Cleaned? column
- All Public LI URLs normalized (subdomain variants → www.linkedin.com)

### AM xlsx — Duplicates
- **29 URL duplicate pairs** confirmed marked as DUPLICATE (were already handled by prior cleanup pass)
- All Public LI URLs normalized

---

## Remaining Issues

### Medium

**M1. Pipeline Starter: No mention of Context_Legacy_Prompt.md**
File: `1_Pipeline_Starter.md`
The Starter's file list doesn't reference Context_Legacy_Prompt.md, which the Orchestrator writes on self-destruct. If a session resumes from a legacy prompt, the Starter wouldn't know about it. Low risk since the legacy prompt is self-contained.

### Low

**L1. Stale historical reference in Pipeline Orchestrator**
File: `2_Pipeline_Orchestrator.md`, line 18
References "Search_Optimizer.md + Bulk_Processor.md" — neither exists. Informational only.

**L2. Flowchart (SVG) not verifiable / likely stale**
File: `_Agent_Flowchart.svg`
Last modified 2026-03-25, predating agent file changes on 2026-03-28. Could not read file (EDEADLK error). Recommend regenerating via `render_flowchart_svg.py`.

---

## Output File Audit

### Senior Account Manager: _OUTPUT--Acct_Mgr.xlsx
- Total rows: 616
- Column count: 37 ✅
- Max_Score: 55.0 (all rows) ✅
- Scoring math: 0 errors ✅
- Tier/Verdict consistency: 0 errors ✅
- Invalid values: 0 ✅
- Unresolved URL duplicates: 0 ✅
- Tier distribution: A=65 (10.6%), B=129 (20.9%), C=90 (14.6%), D=55 (8.9%), F=277 (44.9%)
- Cleaned? status: TRUE=558, DUPLICATE=29, empty=29
- Uncleaned rows: 29

### Recruiting Coordinator: _OUTPUT--Recruiting_Coord.xlsx
- Total rows: 311
- Column count: 40 ✅
- Max_Score: 53.4 (all rows) ✅
- Scoring math: 0 errors ✅
- Tier/Verdict consistency: 0 errors ✅
- Invalid values: 0 ✅
- Unresolved URL duplicates: 0 ✅
- Tier distribution: A=3 (1.0%), B=19 (6.1%), C=32 (10.3%), D=59 (19.0%), F=198 (63.7%)
- Cleaned? status: TRUE=289, DUPLICATE=13, ENRICHMENT_FAILED=1, empty=8
- Uncleaned rows: 8

---

## Clean Bill of Health

1. **All scoring math verified programmatically** — every non-DQ row's Raw_Score matches recalculated value (±0.2) ✅
2. **All Max_Score values consistent** — AM=55.0, RC=53.4, no exceptions ✅
3. **All Tier values valid** — only A/B/C/D/F, no "DQ/F" or other variants ✅
4. **All Verdict values valid** — only Strong Yes/Yes/Maybe/No/Hard No ✅
5. **All DQ rows consistent** — dims=0, Tier=F, Verdict=Hard No ✅
6. **All URL duplicates resolved** — 0 unresolved pairs in either file ✅
7. **Public LI URLs normalized** — no subdomain variants remain ✅
8. **Column schemas match JD files** — AM=37 cols, RC=40 cols ✅
9. **CE Spawn Template consistent** — both callers use same template ✅
10. **Anti-detection references valid** — all §1-§6 section references exist ✅
11. **Cross-file return formats consistent** — CE Step 8, Cleanup Step 8, Orchestrator parsing all agree ✅
12. **Tier thresholds identical across roles** — A≥80, B=65-79.99, C=50-64.99, D=35-49.99, F<35 ✅
13. **Columns 1-4 identical across roles** — Candidate, Greenhouse URL, Public LI URL, LIR URL ✅
14. **Cleaned? is always last column** — AM col 37, RC col 40 ✅
15. **Backward-walk openpyxl pattern consistent** across both JD files ✅
16. **Backups created** — _OUTPUT--Recruiting_Coord_backup_doctor.xlsx, _OUTPUT--Acct_Mgr_backup_doctor.xlsx ✅
