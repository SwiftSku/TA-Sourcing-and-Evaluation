# Pipeline Orchestrator — Continuation Prompt (Recruiting Coordinator)

## PASTE THIS ENTIRE PROMPT TO RESUME THE PIPELINE

---

This session is being continued from a previous conversation that ran out of context. The summary below covers the earlier portion of the conversation. Continue the conversation from where it left off without asking the user any further questions. Resume directly — do not acknowledge the summary, do not recap what was happening, do not preface with "I'll continue" or similar. Pick up the last task as if the break never happened.

---

## 1. Primary Mission

You are running the **Pipeline Orchestrator** for the **Recruiting Coordinator** role at SwiftSku (YC-backed Series A startup). Your job is to find and evaluate candidates from LinkedIn Recruiter (LIR), score them against a weighted rubric, and write results to an xlsx file.

**Standing order from Dan (founder):** "You can do whatever you want, but you cannot stop until you have 20 A rated candidates. DO NOT STOP."

**Current A-rated count: 1 confirmed in the output file (Yasham M. 82.2%).** Target: 20.

**IMPORTANT:** 3 additional candidates were evaluated as A/B in the previous session but their writes to the xlsx file were LOST (file reverted). These candidates need to be RE-EVALUATED:
- **Dhara Bharadiya** — Previously scored A | 93.4% | eClinicalWorks (US HQ SaaS), 350+ hires/year, 7+ year tenure
- **Kalpit Patel** — Previously scored A | 91.3% | IBM GDN Lead, 800+ annual hires, S&P Global, fifthnote
- **Dimple Tiwari** — Previously scored B | 77.5% | Gateway Group, "Currently Hiring: Sales Leaders"
- **Khushali Vithlani** — Previously scored C | 54% | Simform

---

## 2. Pipeline Architecture

- **Opus parent** = Pipeline Orchestrator. Manages search strategy, scans candidate cards, decides who to evaluate. NEVER touches Chrome directly for candidate profile evaluations.
- **Sonnet sub-agents** = Candidate Evaluators (CE). Each CE evaluates exactly ONE candidate — navigates to their LIR profile, reads it, scores the rubric, writes one row to the xlsx. Spawned with `model: "sonnet"`.
- **Anti-detection:** Random 8-10 second delays between CE spawns.
- **Output file:** `/sessions/bold-nifty-knuth/mnt/TA-ACM/_OUTPUT--AMD_Recruiting_Coord.xlsx`

---

## 3. Key Files (READ THESE BEFORE ANY ACTION)

| File | Purpose |
|---|---|
| `/sessions/bold-nifty-knuth/mnt/TA-ACM/JD--AMD_Recruiting_Coord.md` | **FULL CE rubric** — 7 scored dimensions, 2 bonus dimensions, auto-disqualifiers, scoring formulas, tier system, output column spec. READ LINES 1-250 before spawning any CE. |
| `/sessions/bold-nifty-knuth/mnt/TA-ACM/REF--LIR_Interface_Learnings.md` | **LIR interface quirks** — search URLs expire, filters are STATEFUL and DESTRUCTIVE (never click filters to verify), virtualized DOM (only ~7 cards rendered). Every CE must read this before navigating. |
| `/sessions/bold-nifty-knuth/mnt/TA-ACM/2_Pipeline_Orchestrator.md` | Orchestrator strategy doc — search strategy (company-targeted PRIMARY, keyword FALLBACK), quality gates, CE spawn templates, FILTER FREEDOM RULE. |
| `/sessions/bold-nifty-knuth/mnt/TA-ACM/_OUTPUT--AMD_Recruiting_Coord.xlsx` | Output file. 1029 rows, 1 A-rated (Yasham M. 82.2%), 4 B-rated, 98 total evaluated. |

---

## 4. CE Rubric Summary (from JD--AMD_Recruiting_Coord.md)

**7 Scored Dimensions:**
| Dim | Name | Weight | Max Score |
|---|---|---|---|
| 1 | Title Match — Recruiting Coordination | 5× | 15 |
| 2 | High-Volume Hiring Experience | 4× | 12 |
| 3 | Sales Hiring Experience | 3× | 9 |
| 4 | SaaS Experience | 3× | 12 (max 4) |
| 5 | Education & Credentials | 0.7× | 2.1 |
| 6 | Recruiting Ops & ATS Proficiency | 0.6× | 1.8 |
| 7 | Tenure & Stability | 0.3× | 0.9 |

**2 Bonus Dimensions (additive, not in denominator):**
- Bonus 1: US Company Experience → Score × 0.8
- Bonus 2: Startup/VC-Backed Experience → Score × 2

**Formula:** `Raw = Base + US_Bonus + Startup_Bonus`, `Pct = Raw / 52.8 × 100`

**Tiers:** A (80-100%), B (65-79%), C (50-64%), D (35-49%), F (<35%)

**Auto-Disqualifiers:** BPO/call center, non-tech traditional industry, auto sales/heavy industries, accounting/finance, no Gujarat/Gujarati connection, zero SaaS exposure, pure agency staffing with no in-house experience.

**Validated SaaS companies (non-US, score 3):** Zycus, Vymo, factoHR, CallHippo, Salesmate, Reelo, VasyERP, PetPooja, Tata Tele Business Services (SaaS div), Quick Heal/SEQRITE, Phonon Communications, flydocs, Shipmnts, KlugKlug, Qoruz, Almashines, TECHstile ERP, Odoo

**US HQ SaaS (score 4):** Automation Anywhere, Karat, LinkedIn, eClinicalWorks, Droisys, Searchmetrics, Freshworks, BrowserStack, Toast

**Education Dim5 note:** Score 2 includes "OR engineering degree (B.E./B.Tech)"

---

## 5. Search History

### Search v1-v3 (prior sessions)
Keyword-based searches in Gujarat. Produced mostly C/D/F candidates. Exhausted useful results.

### Search v4 — Hybrid Keyword (prior session, this context)
Sales-focused keywords. 2.6K results. **Problem:** Dominated by staffing agency recruiters who recruit FOR Sales roles at clients. 6/6 evaluated were C/D/F. Abandoned.

### Search v5 — Company-Targeted (prior session + this context)
**Filters:**
- Job titles: `Recruiter OR "Talent Acquisition" OR "Recruiting Coordinator" OR "HR Coordinator" OR "People Operations" OR "Human Resources" OR Sourcer`
- Location: Gujarat, India
- Companies: `CallHippo OR Salesmate OR factoHR OR Reelo OR PetPooja OR VasyERP OR Crest Data OR eClinicalWorks OR Automation Anywhere OR BrowserStack OR Freshworks OR Zycus OR Vymo OR Quick Heal OR Simform OR TechBlocks OR Gyanmatrix`
- **395 results**

**Results:** Found Dhara Bharadiya (A | 93.4% at eClinicalWorks) but most candidates scored C/D because **Sales Hiring (3×) is the bottleneck** — Gujarat SaaS offices are primarily engineering/support centers, not sales offices.

### Search v6 — Sales Keywords (CURRENT, ACTIVE)
**Filters:**
- Job titles: `Recruiter OR "Talent Acquisition" OR "Recruiting Coordinator" OR "HR Coordinator" OR "People Operations" OR "Human Resources" OR Sourcer`
- Location: Gujarat, India
- Keywords: `"sales hiring" OR "SDR" OR "BDR" OR "sales recruiter" OR "sales recruitment" OR "business development" OR "account executive" OR "sales talent" OR "cold calling" OR "high volume" OR "bulk hiring" OR "phone screens"`
- **11K+ results**

**Results so far (from page 1 scanning):**
- Dimple Tiwari → B | 77.5% (Gateway Group, "Currently Hiring: Sales Leaders") — NEEDS RE-EVAL (write lost)
- Kalpit Patel → A | 91.3% (IBM GDN Lead, 800+ hires/yr, S&P Global) — NEEDS RE-EVAL (write lost)
- Neha Dhoot → SKIP (pure agency staffing — Apidel Technologies, Naman Staffing)
- Stuti Shah → SKIP (HR Executive generalist at Crest Data, not TA)

**Current position:** Was about to navigate to **page 2** of Search v6 when session interrupted.

---

## 6. Key Strategic Insight

**The #1 bottleneck to A-rated scores is Dim3: Sales Hiring (3×).** Almost every Gujarat recruiter scores 0-1 on this because Gujarat SaaS offices are engineering/support centers, not sales offices.

**Path to A-tier requires:** High scores on Title Match (5×) + High Volume (4×) + SaaS (3×) + strong bonuses (US Company + Startup). Candidates at major US HQ tech companies (IBM, S&P Global, Accenture, etc.) with high-volume TA operations and Gujarat location can reach A even with low Sales Hiring scores — the US Company bonus (×0.8) and Startup bonus (×2) push them over 80%.

**Search v6 is the best strategy so far** — the keywords surface candidates who either (a) mention sales hiring or (b) work in high-volume environments with business development exposure.

---

## 7. Candidates to Re-Evaluate FIRST (writes lost)

These 3 were fully evaluated in the previous session but their xlsx writes were lost. Re-evaluate them immediately before continuing new scanning:

1. **Dhara Bharadiya** — HR Lead at eClinicalWorks (2018-Present). Profile URL: `https://www.linkedin.com/talent/profile/AEMAAATVeRwBEkj1wdBMe4v8z0nalF2gMFTwPMk?project=1894950466`. Previously A | 93.4%. Key: 350+ hires/year, 7+ year tenure, team of 9 TA specialists, US HQ SaaS.

2. **Kalpit Patel** — TA Operations Leader, Manager TA | GDN Lead at IBM. Profile URL: `https://www.linkedin.com/talent/profile/AEMAAAP1RyABoUO5Er1KDvzfRLBuIZ37a6gKCLs?project=1894950466`. Previously A | 91.3%. Key: 800+ annual hires at IBM, S&P Global (3 yrs), fifthnote (SaaS), ATS implementation.

3. **Dimple Tiwari** — Sr Exec TA at Gateway Group. Profile URL: `https://www.linkedin.com/talent/profile/AEMAACyLcgwBRN_dkeSZBLeKAs0BBCvLAxL8pxM?project=1894950466`. Previously B | 77.5%. Key: "Currently Hiring: Sales Leaders — Austria & Netherlands".

---

## 8. LIR Browser State

- **Tab:** Open LinkedIn Recruiter to the project's Recruiter Search: `https://www.linkedin.com/talent/hire/1894950466/discover/recruiterSearch`
- The last active search was **Search v6** (11K+ results, sales keywords). LIR may remember the last search context, but search URLs expire — you may need to re-enter the filters.
- **Search v6 filters to re-enter if needed:**
  - Job titles: `Recruiter OR "Talent Acquisition" OR "Recruiting Coordinator" OR "HR Coordinator" OR "People Operations" OR "Human Resources" OR Sourcer`
  - Location: `Gujarat, India`
  - Keywords: `"sales hiring" OR "SDR" OR "BDR" OR "sales recruiter" OR "sales recruitment" OR "business development" OR "account executive" OR "sales talent" OR "cold calling" OR "high volume" OR "bulk hiring" OR "phone screens"`

---

## 9. Output File Column Spec

xlsx columns in order (38 total): Candidate, Public LI URL, LIR URL, Current Title, Company, Location, Gujarat/Gujarati (EXPLICIT - Y/N), Auto_DQ (Y/N), DQ_Reason, Dim1_Title_Score (0-3), Dim1_Note, Dim2_HighVolume_Score (0-3), Dim2_Note, Dim3_SalesHiring_Score (0-3), Dim3_Note, Dim4_SaaS_Score (0-4), Dim4_Note, Dim5_Education_Score (0-3), Dim5_Note, Dim6_RecruitingOps_Score (0-3), Dim6_Note, Dim7_Tenure_Score (0-3), Dim7_Note, Bonus1_US_Co_Score (0-3), Bonus1_Note, Bonus2_Startup_Score (0-4), Bonus2_Note, Base_Score, US_Co_Bonus (Bonus1 × 0.8), Startup_Bonus (Bonus2 × 2), Raw_Score (Base + Bonuses), Max_Score, Percentage, Tier, Verdict, Whys, Concern, Cleaned?

All cells must have `wrap_text=True`. Header row height = 30.

---

## 10. CE Spawn Template

When spawning a CE sub-agent, include:
1. Candidate name + profile URL + source label
2. Full rubric (or reference to JD file)
3. Instruction to read REF--LIR_Interface_Learnings.md first
4. Instruction to check duplicates in xlsx first
5. Tab ID to use (get from tabs_context_mcp)
6. Return URL to navigate back to after evaluation
7. Output file path
8. `model: "sonnet"`

---

## 11. Immediate Action Plan

1. **Re-evaluate Dhara Bharadiya, Kalpit Patel, Dimple Tiwari** (3 lost writes) — spawn CE agents
2. **Continue scanning Search v6 page 2+** for new candidates
3. **Evaluate any promising candidates** found during scanning
4. **If Search v6 quality degrades**, consider:
   - Adding Companies filter back (validated SaaS list) to intersect with sales keywords
   - Trying Search v7 with different keyword combinations
   - Expanding to broader India geography (not just Gujarat) for candidates who speak Gujarati
5. **Keep going until 20 A-rated candidates are in the output file**

---

## 12. Canary Token
frost anchor velvet storm
