# Error Log — Senior AM Pipeline (SwiftSku)

> **⚠️ STANDING INSTRUCTION — ALL AGENTS:** Any agent that encounters an error, unexpected behavior, or rule violation during a pipeline run MUST log it here before the session ends. This file is the canonical record of all pipeline failures. The chat log (`Z_Chat_Log--Agent_Maker.md`) is for architectural decisions only — errors go HERE.

---

## How to Log an Error

Every entry MUST include ALL of the following. No exceptions. More context is always better.

```
### ERR-[NNN] — [Short descriptive title]

**Timestamp:** YYYY-MM-DD HH:MM:SS ET (use `TZ='America/New_York' date`)
**Run:** [Source name from CSV Source column, e.g., "ACM Agents V3.4"]
**Phase:** [URL Extraction / Candidate Evaluation / CSV Cleanup / Self-Destruct / Startup / Quality Check]
**Agent:** [Which agent encountered or caused the error — Pipeline Orchestrator / URL Extractor / Candidate Evaluator / CSV Cleanup Agent]
**Severity:** [CRITICAL — data loss or rule violation / HIGH — wrong output, recovered / MEDIUM — unexpected behavior, no data loss / LOW — cosmetic or minor]

**What happened:**
[Detailed description. Include exact candidate names, URLs, row numbers, column values — anything that helps reconstruct the event. Don't summarize — be verbose.]

**Root cause:**
[Why it happened. If unknown, say "Unknown — needs investigation" and describe what you DO know.]

**Impact:**
[What was affected. Number of rows, candidates, scores. Was data lost? Was it recovered? How?]

**Resolution:**
[What was done to fix it. If unresolved, say "UNRESOLVED" and describe what needs to happen.]

**Prevention:**
[What architectural change would prevent this from recurring. Reference specific file + section if a fix has been applied.]
```

**Numbering:** Errors are numbered sequentially (ERR-001, ERR-002, ...) and never renumbered. If an error is later found to be a non-issue, mark it `[RETRACTED]` but don't delete or renumber.

**Who logs:** Any agent can log. The parent orchestrator (Pipeline Orchestrator) is responsible for logging errors from sub-agents. Sub-agents themselves should return error details in their verdict line so the parent can log them.

---

## Error Entries

### ERR-001 — CSV Cleanup Agent deleted 8 rows (NEVER DELETE rule violation)

**Timestamp:** 2026-03-20 ~02:00-04:00 ET (exact time not recorded — occurred during bulk processing)
**Run:** ACM Agents V3.4
**Phase:** CSV Cleanup (triggered during bulk processing)
**Agent:** CSV Cleanup Agent
**Severity:** CRITICAL — data loss, rule violation

**What happened:**
The CSV Cleanup Agent identified 8 rows as structurally broken (wrong column count, likely from unquoted commas in Location/Company fields). Instead of following the ⛔ NEVER DELETE rule, it deleted all 8 rows from the CSV outright. An additional 6 candidates that sub-agents failed to write were also missing, totaling 14 candidates requiring recovery.

**Root cause:**
Two internal contradictions in CSV_Cleanup_Agent.md gave the agent permission to delete despite the ⛔ rule:
1. Step 4.3 said "Remove the old broken row (this is a REPLACE, not a delete)" — agent interpreted "remove" as license to delete before re-evaluation succeeded.
2. Cleaned? section said "it gets re-evaluated **or deleted**" — directly contradicted the ⛔ NEVER DELETE rule on line 78.

**Impact:**
- 8 CSV rows deleted (candidate data lost temporarily)
- 14 total candidates required re-evaluation (8 deleted + 6 never written)
- All 14 recovered via re-evaluation, BUT scoring variance caused Nitinn B. to drop from A (87%) to B (79.8%) — see ERR-002

**Resolution:**
All 14 candidates re-evaluated and rows restored. CSV_Cleanup_Agent.md rewritten:
- Added ⛔⛔⛔ CRITICAL RULE banner at top of file
- Step 4 rewritten: leave broken row untouched during re-eval, only remove after verified replacement exists
- Fixed "or deleted" language in Cleaned? section
(See chat log entries 51)

**Prevention:**
- CSV_Cleanup_Agent.md hardened (done)
- Candidate_Evaluator.md now mandates Python `csv.QUOTE_ALL` for all writes (done) — reduces malformed rows that trigger cleanup in the first place

---

### ERR-002 — Scoring variance on re-evaluation (Nitinn B. A→B drift)

**Timestamp:** 2026-03-20 ~03:00-04:00 ET (during recovery from ERR-001)
**Run:** ACM Agents V3.4
**Phase:** CSV Cleanup (re-evaluation after row deletion)
**Agent:** Candidate Evaluator (sub-agent, second evaluation)
**Severity:** HIGH — score changed tier, A-rated candidate lost

**What happened:**
Nitinn B. scored A tier (87%) during the validation phase. After ERR-001 deleted his row, a fresh Candidate Evaluator sub-agent re-evaluated him and scored him B tier (79.8%) — just 0.2% below the A threshold. This meant the pipeline completed with zero A-rated candidates despite the search being validated WITH an A-rated candidate.

Palash Pal showed the opposite drift: C (53%) in validation → B (75.5%) on re-eval.

**Root cause:**
Sub-agent scoring is not perfectly deterministic. Different Sonnet instances reading the same LinkedIn profile weigh signals slightly differently. The ~7% swing on Nitinn B. is within expected variance but crossed a tier boundary.

**Impact:**
- Final run had 0 A-rated candidates (should have had ≥1)
- Pipeline terminated with "all pages exhausted" instead of continuing to find more A-rated
- Nitinn B.'s canonical score is now 79.8% B instead of 87% A

**Resolution:**
Scoring variance protection added:
- `search_handoff.json` now caches full validation verdicts (name, tier, score_pct, verdict, company, raw_score)
- CSV_Cleanup_Agent.md Step 4 now checks handoff file BEFORE re-evaluating — if candidate is in `top5_summary`, reconstruct from cached data instead of spawning a fresh CE sub-agent
(See chat log entry 52)

**Prevention:**
- Handoff file is now the canonical record of validation scores (done)
- Cleanup agent uses cached scores for validation candidates (done)
- Upstream fix: fewer malformed rows via QUOTE_ALL (done) means fewer re-evaluations needed

---

### ERR-003 — Sub-agents wrote malformed CSV rows (missing QUOTE_ALL)

**Timestamp:** 2026-03-20 ~01:00-04:00 ET (throughout the run)
**Run:** ACM Agents V3.4
**Phase:** Bulk Processing
**Agent:** Candidate Evaluator (multiple sub-agent instances)
**Severity:** HIGH — caused structural corruption triggering ERR-001

**What happened:**
Multiple Candidate Evaluator sub-agents wrote CSV rows using string concatenation or f-strings instead of Python's `csv` module. Fields containing commas (e.g., Location: "Ahmedabad, Gujarat, India") were not properly quoted, causing the row to have the wrong column count. This structural corruption is what the CSV Cleanup Agent detected and (incorrectly) tried to fix by deleting rows.

**Root cause:**
Candidate_Evaluator.md mentioned QUOTE_ALL but did not mandate a specific writing method. Sub-agents chose their own CSV writing approach, and many used string concatenation which doesn't handle commas in fields.

**Impact:**
- Unknown exact number of malformed rows (at least 8 detected by cleanup agent)
- Triggered ERR-001 (cleanup agent deleting rows)
- Cascade: ERR-001 → ERR-002 (scoring variance on re-eval)

**Resolution:**
Candidate_Evaluator.md Step 6 updated with:
- ⛔ mandatory Python `csv.QUOTE_ALL` instruction
- Explicit code example showing correct `csv.writer` usage
- Explicit ban on string concatenation, f-strings, echo commands for CSV writes
(See chat log entry 51)

**Prevention:**
- QUOTE_ALL mandate with code example (done)
- CSV Cleanup Agent validates column count as test S1 (existing)

---

### ERR-004 — LinkedIn URL extraction requires scroll-based DOM reading

**Timestamp:** 2026-03-20 ~01:30 ET
**Run:** ACM Agents V3.4
**Phase:** Bulk Processing (candidate URL collection)
**Agent:** Bulk Processor (Search Optimizer in bulk mode)
**Severity:** MEDIUM — no data loss, required workaround

**What happened:**
LinkedIn Recruiter's search results page uses a virtualized DOM that only renders ~7 candidate cards at a time. Attempting to extract all candidate URLs from a page at once only returned a partial list. Required scroll-based extraction: scroll down, read visible candidates, scroll again, repeat until all candidates on the page were captured.

**Root cause:**
LinkedIn Recruiter uses virtual scrolling for performance. DOM elements are created/destroyed as the user scrolls. This is standard LIR behavior, not a bug.

**Impact:**
- Slowed URL extraction (multiple scroll + read cycles per page)
- No data loss

**Resolution:**
Used `find` + `read_page` with incremental scrolling to extract all URLs.

**Prevention:**
Added to `LIR_Interface_Learnings.md` — virtual scrolling entry under "Search Results" section (done, verified 2026-03-20).

---

### ERR-005 — Browser tabs consumed by sub-agents

**Timestamp:** 2026-03-20 ~02:00-04:00 ET (intermittent throughout run)
**Run:** ACM Agents V3.4
**Phase:** Bulk Processing
**Agent:** Candidate Evaluator (sub-agents) / Bulk Processor (parent)
**Severity:** MEDIUM — no data loss, required tab recreation

**What happened:**
After a Candidate Evaluator sub-agent finished and was killed, the browser tab it had been using sometimes disappeared. The parent orchestrator had to re-create tabs and re-navigate to the search results page before spawning the next sub-agent.

**Root cause:**
Sub-agents may close or consume browser tabs during their execution. When the sub-agent process is killed, the tab state is not preserved.

**Impact:**
- Slowed processing (tab recreation + navigation overhead)
- No data loss

**Resolution:**
Parent orchestrator learned to check for tab existence before spawning next sub-agent and re-create if needed.

**Prevention:**
Added explicit instruction to Candidate_Evaluator.md Step 8: "Do NOT close the search results tab. Only close the candidate profile tab you opened." (Done, 2026-03-20.)

---

### ERR-006 — Percentage column missing `%` suffix (7 rows)

**Timestamp:** 2026-03-20 ~01:00-04:00 ET (throughout run and prior runs)
**Run:** ACM Agents V3.4 + prior runs
**Phase:** Candidate evaluation (CSV write)
**Agent:** Candidate Evaluator (multiple sub-agent instances)
**Severity:** LOW — cosmetic, no scoring impact

**What happened:**
7 rows in the CSV had Percentage values without the `%` suffix (e.g., `35.8` instead of `35.8%`). Affected candidates: Abhishek Kumar, Kunal Dasa, Anshika M., Harshad Parmar, Ushmita Rajput, Brijesh Khichadiya, Dipesh Patel.

**Root cause:**
Candidate_Evaluator.md formula section didn't explicitly specify the `%` suffix. Some sub-agents included it, others didn't.

**Impact:**
- Inconsistent formatting in CSV
- No scoring impact (math was correct)
- CSV Cleanup Agent's SC3 test didn't catch it (only checked numeric range, not `%` suffix)

**Resolution:**
- Fixed all 7 rows in CSV directly
- Updated SC3 test to require `%` suffix
- Updated Candidate_Evaluator.md Step 4 formula to explicitly say "include the `%` suffix"
(See chat log entry 53)

**Prevention:**
- SC3 test now validates `%` suffix (done)
- Candidate_Evaluator.md explicitly requires `%` (done)

---

### ERR-007 — LinkedIn Recruiter search URLs expire (session-bound tokens)

**Timestamp:** 2026-03-20 ~02:30 ET (after context compaction/session restart)
**Run:** ACM Agents V3.4
**Phase:** Bulk Processing (after self-destruct resume)
**Agent:** Bulk Processor
**Severity:** MEDIUM — no data loss, required navigation workaround

**What happened:**
After context compaction triggered a session restart, the LinkedIn Recruiter search URL from the previous session no longer worked. The `searchRequestId` token in the URL is session-bound and expires when the session ends. Navigating to the stale URL caused the page to hang on "Loading search results."

**Root cause:**
LinkedIn Recruiter search URLs contain session-scoped tokens. This is documented in LIR_Interface_Learnings.md but the Context_Legacy_Prompt.md template still records the URL, which can mislead the resumed session into trying to use it.

**Impact:**
- Delayed processing while navigating to LinkedIn Recruiter home → project → re-running search
- No data loss

**Resolution:**
Navigated via LinkedIn Recruiter home page → project → search link instead of using the stale URL.

**Prevention:**
- Already documented in LIR_Interface_Learnings.md
- Context_Legacy_Prompt.md template now includes stale URL warning: "The source URL above is likely STALE — navigate to LinkedIn Recruiter home → project → re-run the search" (done, 2026-03-20)

---

## 2026-03-20 20:30 ET — CE Failure: Ashok Parmar
- Profile URL: https://www.linkedin.com/talent/profile/AEMAACMngXAByIhAGiJ2HWZ38yxmkfIQwvxvPfQ
- Error: "You do not have access to this feature" on both attempts
- Action: Skipped candidate, no CSV row written
- Source: ACM Agents V5

## 2026-03-20 ~21:00 ET — GSheet Formatter Failure
- Error: Could not locate Senior_AM_Scorecard_Review Google Sheet
- The .gsheet shortcut file exists but couldn't be read
- Action: Skipped formatting (cosmetic, not blocking)
- Source: ACM Agents V5

# CSV Cleanup Error Log — _OUTPUT--Acct_Mgr.csv

## Run: PRE-FLIGHT Validation (2026-03-21)

### Summary
- **Total rows checked:** 26
- **Valid (all tests pass):** 0
- **Broken (I2b missing URL):** 26
- **Stuck (no URL extractable):** 0

### Issue Classification

#### Category 1: Missing Public LI URLs (26 rows) — **REQUIRES STEP 6 ENRICHMENT**
Test failing: **I2b** — "If LIR URL present, Public LI URL MUST be non-empty"

All 26 unchecked rows have this pattern:
- LIR URL: Present ✓
- Public LI URL: EMPTY ✗
- Auto_DQ: Y (all are auto-disqualified)
- Tier/Verdict: F/Hard No ✓
- Scoring: All zeros ✓

**Affected candidates:**
1. Row 137: CA Sidhant Puri (LIR: AEMAADlbO10Bj4C7HPmXRlrwxPwWMLQZTj4L2cU)
2. Row 138: Dipen Makwana
3. Row 139: Vishnu Charola
4. Row 157: Chintan Gosai
5. Row 161: Viral Vyas
6. Row 162: Himanshu Soni
7. Row 165: Jagruti S.
8. Row 170: Parth Patel
9. Row 171: Harshad Parmar
10. Row 172: Jasmin M.
11. Row 176: Natasha Shah
12. Row 180: Ushmita Rajput
13. Row 181: Harshil Vadgama
14. Row 182: Gunjan Vansjalia
15. Row 183: Shailesh Chudasama
16. Row 185: Umesh Patel
17. Row 188: Rbparekh Parekh
18. Row 189: MR CONSULTANTS (Founder)
19. Row 193: pooja maurya
20. Row 194: MEGHA KHATRI
21. Row 195: Bhavika Parmar
22. Row 197: Bhargav Chovatiya
23. Row 198: Hitesh Rathod
24. Row 199: Yagna Patel
25. Row 200: Akshat Desai
26. Row 202: Milan Raiyani

**Remediation:** These rows are structurally sound and scored correctly. They need Step 6b Chrome enrichment:
- Open each LIR URL in Chrome
- Mimic human browsing (scroll, wait)
- Extract public LinkedIn profile URL (visible on LIR page)
- Update Column 2 (Public LI URL)
- Write updated row to CSV
- Wait 45-200 seconds before next row

**Note:** All these candidates are **auto-disqualified** (Auto_DQ=Y), so the enrichment is a data-integrity step, not a re-evaluation. The missing public URL is likely just not captured during initial evaluation.

### Validation Statistics

**Structural Tests (S1-S3):**
- Column count: ✓ All have 40 columns
- Non-empty critical fields: ✓ All have Candidate, Source, Date, Scores
- No header duplication: ✓ None

**Identity Tests (I1-I4):**
- Candidate name exists: ✓ All (2+ chars)
- Public LI URL format: N/A (empty, which is OK for I1, but fails I2b)
- LIR URL format: ✓ All valid /talent/ URLs
- Source exists: ✓ All non-empty

**Timestamp Tests (T1-T2):**
- Date format: ✓ All YYYY-MM-DD HH:MM:SS
- Plausible dates: ✓ All 2026-03-19 or 2026-03-20

**Scoring Tests (SC1-SC7):**
- Raw_Score numeric: ✓ All are 0.0 (auto-DQ)
- Max_Score matches formula (40.4): ✓ All correct
- Percentage format: ✓ All are 0.0%
- Tier valid: ✓ All are F
- Verdict valid: ✓ All are Hard No
- Score-Tier consistency: ✓ F tier with 0.0%
- Score-Verdict consistency: ✓ Hard No with F tier

**Dimension Tests (D1-D9):**
- All dimension scores: ✓ All are 0 (consistent with Auto_DQ=Y)
- Weighted math: ✓ Correct (0 × weights = 0)

**Auto-DQ Consistency (A1-A3):**
- DQ → F tier: ✓ All Auto_DQ=Y have Tier=F and Verdict=Hard No
- DQ → zero scores: ✓ All have Dim1-Dim9 = 0
- Non-DQ has scores: N/A (all are DQ)

### Action Items

1. **Immediate:** Perform Step 6b Chrome enrichment for all 26 rows
   - Sequential processing (one row at a time)
   - Open LIR URL → scroll → extract public URL → write to CSV → close → wait 45-200s
   - After enrichment, mark each row as `Cleaned?` = TRUE

2. **Verification:** After enrichment complete, re-validate all 26 rows
   - Each row should now pass I2b (public URL non-empty)
   - Mark as VALID if all tests pass

### Notes

- **Pre-flight status:** This is a PRE-FLIGHT cleanup pass. No previous handoff file constraints apply.
- **No re-evaluation needed:** All candidates are auto-disqualified; enrichment is data-integrity only.
- **Handoff check:** None of the 26 candidates appear in search_handoff.json, so no cached scoring variance risk.
- **Risk level:** LOW — All rows are structurally sound, just missing one optional field (public URL).

---
**Log generated:** 2026-03-21 by CSV Cleanup Agent (pre-flight)

## 2026-03-21 ~03:30 ET — CE Failed: Shreya Gadani
- **Agent:** Candidate Evaluator (Sonnet)
- **Candidate:** Shreya Gadani (AEMAACp5FooB5EXc_Jz8w0iOdJJGgZvBT7xWaA)
- **Error:** "You do not have access to this feature" on both profile URL formats
- **Retries:** 2 (both failed)
- **Action:** Skipped candidate per error recovery protocol
- **Impact:** No CSV row written. run_total_count NOT incremented (candidate not evaluated).


## 2026-03-21 ~06:00 ET — CE Failed: PRINCE PRAVASI
- **Agent:** Candidate Evaluator (Sonnet)
- **Candidate:** PRINCE PRAVASI
- **Error:** Authentication/access error on both attempts
- **Retries:** 2 (both failed)
- **Action:** Skipped candidate per error recovery protocol


## 2026-03-21 ~07:05 ET — CE Failed: Mehul Bhatiya
- **Agent:** Candidate Evaluator (Sonnet)
- **Error:** 404/auth error on both attempts, search-embedded URL expired
- **Retries:** 2 (both failed)
- **Action:** Skipped


## 2026-03-22 ~06:00 ET — URL Extractor Failure (Batch 5)
- Error: LinkedIn Recruiter page load failed — persistent connection issue
- Action: Retrying once
- Source: ACM Agents V5.2

## V5.2 — CE #35 Pankit P. — Profile Access Denied
- **Time:** 2026-03-22
- **Agent:** CE sub-agent (Sonnet)
- **URL:** https://www.linkedin.com/talent/profile/AEMAACClCRmgBTFugC0db_4SNVT129vqDocbQbGU
- **Error:** LIR profile access denied on both attempts. "You do not have access to this feature."
- **Action:** Skipped candidate after 2 failed attempts per error recovery rules. No CSV row written.

## 2026-03-23 — CSV Cleanup Agent Run (Scheduled)

### Enrichment Exceptions (I2b — marked TRUE after failed enrichment attempt)
- **Row 446 (Yogesh Panjari):** Auto-DQ F-tier. LIR profile was inaccessible ("Unable to access"). Google search returned 5+ Yogesh Panjari profiles — no company/location to disambiguate. Enrichment not possible. Marked TRUE since DQ'd and enrichment was genuinely attempted.
- **Row 463 (PROFILE_ID_AEMAABv5n_YBQTpsbwyAjIXtT9ley0RrxR6mqOo):** Auto-DQ F-tier. Name is a profile ID, not a real name. No usable identifying info for Google search. Enrichment not possible. Marked TRUE since DQ'd and enrichment was genuinely attempted.

### Enrichment Successes
- **Row 386 (Akshay Khaire):** Public URL found via Google: `https://www.linkedin.com/in/akshay-khaire-4aa41428`
- **Row 449 (Shubham Sharma):** Public URL found via Google: `https://www.linkedin.com/in/shubham-sharma-0b2a5812a`

### Misplaced URL Fixes
- 8 rows had public LinkedIn URLs in LIR column (Col 3) — moved to Col 2, Col 3 cleared.

### Summary
CLEANUP | Checked: 512 | Valid: 502 | Rescored: 0 | Re-evaluated: 0 | Deduped: 0 | URLs filled: 2 | Names fixed: 0 | Stuck: 2 (marked TRUE) | Uncleaned: 0
