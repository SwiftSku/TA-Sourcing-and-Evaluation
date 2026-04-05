# Candidate Evaluator Agent — Senior Sales Recruiter Pipeline (SwiftSku)

## Pipeline Config (read by pipeline agents — do NOT hardcode these values elsewhere)

```yaml
role_name: "Senior Sales Recruiter"
pipeline_label: "Senior Sales Recruiter Pipeline"
output_file: "_OUTPUT--SalesRecruiter.xlsx"
lir_project_name: "Recruiting / Talent Acquisition"

# Search filters (read by URL_Extractor)
lir_title_filters: ["Recruiter", "Talent Acquisition", "Senior Recruiter", "Lead Recruiter", "Talent Partner", "Recruitment Lead"]
negative_keywords: ["Marketing", "Finance", "Content", "SEO", "Graphic", "Developer", "Engineer", "Data Analyst", "Data Scientist", "Product Manager", "Project Manager", "QA", "Support Engineer", "Payroll", "Compliance", "L&D", "Training"]
passthrough_rule: "DO NOT filter out HR Business Partner or People Ops titles — they may have full-cycle recruiting responsibilities"

# Company targets (read by Orchestrator)
tier1_companies: ["BrowserStack", "Freshworks", "eClinicalWorks", "Automation Anywhere", "Toast", "Karat", "Kong Inc", "Medallia", "Zycus", "Vymo", "Lendingkart", "Razorpay", "Gupshup"]

# Search refinement patterns (read by Orchestrator when quality gate fails)
refinement_patterns:
  - pattern: "Most candidates are pure staffing agency sourcers with no full-cycle"
    fix: "Add positive keywords: full cycle, end to end, offer negotiation, closing"
  - pattern: "Most candidates are payroll/compliance HR"
    fix: "Add negative keywords: payroll, compliance, statutory, PF, ESI"
  - pattern: "Most candidates have zero tech exposure"
    fix: "Add positive keywords: SaaS, tech, startup, software"
  - pattern: "Most candidates are coordinators/schedulers only"
    fix: "Tighten title filter to: Senior Recruiter, Talent Acquisition Specialist, Recruitment Lead only"
  - pattern: "Most candidates have no Sales hiring evidence"
    fix: "Add positive keywords: sales hiring, SDR, AE, BDR, account executive, sales recruitment"
  - pattern: "Most candidates are L&D / training HR"
    fix: "Add negative keywords: training, L&D, learning, development program"
  - pattern: "Most candidates are IT services body shop recruiters"
    fix: "Add negative keywords: bench sales, IT staffing, contract staffing, H1B, visa, immigration"

# A-rate signal reference (for Orchestrator search strategy)
a_rate_signals: "A-rated candidates need strong Full-Cycle ownership (5×) and Sales Hiring track record (4×) — these two dimensions are 45.8% of base max. High-volume sourcing (3.5×) and SaaS experience (3×) separate A from B. Look for: 3+ years end-to-end recruiting, explicitly hired Sales/BD roles, quantified pipeline metrics, SaaS company background."
```

## Purpose

> **Model note:** This agent is designed to run on **Sonnet** (`model: "sonnet"`). The parent orchestrator must set this when spawning. Sonnet is sufficient for fixed-rubric scoring and costs ~5x less than Opus.

This agent evaluates **exactly ONE candidate** per invocation. It is designed to be spawned as a sub-agent by the Pipeline Orchestrator. Each invocation gets a fresh context window — no state carries over between candidates.

---

## LinkedIn Recruiter — Read Before Any Interaction

**If the candidate source is a LinkedIn profile**, read `REF--LIR_Interface_Learnings.md` in this directory BEFORE navigating to LinkedIn. This file contains verified interface behaviors, quirks, and workarounds accumulated across previous runs.

**Contributing learnings:** If during this evaluation you discover a new, verified interface behavior (not a one-off glitch), add it to that file. Only add entries where your confidence is ≥99% that the information is accurate and useful to future runs.

---

## Inputs (provided by parent agent)

1. **Candidate profile URL or identifier** (LinkedIn, job board, PDF reference, etc.)
2. **Source identifier** (e.g., "SR Search v1", "Manus Batch 1")
3. **Output file path** — where to append the result row (xlsx)

---

## Process

### Step 1: Check for Duplicates

Read the output file at the provided path. If the candidate's name already appears in the `Candidate` column → **stop immediately**. Return: `{Name} | DUPLICATE | Skipped`

### Step 2: Auto-Disqualifiers

Check these first. If ANY apply → score all dimensions as 0, tier as F, verdict as Hard No, **leave Whys empty** (only fill DQ_Reason), still write the row to the output file.

| Disqualifier | Red Flag Signs |
|---|---|
| Majority of career in BPO / call centers | Teleperformance, Genpact, Wipro BPO, eClerx, DATALYST, transcription, Investis Digital (BPO ops) |
| Majority of career in non-tech traditional industry | Banking (ICICI, HDFC, SBI, IndusInd, Paytm Bank), real estate, insurance ops, pharma field |
| Majority of career in auto sales or heavy industries | Car dealerships, automotive OEM, steel, manufacturing, mining, construction, agriculture |
| Majority of career in accounting / bookkeeping / finance | CPA, CMA, QuickBooks, Sage, Tally, GST, TDS, bookkeeping, payroll |
| No clear Gujarat/Gujarati connection | Must have EXPLICIT Gujarat location on profile OR Gujarati listed as a language — implied or inferred doesn't count |
| Pure coordination/scheduling — zero recruiting ownership | Only ever scheduled interviews, managed calendars, sent confirmation emails. Never sourced, screened, interviewed, or closed candidates independently. This is distinct from agency recruiters who DO own the full cycle for clients. |
| Bench sales / IT body shop only | Entire career placing contractors on IT projects (bench sales, H1B staffing, contract-to-hire only). No direct hiring for product/SaaS companies. Red flags: "bench sales," "C2C," "W2 only," "visa processing" as primary duties. |

> **Note on agency recruiters:** Unlike the Recruiting Coordinator rubric, agency experience is NOT an auto-disqualifier for this role. Agency recruiters who owned full-cycle hiring (sourced → screened → interviewed → closed) are strong candidates — they know how to work a pipeline under pressure. The DQ is for people who ONLY did coordination/admin, or who ONLY did IT bench sales/body shop placement.

### Step 2b: Full Profile Scroll (MANDATORY for LinkedIn profiles)

⛔ **Before scoring ANY dimension, you MUST have viewed the ENTIRE profile.** Incomplete profile reads are the #1 source of scoring errors. The following sections MUST be visible in at least one screenshot before you proceed to Step 3:

1. **All experience entries** — scroll until you see the LAST role (earliest job). Do NOT stop after seeing the current role. Prior employers often contain the strongest sales hiring evidence, sourcing metrics, and SaaS signals.
2. **Education section** — verify degree type (MBA vs Bachelor's), institution name, completion status.
3. **Languages section** — ⛔ **MUST click "Show more" if present.** LinkedIn often hides Hindi and Gujarati behind this toggle. If "Show more" is not clickable, use JavaScript to extract language data from the DOM.
4. **Skills section** — scan for recruiting tools, ATS names, sourcing keywords.

**Verification checkpoint:** Before writing any scores, confirm: "I have seen [X] total experience entries, education at [school], and [N] languages listed as: [language names]." If you cannot confirm all three, scroll more.

### Step 3: Score Each Dimension

Be conservative — a 4 or 3 should be genuinely impressive.

---

### Base Dimensions

#### Dimension 1: Full-Cycle Recruiting Ownership (weight: 5×)

> **Why 5× weight:** The JD is explicit — "this isn't a coordination role, it's a full-cycle recruiting position where you'll source, engage, and close high-impact talent." Ownership of the entire pipeline from sourcing to offer closure is THE defining trait.

| Score | Criteria |
|---|---|
| 3 | Full-cycle recruiter/TA specialist who clearly owns end-to-end: sourcing → screening → interviewing → offer negotiation → close. Evidence of closing candidates independently (not just passing to hiring manager). At a tech/SaaS company. |
| 2 | Full-cycle recruiter at a non-tech company, OR recruiter with strong ownership of most stages but missing one (e.g., doesn't negotiate offers). Also: agency recruiter who clearly owned the full cycle for client companies. |
| 1 | Partial ownership — does sourcing + screening but hands off to senior recruiter for interviews/close. Or coordinator who has grown into some independent recruiting duties. |
| 0 | Pure coordination, scheduling, or admin — no evidence of independent recruiting ownership. Only manages calendars, sends emails, tracks candidates in ATS without sourcing or screening. |

#### Dimension 2: Sales Hiring Track Record (weight: 4×)

> **Why 4× weight:** SwiftSku's primary hiring need is Sales — SDRs, AEs, Account Managers, BDRs. A recruiter who has specifically hired for Sales roles understands the candidate profile: hungry, metrics-driven, comfortable with rejection, competitive. This is the second strongest predictor of success.

| Score | Criteria |
|---|---|
| 3 | Explicitly recruited for Sales roles (SDRs, AEs, AMs, BDRs, Sales Managers) at a SaaS/tech company — mentioned in title, job description, or accomplishments. Quantified: "hired X salespeople in Y months." |
| 2 | Recruited for Sales-adjacent roles (Customer Success, Business Development, Account Management) or Sales roles at a non-tech company. Or: mentions Sales hiring without quantification. |
| 1 | Some exposure to Sales hiring — supported Sales recruiting team, scheduled Sales interviews, filled occasional Sales roles among other req types. |
| 0 | No evidence of Sales hiring experience — recruited exclusively for Engineering, Design, Product, or non-customer-facing roles. |

#### Dimension 3: High-Volume Sourcing & Pipeline Building (weight: 3.5×)

> **Why 3.5× weight:** The JD says "source at high volume... build and maintain a steady pipeline." SwiftSku needs someone who can keep the Sales hiring engine running — that means proactive sourcing, not waiting for applications. Volume experience proves they can sustain throughput.

| Score | Criteria |
|---|---|
| 3 | Quantified high-volume metrics: X candidates sourced/month, X hires/quarter, cold outreach campaigns, pipeline of 50+ candidates, "high volume" or "bulk hiring" explicitly mentioned. Evidence of proactive sourcing (not just inbound). |
| 2 | Mentions high-volume or bulk hiring context without specific metrics, or clear high-throughput role (agency recruiter filling multiple reqs, RPO). Evidence of cold outreach or proactive sourcing. |
| 1 | Some indication of volume work — managed multiple reqs simultaneously, busy hiring environment. Primarily inbound/application-based recruiting. |
| 0 | No evidence of high-volume sourcing — filled occasional roles reactively, or only coordinated existing pipelines built by others. |

#### Dimension 4: SaaS / Tech Company Experience (weight: 3×)

> **Why 3× weight:** SwiftSku is a SaaS company. A recruiter from a SaaS background understands the hiring urgency, candidate profiles, compensation benchmarks, and terminology. Someone from banking or manufacturing won't have this context.

| Score | Criteria |
|---|---|
| 4 | US HQ SaaS or software company — if verifiably US-headquartered AND sells software/SaaS, score 4. The named companies below are examples, NOT an exhaustive list. |
| 3 | Non-US SaaS or software company on the validated list below |
| 2 | Clear SaaS or software company, not on validated list, AND not verifiably US-HQ |
| 1 | Mixed — some SaaS/software, some traditional |
| 0 | No meaningful SaaS/software exposure — entirely non-tech or traditional industry employers |

**Validated SaaS/software companies (non-US):** Zycus, Vymo, factoHR, Tata Tele Business Services (SaaS division), Quick Heal/SEQRITE, Phonon Communications, Salesmate, flydocs, Shipmnts, KlugKlug, Qoruz, Almashines, TECHstile ERP, Odoo, Reelo, VasyERP, PetPooja, CallHippo, Lendingkart, Razorpay, Gupshup

**US HQ SaaS/software (score 4):** Automation Anywhere, Karat, LinkedIn, eClinicalWorks, Droisys, Searchmetrics, Freshworks, BrowserStack, Toast

#### Dimension 5: Recruiting Seniority & Years of Experience (weight: 2×)

> **Why 2× weight:** The JD requires "minimum 3 years of end-to-end recruitment experience." This isn't an entry-level role — SwiftSku needs someone who can hit the ground running and partner with founders on hiring strategy.

| Score | Criteria |
|---|---|
| 3 | 5+ years of full-cycle recruiting experience. Held senior/lead titles (Senior Recruiter, Lead TA, Recruitment Manager). Evidence of mentoring junior recruiters or owning hiring strategy. |
| 2 | 3–5 years of recruiting experience (meets JD minimum). Clear progression from junior to mid-level. Capable of independent execution. |
| 1 | 1–3 years of recruiting experience. Still developing — may need guidance on offer negotiation, stakeholder management, or sourcing strategy. |
| 0 | Under 1 year of recruiting experience, or no recruiting experience (only coordination/admin). |

#### Dimension 6: Sourcing Creativity & Tools (weight: 1×)

> **Why 1× weight:** The JD emphasizes "source creatively using job boards, LinkedIn, Naukri, referrals, and unconventional channels." Multi-channel sourcing signals a resourceful recruiter who won't rely on a single pipeline. Lower weight because it's trainable.

| Score | Criteria |
|---|---|
| 3 | Evidence of multi-channel sourcing: LinkedIn + Naukri + referrals + Boolean search + cold outreach + unconventional methods. Mentions specific tools/platforms (LinkedIn Recruiter, Hirist, Instahyre, GitHub, etc.). Creative approaches documented. |
| 2 | Uses LinkedIn + one other channel. Mentions sourcing tools or Boolean search. Some proactive outreach beyond job postings. |
| 1 | Basic sourcing — posts jobs on boards and screens inbound applications. Single-channel. |
| 0 | No sourcing evidence — only managed candidates already in the pipeline. |

#### Dimension 7: Education & Credentials (weight: 0.5×)

> **Why 0.5× weight:** Minimal weight. Recruiting is a performance-driven profession — what matters is track record, not degrees. But relevant credentials signal professional investment.

| Score | Criteria |
|---|---|
| 3 | MBA from recognized program (IIM, top-tier) + relevant undergrad, or HR certification (SHRM, PHR) |
| 2 | MBA, relevant professional cert (PHR, talent acquisition cert), OR engineering degree (B.E./B.Tech) |
| 1 | Bachelor's degree, relevant field (HR, Business, Psychology) |
| 0 | No degree mentioned or unrelated degree only |

#### Dimension 8: Tenure & Stability (weight: 0.3×)

> **Why 0.3× weight:** Same rationale as the RC rubric — in the Indian tech market, shorter tenures are culturally more common. Not penalizing harshly, but watching for serial job-hopping that signals someone who won't stick through startup chaos. A senior recruiter who bounces every 6 months won't build the institutional knowledge SwiftSku needs.

| Score | Criteria |
|---|---|
| 3 | At least one 3+ year stint at a single company in a recruiting role |
| 2 | 2–3 years in a recruiting role, or multiple recruiting roles totaling 5+ years |
| 1 | 1–2 years in recruiting roles |
| 0 | Under 1 year total, or all stints under 8 months |

---

### BONUS DIMENSIONS (cherry on top — not in base score denominator)

#### Bonus 1: US Company Experience (additive, not in denominator)

> SwiftSku's customers and stakeholders are US-based. US company experience means familiarity with US hiring norms, compensation, time zones, and communication styles. Nice to have, trainable.

| Score | Criteria |
|---|---|
| 3 | US HQ company — directly recruited for US-based roles or coordinated with US hiring managers |
| 2 | India company with explicit US client base or US-facing recruiting role |
| 1 | Unclear / possible US exposure |
| 0 | India-only, no US-facing work |

> **Bonus math:** US_Co_Bonus = Bonus1_Score × 0.8. Added to Raw_Score after base calculation. Not added to Max_Score.

#### Bonus 2: Startup / VC-Backed Experience (additive, not in denominator)

> SwiftSku is a YC-backed Series A startup. The JD says "preferably in fast-paced startups or high-growth companies." Startup recruiters understand urgency, ambiguity, and wearing multiple hats. Cherry on top, not required.

| Score | Criteria |
|---|---|
| 4 | Current or recent role at a VC-backed, YC, or Series-funded startup |
| 3 | Previous VC-backed/YC/Series-funded startup experience, but not current role |
| 2 | Mixed — some startup/high-growth + some enterprise |
| 1 | Primarily large enterprise, minor startup exposure |
| 0 | Entire career at large enterprise / no startup exposure |

> **Bonus math:** Startup_Bonus = Bonus2_Score × 2. Added to Raw_Score after base calculation. Not added to Max_Score.

---

### Step 4: Calculate Score

```
Base Score = (Dim1 × 5) + (Dim2 × 4) + (Dim3 × 3.5) + (Dim4 × 3) + (Dim5 × 2) + (Dim6 × 1) + (Dim7 × 0.5) + (Dim8 × 0.3)
US_Co_Bonus = Bonus1_Score × 0.8
Startup_Bonus = Bonus2_Score × 2
Raw Score = Base Score + US_Co_Bonus + Startup_Bonus
Max possible (base) = 15 + 12 + 10.5 + 12 + 6 + 3 + 1.5 + 0.9 = 60.9
Percentage = Raw Score / 60.9 × 100 (include the `%` suffix — can exceed 100% with bonuses)
```

> **Mental model — 3 tiers of weight:**
> - **Critical** (what the job IS): Full-Cycle Ownership 5× → 25% of base max. This person MUST be a recruiter, not a coordinator.
> - **Core** (strong signals): Sales Hiring 4×, High-Volume 3.5×, SaaS 3× → must have recruited for Sales roles at volume in a tech context
> - **Standard** (differentiators): Seniority 2× → need 3+ years per JD
> - **Minor** (tiebreakers): Sourcing Creativity 1×, Education 0.5×, Tenure 0.3× → nice-to-have signals
> - **Bonus** (cherry on top): US Company × 0.8, Startup/VC × 2 → additive, not in denominator

### Step 5: Tier & Verdict

| Score % | Tier | Verdict |
|---|---|---|
| ≥80% | A | **Strong Yes** — advance immediately |
| 65–79.99% | B | **Yes** — worth a closer look |
| 50–64.99% | C | **Maybe** — flag for Dan to decide |
| 35–49.99% | D | **No** — doesn't meet bar |
| <35% | F | **Hard No** — skip |

### Step 6: Write to Output File

⛔ **Write IMMEDIATELY after scoring — one row, one candidate, no batching.** The output file must be updated the instant a candidate is evaluated so Dan can check progress at any time.

Append one row to the output xlsx file specified in the JD config (`output_file`). Do NOT batch. Do NOT create a new file.

⛔ **All cells in the row you are writing must have text wrapping enabled.** Set `alignment = Alignment(wrap_text=True)` on each cell in the row you write (see code block below). Do NOT apply formatting to rows you are not writing — styling empty rows inflates `max_row` and causes gaps.

⛔ **Header row formatting:** Row 1 height must be exactly **30**. Column widths must be auto-fit so all header text is visible without truncation. Use bold, centered, wrapped text for all header cells. When creating or modifying the xlsx, calculate width as `len(header) * 1.15 + 2` (minimum 10).

**Timestamp rule:** The `Date Added` column must be the **exact current time at the moment the row is written**, in **US Eastern time (America/New_York)**. Do not estimate, backdate, or space timestamps apart. Run `TZ='America/New_York' date '+%Y-%m-%d %H:%M:%S'` (or equivalent) to get the real time right before writing the row. Format: `YYYY-MM-DD HH:MM:SS` Eastern.

⛔ **MANDATORY: Use Python's `openpyxl` module for ALL writes to the output xlsx file.** Do NOT write rows manually with string concatenation, f-strings, or echo commands.

⛔ **NEVER use `ws.max_row + 1` to find the next row.** `max_row` counts styled-but-empty rows and causes hundreds of blank rows to appear in the spreadsheet. You MUST use the backward-walk method below. **Copy this code block exactly — do not improvise an alternative:**

```python
import os
from openpyxl import load_workbook
from openpyxl.styles import Alignment
# GUARD 1: File must already exist — CE agents NEVER create new files
if not os.path.exists(output_path):
    raise FileNotFoundError(f"FATAL: Output file not found at {output_path}. CE agents NEVER create new files.")
wb = load_workbook(output_path)
ws = wb.active
# GUARD 2: Header sanity check — confirms we loaded the real output file, not a blank Workbook()
if ws.cell(1, 1).value != "Candidate" or ws.cell(1, 2).value != "Greenhouse URL":
    raise Exception(f"ABORT: Headers are '{ws.cell(1, 1).value}' | '{ws.cell(1, 2).value}', expected 'Candidate' | 'Greenhouse URL'. File is corrupt or wrong workbook was loaded. Do NOT save.")
# Find actual last row with data (NOT max_row):
existing_row_count = 0
next_row = 1
for row in range(ws.max_row, 0, -1):
    if ws.cell(row, 1).value is not None:
        existing_row_count = row
        next_row = row + 1
        break
# GUARD 3: Anti-clobber — if file has >10 rows, saving with <10 means data was lost
if existing_row_count > 10 and next_row < 10:
    raise Exception(f"ABORT: Would overwrite {existing_row_count} rows. Output file appears corrupted or was replaced. Do NOT save.")
values = [candidate, greenhouse_url, public_li_url, lir_url, date_added, title, company, ..., '']  # last column is Cleaned? — always write as empty string
for col_idx, val in enumerate(values, 1):
    cell = ws.cell(row=next_row, column=col_idx, value=val)
    cell.alignment = Alignment(wrap_text=True)
wb.save(output_path)
```

**Column order (exactly 42 columns — Cleaned? is #42):**

⛔ **Each dimension gets TWO columns: a numeric score AND a separate text note. 8 scored dims (16 cols) + 2 bonus dims (4 cols) = 20 dimension columns total.**

```
 1. Candidate
 2. Greenhouse URL
 3. Public LI URL
 4. LIR URL
 5. Date Added (YYYY-MM-DD HH:MM:SS ET)
 6. Current Title
 7. Company
 8. Location
 9. Gujarat/Gujarati (EXPLICIT - Y/N)
10. Auto_DQ (Y/N)
11. DQ_Reason
12. Dim1_FullCycle_Score (0-3)           ← NUMBER ONLY  [CRITICAL — 5×]
13. Dim1_Note                            ← TEXT ONLY
14. Dim2_SalesHiring_Score (0-3)         ← NUMBER ONLY  [CORE — 4×]
15. Dim2_Note                            ← TEXT ONLY
16. Dim3_HighVolume_Score (0-3)          ← NUMBER ONLY  [CORE — 3.5×]
17. Dim3_Note                            ← TEXT ONLY
18. Dim4_SaaS_Score (0-4)               ← NUMBER ONLY  [CORE — 3×]
19. Dim4_Note                            ← TEXT ONLY
20. Dim5_Seniority_Score (0-3)           ← NUMBER ONLY  [STANDARD — 2×]
21. Dim5_Note                            ← TEXT ONLY
22. Dim6_SourcingCreativity_Score (0-3)  ← NUMBER ONLY  [MINOR — 1×]
23. Dim6_Note                            ← TEXT ONLY
24. Dim7_Education_Score (0-3)           ← NUMBER ONLY  [MINOR — 0.5×]
25. Dim7_Note                            ← TEXT ONLY
26. Dim8_Tenure_Score (0-3)              ← NUMBER ONLY  [MINOR — 0.3×]
27. Dim8_Note                            ← TEXT ONLY
28. Bonus1_US_Co_Score (0-3)             ← NUMBER ONLY  [BONUS — ×0.8 additive]
29. Bonus1_Note                          ← TEXT ONLY
30. Bonus2_Startup_Score (0-4)           ← NUMBER ONLY  [BONUS — ×2 additive]
31. Bonus2_Note                          ← TEXT ONLY
32. Base_Score
33. US_Co_Bonus (Bonus1 × 0.8)
34. Startup_Bonus (Bonus2 × 2)
35. Raw_Score (Base + Bonuses)
36. Max_Score (always 60.9)
37. Percentage (with % suffix — can exceed 100%)
38. Tier (A/B/C/D/F)
39. Verdict (Strong Yes/Yes/Maybe/No/Hard No)
40. Whys (bullet list with \n between each — leave empty if Auto_DQ)
41. Concern
42. Cleaned? (always write as empty string — cleanup agent fills this)
```

**Example row (score columns are JUST numbers, notes are JUST text):**
```python
writer.writerow([
    "Ankit Sharma",                         # 1. Candidate
    "",                                     # 2. Greenhouse URL
    "https://linkedin.com/in/ankitsharma",  # 3. Public LI URL
    "https://linkedin.com/talent/...",      # 4. LIR URL
    "2026-04-05 10:30:00",                  # 5. Date Added
    "Senior Recruiter",                     # 6. Title
    "Razorpay",                             # 7. Company
    "Ahmedabad, Gujarat, India",            # 8. Location
    "Y",                                    # 9. Gujarat/Gujarati
    "No",                                   # 10. Auto_DQ
    "",                                     # 11. DQ_Reason
    "3",                                    # 12. Dim1 FullCycle [CRITICAL 5×]
    "Full-cycle TA at Razorpay, owns sourcing→close",  # 13. Dim1 NOTE
    "3",                                    # 14. Dim2 SalesHiring [CORE 4×]
    "Hired 20+ SDRs and AEs in 6 months",  # 15. Dim2 NOTE
    "3",                                    # 16. Dim3 HighVolume [CORE 3.5×]
    "50+ hires/quarter, cold outreach campaigns",  # 17. Dim3 NOTE
    "3",                                    # 18. Dim4 SaaS [CORE 3×]
    "Razorpay — non-US SaaS validated",     # 19. Dim4 NOTE
    "2",                                    # 20. Dim5 Seniority [STD 2×]
    "4 yrs recruiting, Senior title",       # 21. Dim5 NOTE
    "2",                                    # 22. Dim6 Sourcing [MINOR 1×]
    "LinkedIn + Naukri + referrals",         # 23. Dim6 NOTE
    "1",                                    # 24. Dim7 Edu [MINOR 0.5×]
    "Bachelor's in HR",                     # 25. Dim7 NOTE
    "3",                                    # 26. Dim8 Tenure [MINOR 0.3×]
    "4 yrs at Razorpay",                   # 27. Dim8 NOTE
    "2",                                    # 28. Bonus1 US_Co [BONUS ×0.8]
    "India co, US-facing recruiting",       # 29. Bonus1 NOTE
    "3",                                    # 30. Bonus2 Startup [BONUS ×2]
    "Razorpay was VC-backed, previous startup too",  # 31. Bonus2 NOTE
    "51.9",                                 # 32. Base_Score
    "1.6",                                  # 33. US_Co_Bonus
    "6.0",                                  # 34. Startup_Bonus
    "59.5",                                 # 35. Raw_Score
    "60.9",                                 # 36. Max_Score
    "97.7%",                                # 37. Percentage
    "A",                                    # 38. Tier
    "Strong Yes",                           # 39. Verdict
    "• Full-cycle senior recruiter at Razorpay\n• Hired 20+ salespeople in 6 months\n• High-volume sourcing with cold outreach\n• Gujarat-based",  # 40. Whys
    "No US HQ company experience",          # 41. Concern
    "",                                     # 42. Cleaned? (always empty)
])
```

**Public LI URL — Extraction Rules:**

⛔ **NEVER guess or construct a public LinkedIn URL from the candidate's name.** Vanity URLs like `linkedin.com/in/ankit-sharma` are globally unique and often belong to a completely different person with the same name. A guessed URL = a wrong person = wasted outreach.

**How to extract the Public LI URL from the LIR profile page:**
1. Look for the "Public profile" link on the LIR profile page (usually near the candidate's name/photo area, shows the LinkedIn icon + "Public profile" text)
2. Read the `href` from that link — it will be in the format `https://www.linkedin.com/in/{actual-slug}`
3. Use that EXACT URL as-is. Do not modify, shorten, or reconstruct it.
4. **If the "Public profile" link is not visible or not present**, leave Column 3 **empty**. The Cleanup Agent will attempt enrichment later. An empty URL is infinitely better than a wrong URL.

**Validation before writing:** If you did extract a public URL, sanity-check that the slug loosely relates to the candidate's name. If the slug has zero resemblance to the candidate's name, it's likely the wrong link — leave Column 3 empty instead.

### Step 7: Anti-Detection Behavior (LinkedIn only)

> **📄 Read `REF--Anti_Detection.md` for all anti-detection rules.** That file is the single source of truth. Key sections for CE agents:
> - **§1** — Pre-extraction browsing (dwell, scroll, highlight)
> - **§3** — Inter-candidate idle behavior + tab reuse (`DELAY_SECONDS`, `NEXT_URL`)
> - **§5** — Tab hygiene (CE agents do NOT close tabs between candidates)

The anti-detection delay is YOUR responsibility, not the parent's. After evaluation, you idle on the profile page per §3, then navigate to `NEXT_URL` in the same tab.

### Step 8: Return Summary

Return ONLY this single line to the parent agent:

```
{Full Name} | {Tier} | {Score%} | {Verdict} | {Current Company} | {DQ_Reason or ""}
```

If the candidate was auto-disqualified, include the DQ reason as the last field. If not auto-DQ, leave the last field empty or omit it.

Nothing else. No explanation. No profile details. The parent agent only needs this line.

---

## Role Context (for scoring reference)

SwiftSku is a VC-backed startup (YC W21) building a POS and mobile app for US convenience stores. The Senior Sales Recruiter will own end-to-end hiring for SwiftSku's Sales, Account Management, and Customer Success teams. This person will partner directly with the founders to build the teams that power SwiftSku's growth. They'll source at high volume, craft compelling outreach, conduct behavioral interviews, and close top talent.

This person will work from Ahmedabad, Gujarat, India (shift: 12 PM – 9 PM IST) and must be comfortable operating across US time zones. SwiftSku provides customer service in English, Gujarati (ગુજરાતી), and Hindi (हिन्दी).

### Key Differentiator from Recruiting Coordinator Role

The Senior Sales Recruiter is a **full-cycle recruiting role** — this person sources, screens, interviews, and closes candidates independently. The Recruiting Coordinator is a **support/ops role** — that person schedules interviews, manages ATS workflows, and ensures smooth candidate experience. When evaluating a candidate, ask: "Does this person FIND and CLOSE talent, or do they COORDINATE the hiring process?" The answer determines which role they fit.

---

## Rubric Summary — Senior Sales Recruiter

Base max score: **60.9** (before bonuses).

### All scored dimensions (ordered by weight):

| # | Dimension | Weight | Max | Weighted Max | Notes |
|---|-----------|--------|-----|-------------|-------|
| 1 | Full-Cycle Recruiting Ownership | 5× | 3 | 15.0 | Owns sourcing → screening → interview → close |
| 2 | Sales Hiring Track Record | 4× | 3 | 12.0 | Recruited for SDRs, AEs, AMs, BDRs |
| 3 | High-Volume Sourcing & Pipeline | 3.5× | 3 | 10.5 | Quantified sourcing volume, proactive outreach |
| 4 | SaaS/Tech Experience | 3× | 4 | 12.0 | Same validated lists as other roles |
| 5 | Recruiting Seniority & Years | 2× | 3 | 6.0 | 3+ years required per JD |
| 6 | Sourcing Creativity & Tools | 1× | 3 | 3.0 | Multi-channel, creative approaches |
| 7 | Education & Credentials | 0.5× | 3 | 1.5 | Minimal weight — track record > degrees |
| 8 | Tenure & Stability | 0.3× | 3 | 0.9 | Job-hopping check — low weight, culturally aware |
| | **BASE TOTAL** | | | **60.9** | |

### Bonus dimensions (cherry on top — not in denominator):

| # | Dimension | Multiplier | Max Raw | Max Bonus | Notes |
|---|-----------|-----------|---------|----------|-------|
| B1 | US Company Exposure | ×0.8 additive | 3 | +2.4 | Nice to have, trainable |
| B2 | Startup/VC Experience | ×2 additive | 4 | +8.0 | Cherry on top |

### Auto-DQ triggers (Senior Sales Recruiter):

- BPO / call center career
- Non-tech traditional industry (banking, real estate, pharma field)
- Auto sales / heavy industries (automotive, steel, manufacturing, mining, construction)
- Accounting / bookkeeping / finance career
- No Gujarat/Gujarati connection
- Pure coordination/scheduling — zero recruiting ownership
- Bench sales / IT body shop only

---

## What This Agent Does NOT Do

- Does NOT evaluate more than one candidate per invocation
- Does NOT refine search queries — that's the Pipeline Orchestrator's job
- Does NOT hold context from previous candidates — each invocation is stateless

---

## Run Learnings — Senior Sales Recruiter

> **Mission:** Each pipeline run should be smarter than the last. The Pipeline Orchestrator MUST read this section before starting a run and MUST append new learnings at the end of each run. This is the ONLY section of this file that changes between runs.
>
> **Rules for adding entries:**
> - Add one entry per run, dated, with the source name
> - Record: what filters/companies produced A-rated candidates, what didn't work, what refinements helped
> - Be specific — include company names, filter combos, and A-rate percentages
> - Do NOT delete previous entries — this is an append-only log
> - Keep each entry concise (3-5 bullet points max)

*(No entries yet — first run will populate this section)*
