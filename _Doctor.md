# The Doctor — TA-ACM Pipeline Integrity Audit

## Mission Statement

SwiftSku's TA-ACM pipeline is a multi-agent system that sources, evaluates, and scores candidates from LinkedIn Recruiter for specific hiring roles. The pipeline's value is only as good as the consistency between its instruction files. A single hardcoded column number, a stale weight reference, or a mismatched schema can silently corrupt hundreds of rows of candidate data — and because LinkedIn hides previously viewed profiles, corrupted data means permanently lost candidates.

**Your job is to be the staff engineer who catches what everyone else missed.** You are not here to rubber-stamp. You are here to break things before production does.

---

## When To Run This

Run the Doctor after ANY change to any file in this directory — no matter how small. A one-line weight change in a JD file can cascade into broken scoring across Output_Cleanup.md, the CE spawn template, and the output xlsx files. Also run periodically as a health check even if no changes were made.

---

## How To Run

Read this entire file first. Then execute every phase below, in order. Do NOT skip phases. Do NOT summarize early. Write your findings into a structured report at the end.

---

## Phase 0: Load the Full Architecture

Read ALL of the following files in their entirety before beginning any analysis. You need the complete picture before you can spot inconsistencies.

**Active agent instruction files (read fully):**
1. `1_Pipeline_Starter.md` — entry point, JD selection
2. `2_Pipeline_Orchestrator.md` — parent orchestrator, sub-agent spawning, quality gates
3. `URL_Extractor.md` — Chrome sub-agent for LIR URL extraction
4. `Output_Cleanup.md` — validation suite, scoring tests, enrichment, dedup
5. `CE_Spawn_Template.md` — canonical CE spawn template
6. `Save_To_LIR.md` — manual LIR save agent

**JD files (read fully — these are the source of truth for all role-specific values):**
7. `JD--Acct_Mgr.md` — AM role: rubric, weights, column schema, Pipeline Config
8. `JD--Recruiting_Coord.md` — RC role: rubric, weights, column schema, Pipeline Config

**Reference files (read fully):**
9. `REF--Anti_Detection.md` — anti-detection rules
10. `REF--LIR_Interface_Learnings.md` — LIR interface quirks
11. `Z_Pipeline_Error_Log.md` — error log format and history

**Output files (read headers + sample rows only — do NOT read all 600+ rows):**
12. `_OUTPUT--Acct_Mgr.xlsx` — AM output, read header row + 5 sample data rows
13. `_OUTPUT--Recruiting_Coord.xlsx` — RC output, read header row + 5 sample data rows

**Support files:**
14. `Target_Companies/Company_Research_Agent.md`
15. `Target_Companies/Company_Research_Specs.md`
16. `Z_Search_Cache.json`

**DO NOT read:** `Z_Old_Chat_Logs/`, `ZZ_Archived_Not_Needed/`, `.obsidian/`, `Z_Chat_Log--Agent_Maker.md`, `.DS_Store`, `.git/`. These are not active pipeline files.

---

## Phase 1: Schema Consistency Audit

This is the most critical phase. Schema mismatches between JD files and the agents that reference them are the #1 source of data corruption.

### 1a: Column Schema Cross-Reference

For EACH JD file (AM and RC), extract:
- Total column count
- Column number → name mapping
- Which columns are dimension scores (and their max values)
- Which columns are bonus scores (and their max values)
- Which columns are metadata (name, URLs, dates, etc.)
- Which columns are computed scores (Raw_Score, Max_Score, Percentage, Tier, Verdict)
- The Cleaned? column position

Then verify that EVERY file that references column positions is consistent:

| Check | What to compare |
|-------|----------------|
| Output_Cleanup.md S1 | Does it read col count from JD, or hardcode it? |
| Output_Cleanup.md S2 | Do the referenced columns exist in both schemas? |
| Output_Cleanup.md I4 | Does Source column reference match AM (col 5) and correctly skip for RC (no Source col)? |
| Output_Cleanup.md T1 | Does Date Added column reference match AM (col 6) and RC (col 5)? |
| Output_Cleanup.md SC tests | Do Raw_Score, Max_Score, Percentage, Tier, Verdict column refs resolve correctly for both roles? |
| Output_Cleanup.md SC-RECALC | Does it know which roles have Base_Score + bonus columns vs. just Raw_Score? |
| Output_Cleanup.md dedup | Can it find the Percentage column for both roles? |
| Output_Cleanup.md SG tests | Hindi_Signal exists for AM only. Gujarat exists for both. Column positions correct? |
| CE_Spawn_Template.md | Does SOURCE_NAME handling account for RC having no Source column? |
| Output xlsx headers | Do actual xlsx column headers match the JD's Column order block exactly? |

**How to check xlsx headers:** Use openpyxl to read row 1 of each output file. Compare each header cell against the JD's column order block. Flag any mismatch in name, order, or count.

### 1b: Weight & Formula Cross-Reference

For EACH JD file, extract from Step 4:
- The exact formula (which dims × which weights)
- The `Max possible` line and its value
- Whether bonuses are in the denominator or additive
- The Percentage formula denominator

Then verify:
- Output_Cleanup.md's "How to parse weights" instructions would lead an agent to the correct values for both roles
- SC-RECALC steps produce correct math for both roles
- SC6 tier boundaries handle percentages >100% (RC bonuses are additive)
- The Rubric Summary table in each JD matches the Step 4 formula (weights, maxes, dim count)

### 1c: Auto_DQ & Signal Column Cross-Reference

For EACH JD file:
- What column is Auto_DQ?
- What column is DQ_Reason?
- What column is Gujarat/Gujarati?
- Does Hindi_Signal exist? What column?
- What are the DQ criteria?

Verify Output_Cleanup.md's A1-A3 and SG1-SG2 tests resolve to the correct columns for each role.

---

## Phase 2: Instruction Consistency Audit

Every agent file that references another file must agree on what that file contains and how it works.

### 2a: Cross-File Reference Integrity

Build a reference graph: which files reference which other files, and what do they claim about the referenced file? Flag any inconsistency.

Examples of what to check:
- Pipeline Orchestrator says "CE returns: {Name} | {Tier} | {Score%} | {Verdict} | {Company}" — does the CE template and JD file's Step 8 agree?
- Pipeline Orchestrator says cleanup agent returns "CLEANUP | Checked: {N} | ..." — does Output_Cleanup.md's Step 8 match exactly?
- Pipeline Starter says to read certain files — do all listed files exist?
- CE_Spawn_Template lists parameters — does every caller (Orchestrator, Cleanup) provide all of them?
- Output_Cleanup.md references CE_Spawn_Template.md for re-eval — does the template's "Cleanup Agent (Step 4)" section exist and match?
- Any file that says "read REF--Anti_Detection.md §X" — does that section exist?

### 2b: Behavioral Contract Verification

Each agent has implicit contracts with other agents. Verify these:

| Contract | Check |
|----------|-------|
| CE writes rows → Cleanup validates them | CE's column order (from JD) must match Cleanup's expected column positions |
| Orchestrator spawns CE with model: "sonnet" | Both Orchestrator and CE_Spawn_Template specify sonnet |
| Cleanup marks rows TRUE/DUPLICATE/ENRICHMENT_FAILED | All downstream consumers (Orchestrator completion check, other agents) recognize these exact values |
| URL Extractor returns 5 URLs | Orchestrator expects exactly 5 and handles SEARCH_EXHAUSTED |
| Anti-detection delays | Every Chrome-touching agent references REF--Anti_Detection.md and the section numbers exist |

### 2c: Dead References & Stale Content

Scan every file for references to files, columns, values, or behaviors that no longer exist:
- References to deleted files (like Context_Legacy_Prompt.md)
- References to old column names or positions
- References to deprecated agent names (Search_Optimizer, Bulk_Processor)
- Hardcoded values that should be dynamic (column counts, weights, max scores)
- Comments or notes that contradict the current code

---

## Phase 3: Logic & Edge Case Audit

Think like an adversarial QA engineer. For each agent file, ask: "What input would break this?"

### 3a: Simulate Execution Against Both Roles

For Output_Cleanup.md specifically (since it's the most complex), mentally execute EVERY test and EVERY step against both AM and RC schemas. For each line, write out:
- What the Sonnet agent would parse
- What it would compute
- Whether it would break

Pay special attention to:
- Column number arithmetic (AM and RC have different offsets for everything after col 4/5)
- Score computation with bonuses in/out of denominator
- Tier derivation for percentages >100%
- I2b enrichment flow vs re-eval flow
- Dedup when one role has Source column and the other doesn't
- Auto_DQ row handling through the full validation suite

### 3b: Data Integrity Edge Cases

- What happens if a cell contains a formula instead of a value?
- What happens if openpyxl returns an integer where the test expects a string?
- What happens if a candidate's name contains special characters (commas, quotes, unicode)?
- What happens if the LIR URL column contains a public URL by accident?
- What happens if two candidates have the same name but different people?
- What happens if Max_Score in the xlsx is `55` (int) vs `55.0` (float)?
- What happens if Percentage is `85.8%` vs `85.8` (missing suffix)?

### 3c: Pipeline Flow Edge Cases

- What happens if the URL Extractor returns fewer than 5 URLs?
- What happens if a CE sub-agent crashes mid-write (partial row)?
- What happens if the Cleanup agent encounters rows written by a different version of the CE?
- What happens if two pipeline runs overlap on the same output file?
- What happens if the rubric changes mid-run?

---

## Phase 4: Output File Health Check

Use Python (openpyxl) to programmatically verify both output xlsx files.

### 4a: Structural Health

```python
# For each output file:
# 1. Read header row — compare to JD column order
# 2. Count total rows, count by Cleaned? value (TRUE/DUPLICATE/ENRICHMENT_FAILED/empty)
# 3. Check for blank rows in the middle of data
# 4. Check for styled-but-empty rows inflating max_row
# 5. Verify column count matches JD for every data row
```

### 4b: Scoring Health

```python
# For each scored (non-DQ) row:
# 1. Re-derive Raw_Score from dimension scores × current weights
# 2. Compare to stored Raw_Score (±0.2 tolerance)
# 3. Re-derive Percentage from Raw_Score / Max_Score
# 4. Compare to stored Percentage
# 5. Re-derive Tier from Percentage
# 6. Compare to stored Tier
# 7. Check Tier-Verdict consistency
# 8. Verify Max_Score matches current JD formula
```

### 4c: Identity Health

```python
# For each row:
# 1. Check for duplicate names (case-insensitive)
# 2. Check for duplicate Public LI URLs (normalized)
# 3. Verify URL formats (public URL, LIR URL, Greenhouse URL)
# 4. Run slug-name sanity check on Public LI URLs
# 5. Check for DQ rows with non-zero scores
# 6. Check for non-DQ rows with zero Raw_Score
```

---

## Phase 5: Consistency Across Roles

Some rules must be the same across all JD files. Others must be different. Verify:

### Must Be Identical Across Roles:
- Column 1-4 meaning (Candidate, Greenhouse URL, Public LI URL, LIR URL)
- Auto_DQ = Yes → all scores 0, Tier F, Verdict Hard No
- Tier thresholds (A=≥80, B=65-79.99, C=50-64.99, D=35-49.99, F=<35)
- Verdict mapping (A→Strong Yes, B→Yes, C→Maybe, D→No, F→Hard No)
- Cleaned? column is always the LAST column
- Gujarat/Gujarati column exists in both (since SwiftSku requires Gujarat connection)
- openpyxl write pattern (backward-walk to find last row)
- Anti-detection rules (same REF file)

### Must Be Different Per Role (verify they actually differ correctly):
- Column count (AM=37, RC=40)
- Dimension names, weights, max scores
- Whether Source column exists (AM yes, RC no)
- Whether Base_Score + bonus columns exist (RC yes, AM no)
- Max possible value (AM=55.0, RC=52.8)
- Whether Percentage can exceed 100% (RC yes due to additive bonuses, AM no)
- Hindi_Signal column (AM only)
- DQ criteria (role-specific industries/patterns)

---

## Phase 6: Flowchart Accuracy

Read `_Agent_Flowchart.svg` and verify:
- Agent names match current file names
- File references are correct
- Flow arrows represent actual pipeline logic
- Quality gate labels match current thresholds (3 consecutive non-A, streak reset)
- No deprecated agents or flows are shown

If the flowchart is stale, note it but do NOT regenerate — just flag for manual update using `render_flowchart_svg.py`.

---

## Phase 7: Maintenance Checklist Completeness

Each file that contains a "Maintenance Checklist" or "Keep In Sync" section — verify that the listed items are actually complete and accurate. Are there cross-file dependencies that SHOULD be listed but aren't?

---

## Reporting Format

After completing ALL phases, produce a single structured report:

```
# Doctor Report — {date}

## Summary
- Files audited: {N}
- Issues found: {N} (Critical: {N}, High: {N}, Medium: {N}, Low: {N})
- Output file health: AM {status}, RC {status}

## Critical Issues (would corrupt data or break pipeline)
{numbered list with file, line, description, and fix}

## High Issues (would cause incorrect behavior)
{numbered list}

## Medium Issues (could confuse a Sonnet agent or cause inefficiency)
{numbered list}

## Low Issues (style, inconsistency, stale comments)
{numbered list}

## Output File Audit
### AM: _OUTPUT--Acct_Mgr.xlsx
- Total rows: {N}
- Tier distribution: A={N} B={N} C={N} D={N} F={N}
- Math errors found: {N}
- Duplicate candidates: {N}
- Uncleaned rows: {N}

### RC: _OUTPUT--Recruiting_Coord.xlsx
- (same structure)

## Clean Bill of Health
{list of things that were checked and ARE correct — so the human knows you actually verified them, not just skipped them}
```

---

## Rules For The Doctor

1. **Read EVERY active file before writing a single finding.** Context is everything. An apparent bug in one file might be intentional when you read another.

2. **Simulate, don't skim.** When checking Output_Cleanup.md, mentally execute each test against both AM and RC column schemas. Write out what column number each reference resolves to. If you can't determine the column number from the instructions alone, that IS a bug.

3. **Check the xlsx files programmatically.** Do not eyeball spreadsheet data. Write Python scripts with openpyxl to verify scoring math, column counts, and data integrity.

4. **Distinguish between "agent would be confused" and "agent would produce wrong output."** The first is Medium, the second is Critical/High.

5. **Every finding needs a specific file, line number (if applicable), and concrete fix.** "Output_Cleanup.md has some issues" is not a finding. "Output_Cleanup.md line 247: SC6 says A=80-100 but RC pct can exceed 100% — change to A=≥80" is a finding.

6. **Verify your own findings.** Before reporting a bug, re-read the relevant files to make sure you're not misunderstanding the design intent. Cross-reference at least two files before flagging.

7. **The Clean Bill of Health section is mandatory.** It proves you checked things, not just reported failures. If everything passes, say so explicitly.

8. **Do NOT make changes.** The Doctor diagnoses. The Doctor does not operate. Report findings and let the human decide what to fix and when.

9. **Run the full audit every time.** Even if "only one file changed," the Doctor runs all phases. One-line changes cascade.

10. **Be adversarial.** Ask yourself: "If a Sonnet agent with zero context about this project read this file cold and executed it literally against both AM and RC, what would go wrong?" That's your bar.
