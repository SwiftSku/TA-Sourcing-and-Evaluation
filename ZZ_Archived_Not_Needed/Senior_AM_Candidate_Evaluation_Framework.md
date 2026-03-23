# Senior AM Candidate Evaluation Framework — SwiftSku

## How to Use This Framework

**Input:** Any source containing candidate profiles — a LinkedIn Recruiter search URL, a regular LinkedIn URL, a PDF resume or candidate list, a document, or any other format. The framework applies regardless of source.

**Quantity:** Review however many candidates are specified. If no quantity is specified, review all candidates across all pages or all profiles in the source.

**Output:** For each candidate, score them against the dimensions below, write one row to `Senior_AM_Scorecard_Review.csv`, and output the summary scorecard block.

---

## Role Context

SwiftSku is a VC-backed startup (YC) building a POS and mobile app for US convenience stores, on a mission to reshape the C-store industry at venture scale. The Senior AM will own relationships with US convenience store owners, working remotely from India. SwiftSku provides customer service in English, Gujarati (ગુજરાતી), and Hindi (हिन्दी) — which is the direct reason Gujarati language and Gujarat location are hard requirements for this role. We are looking for people who are ambitious, thrive in high-growth startup environments, and have a track record of working at companies with high standards — not large enterprises or slow-moving orgs. Strong SaaS CS/AM experience, relationship management skills, and US company exposure are required.

---

## Step 1: Auto-Disqualifiers

Check these first. If ANY apply → **Hard No**, stop evaluating.

| Disqualifier | Red Flag Signs |
|---|---|
| Majority of career in BPO / call centers | Teleperformance, Genpact, Wipro BPO, eClerx, DATALYST, transcription, Investis Digital (BPO ops) |
| Majority of career in accounting / bookkeeping / finance | CPA, CMA, QuickBooks, Sage, Tally, GST, TDS, bookkeeping, payroll, AM at CA/CPA firm; red flag keywords: Receivable, Taxation, Audit, Reconciliation |
| Majority of career in auto sales or heavy industries | Car dealerships, automotive OEM, steel, manufacturing, mining, construction, agriculture; red flag keywords: Pharmaceuticals, Purchasing, export, Professor |
| Majority of career in non-tech traditional industry | Banking (ICICI, HDFC, SBI, IndusInd, Paytm Bank), real estate CRM, pharma KAM (GSK, Cipla, AstraZeneca) |
| Renewals Manager (primary/only title) | Title signals churn-prevention ops, not relationship management; flag unless backed by strong CS/AM titles elsewhere |
| No clear Gujarat/Gujarati connection | Must have EXPLICIT Gujarat location on profile OR Gujarati listed as a language — implied or inferred doesn't count; Hard No if neither is present |
| Already in SwiftSku Greenhouse ATS | — |
| Zero SaaS exposure across entire career | No tech company, product, or platform anywhere |

---

## Step 2: Score Each Dimension

Be conservative — a 4 or 3 should be genuinely impressive.

### Dimension 1: SaaS Experience (weight: 3×)

US-headquartered SaaS companies are meaningfully better than India-based ones for this role.

| Score | Criteria |
|---|---|
| 4 | US HQ SaaS company (Automation Anywhere, Karat, LinkedIn, eClinicalWorks, Droisys, Searchmetrics, etc.) |
| 3 | Non-US SaaS company on the validated list below |
| 2 | Clear SaaS company, not on validated list |
| 1 | Mixed — some SaaS, some traditional |
| 0 | Minimal SaaS exposure (passes zero-SaaS disqualifier but barely) |

**Validated SaaS companies (non-US):** Zycus, Vymo, factoHR, Tata Tele Business Services (SaaS division), Quick Heal/SEQRITE, Phonon Communications, Salesmate, flydocs, Shipmnts, KlugKlug, Qoruz, Almashines, TECHstile ERP, Odoo, Reelo, VasyERP, PetPooja, CallHippo

**US HQ SaaS (score 4):** Automation Anywhere, Karat, LinkedIn, eClinicalWorks, Droisys, Searchmetrics

### Dimension 2: Title Match — CS / AM (weight: 2×)

| Score | Criteria |
|---|---|
| 3 | Account Manager, Customer Success Manager, Client Success, CSM, Sr. CSM, Sr. AM — primary title |
| 2 | Business Development with account management flavor; or Customer Experience, Solutions Consultant |
| 1 | Sales with some account management flavor |
| 0 | Pure sales, engineering, operations, or support only |

> **Note:** Business Development titles can score a 2 if the role clearly involved retention/expansion of existing accounts, but never a 3 — core CS/AM titles are preferred. Renewals Manager as the sole title is an auto-disqualifier (see Step 1).

### Dimension 3: US Company Experience (weight: 2×)

| Score | Criteria |
|---|---|
| 3 | US HQ company (Automation Anywhere, Karat, LinkedIn, eClinicalWorks, etc.) |
| 2 | India company with explicit US client base or US-facing role |
| 1 | Unclear / possible US exposure |
| 0 | India-only, no US-facing work |

### Dimension 4: Tenure & Stability (weight: 0.5×)

| Score | Criteria |
|---|---|
| 3 | 4+ consecutive years in a single CS/AM role |
| 2 | 2–4 years in CS/AM, or multiple CS/AM roles totaling 5+ years |
| 1 | 1–2 years in CS/AM roles |
| 0 | Under 1 year of CS/AM experience |

### Dimension 5: Education & Credentials (weight: 0.7×)

| Score | Criteria |
|---|---|
| 3 | MBA from recognized program (IIM, top-tier) + relevant undergrad |
| 2 | MBA or PMP/CSPO or equivalent professional cert |
| 1 | Bachelor's degree, relevant field |
| 0 | No degree mentioned or unrelated degree only |

### Dimension 6: Job Market Signals (weight: 1×)

| Score | Criteria |
|---|---|
| 3 | "Open to Work" badge visible + recently active |
| 2 | Recent job change or activity suggesting openness |
| 0 | No signals either way OR clearly settled — treated identically |

### Dimension 7: Location Fit — Gujarat (weight: 1×)

> If a candidate doesn't have an explicit Gujarat location or Gujarati language listed, they are already auto-disqualified before reaching this dimension. Everyone scored here has a clear, explicit Gujarat/Gujarati signal.

| Score | Criteria |
|---|---|
| 4 | Currently based in Ahmedabad |
| 2 | Currently based in other Gujarat city (Vadodara, Surat, Rajkot, Gandhinagar, etc.) |
| 1 | Based elsewhere in India but Gujarati explicitly listed as a language |

> **Positive signal:** Hindi (हिन्दी) listed as a language is a bonus — SwiftSku serves customers in English, Gujarati, and Hindi. Not required, but note it.

### Dimension 8: Startup / VC-Backed Experience (weight: 1×)

SwiftSku is targeting venture-scale outcomes. Prefer candidates who have worked in ambitious, high-growth environments — not just large enterprises.

| Score | Criteria |
|---|---|
| 4 | Current or recent role at a VC-backed, YC, or Series-funded startup |
| 3 | Previous VC-backed/YC/Series-funded startup experience, but not current role |
| 2 | Mixed — some startup/high-growth + some enterprise |
| 1 | Primarily large enterprise, minor startup exposure |
| 0 | Entire career at large enterprise / no startup exposure |

### Dimension 9: KAM Performance Evidence (weight: 1×)

Look for measurable proof of account growth activities — this is what the role will require daily at SwiftSku.

| Score | Criteria |
|---|---|
| 3 | Explicit quantified metrics: upsell %, cross-sell revenue, retention rate, expansion ARR, feature adoption %,  NPS, or similar |
| 2 | Mentions upselling, cross-selling, account expansion, or retention work — but no hard numbers |
| 1 | Implied account management responsibilities, no growth/retention evidence |
| 0 | No evidence of account growth or retention work |

---

## Step 3: Calculate Score

```
Raw Score = (Dim1 × 3) + (Dim2 × 2) + (Dim3 × 2) + (Dim4 × 0.5) + (Dim5 × 0.7) + (Dim6 × 1) + (Dim7 × 1) + (Dim8 × 1) + (Dim9 × 1)
Max possible = 12 + 6 + 6 + 1.5 + 2.1 + 3 + 4 + 4 + 3 = 41.6
Percentage = Raw Score / 41.6 × 100 (include the `%` suffix when writing to CSV, e.g., `85.8%` not `85.8`)
```

---

## Step 4: Tier & Verdict

| Score % | Tier | Verdict |
|---|---|---|
| 80–100% | A | **Strong Yes** — advance immediately |
| 65–79% | B | **Yes** — worth a closer look |
| 50–64% | C | **Maybe** — flag for Dan to decide |
| 35–49% | D | **No** — doesn't meet bar |
| <35% | F | **Hard No** — skip |

---

## Step 5: Scorecard Output

All candidate reviews must be logged in **`Senior_AM_Scorecard_Review.csv`**, located in the same directory as this file. This is the one and only CSV for this role — do not create a new CSV under any circumstances. Always append to the existing file.

**Rule 1 — Check before reviewing:** Before evaluating any candidate, check the CSV first. If their name already appears in the Candidate column — stop. Do not re-review and do not alter the file.

**Rule 2 — Log everyone, no exceptions:** Every candidate reviewed must be written to the CSV — strong yes, hard no, auto-disqualified, incomplete profile, every single one. There is no outcome that skips the CSV update.

**Rule 3 — Write to CSV immediately after each candidate:** Do not batch. After every single profile is reviewed, update the CSV before moving on to the next candidate.

**Rule 4 — LinkedIn URLs are columns 2 and 3:** Column 1 is the candidate's full name. Column 2 (`Public LI URL`) is their **public LinkedIn profile URL** (e.g., `https://www.linkedin.com/in/username`). Column 3 (`LIR URL`) is the **internal LinkedIn Recruiter URL** (or other source URL). If the source does not include a public profile URL, search for it and add it. If not found, leave column 2 empty.

One row per candidate. All scores, notes, and verdict go in the CSV. No chat output is required — the CSV update is the only output.

---

## Process & CSV Learnings — ACM SYS PT.1 (Mar 2026)

**LinkedIn Recruiter search URLs expire within minutes.** The `searchRequestId` token is session-bound. If a URL goes stale, navigate to LinkedIn Recruiter directly and re-run the search with the same filters. See `LIR_Interface_Learnings.md` for details.

**The CSV lives in the TA-ACM folder** — the same directory as this file. In pipeline mode, sub-agents receive the CSV path from the parent orchestrator. In standalone mode, request the TA-ACM folder via `request_cowork_directory` at the start of the session.

**CSV column order (as of Mar 2026):**
`Candidate, Public LI URL, LIR URL, Source, Date Added (YYYY-MM-DD HH:MM:SS), Current Title, Company, Location, Gujarat/Gujarati, Auto_DQ, DQ_Reason, Dim1–Dim9 scores/notes, Raw_Score, Max_Score, Percentage, Tier, Verdict, Why_1, Why_2, Why_3, Concern, Hindi_Signal`

**Always check for duplicates before writing.** Cross-reference the candidate's name against the Candidate column before scoring. If already present (any source), skip entirely — do not re-score or overwrite.

**Timestamp rule:** The `Date Added` column must be the **exact current time at the moment the row is written**, in **US Eastern time (America/New_York)**. Run `TZ='America/New_York' date '+%Y-%m-%d %H:%M:%S'` right before writing. Do not estimate, backdate, or space timestamps apart. Format: `YYYY-MM-DD HH:MM:SS` Eastern. *(Canonical rule — also stated in Candidate_Evaluator.md Step 6.)*

**Auto-DQ rows still get written to CSV** with all dimension scores as 0 and Tier F / Hard No. Never skip a candidate from the CSV regardless of outcome.

---

## Search Pattern Learnings — ACM SYS PT.1 (Mar 2026)

> Observations from reviewing 25 LinkedIn Recruiter results to inform future search filter tuning.

**Signal-to-noise was very low (~2/25 passed auto-DQ).** The dominant false-positive patterns were:

| Pattern | Frequency | Notes |
|---|---|---|
| E-commerce marketplace KAM (Amazon/Flipkart seller mgmt) | Very high | Looks like "KAM" on surface but is seller ops, not SaaS CS |
| Telecom enterprise AM (Vodafone Idea, Airtel) | High | Enterprise AM title but non-tech industry |
| Digital marketing / media agency AM | High | "Account Manager" title maps to agency client mgmt, not SaaS |
| Auto/heavy industry KAM (Michelin, Schindler) | Medium | Traditional KAM, zero SaaS |
| Banking AM (ICICI, Paytm) | Medium | Explicit auto-DQ companies surfacing frequently |
| IT staffing/recruiting AM | Medium | "US Account Manager" title but it's staffing ops |
| BPO/call center ops | Medium | Contact center agents appearing due to "customer" keywords |

**Two candidates passed and scored well:**
- **Ruchit Shah** (A, 85%) — Strategic AM at eClinicalWorks (explicitly listed US HQ SaaS), 4 yrs, Ahmedabad, open to work. Best find of the batch.
- **Divya Mistry** (B, 77%) — Asst CSM at Adit (US dental SaaS), Surat. Junior but clean SaaS CS trajectory.

**Recommended search filter improvements:**
- Add negative keywords: "marketplace", "seller", "Flipkart", "Amazon seller", "telecom", "Vodafone", "Airtel", "media sales", "radio", "coal", "tiles", "cement", "Michelin", "Schindler"
- Add positive keywords or required companies: validated SaaS list companies, "eClinicalWorks", "Automation Anywhere", "Zoho", "Salesforce", "HubSpot", "Freshworks"
- Tighten title filter to: "Customer Success", "CSM", "Account Manager" — exclude "Sales Manager", "BD Manager", "Growth Manager"

---

## Calibration Reference — Dan's Top 9

> Scores below were calculated under the original formula (max 30). Re-run with updated formula (max 41.6) when re-evaluating. Location Fit (Dim7), Startup Exp (Dim8), KAM Metrics (Dim9), and Gujarat disqualifier were not applied to this cohort — verify each candidate's location and startup background before advancing.

| Candidate | Score (legacy) | Tier | Verdict | Location | Snapshot |
|---|---|---|---|---|---|
| Nichola Pandian | 28/30 (93%) | A | Strong Yes | ⚠️ Verify | Manager CS @ Karat → Principal CSM @ LinkedIn → Automation Anywhere → Zycus; IIM Bangalore; 4 validated US SaaS companies; 16+ yrs. Best in pool. |
| Maulesh Patel | 25/30 (83%) | A | Strong Yes | ⚠️ Verify | Sr. CSM @ Automation Anywhere 7+ consecutive years; MSc CS from London Met; technical background (software eng → CS); most stable tenure in group. |
| Abhivyakti Srivastava | 21/30 (70%) | B | Yes | Vadodara, Gujarat ✅ | AM → Sr. CSM @ Automation Anywhere (4+ yrs) + CSM @ Vymo; PMP/CSPO/MBA; clean SaaS trajectory — caution: 8+ yrs eClerx BPO before pivot. |
| Arun Joshi | 20/30 (67%) | B | Yes | ⚠️ Verify | ~8 yrs @ SEQRITE (Quick Heal cybersecurity SaaS); MBA; strong quota attainment (125%); caution: just 2 months into new role at TrendAI, more sales-flavored than CS. |
| Amit Vashisth | 19/30 (63%) | C | Maybe | ⚠️ Verify | Sr. Manager Key Accounts @ Tata Teleservices 7+ yrs + ex-Quick Heal/SEQRITE; MBA; both validated companies but telecom enterprise sales, not pure SaaS CS; low LI engagement. |
| Hetshree Kangad | 15/30 (50%) | C | Maybe | ⚠️ Verify Gujarat explicitly | CSM @ KlugKlug + Qoruz + Almashines (influencer mktg/EdTech); 5+ yrs CS; MSc ICT from DAIICT (Gandhinagar) — education in Gujarat but current location and Gujarati language must be explicitly confirmed on profile before advancing. |
| Divyesh Vyas | 14/30 (47%) | D | No | ⚠️ Verify | CSM @ factoHR + Bacancy + Hidden Brains; MBA; factoHR is validated SaaS but Bacancy/Hidden Brains are dev shops, diluting profile. |
| Sanket Vohra | 13/30 (43%) | D | No | ⚠️ Verify | Sr. CSM @ Automation Anywhere 3.5 yrs (good) but 15+ yrs BPO/transcription prior (Investis Digital, DATALYST); BPO skills dominate; borderline disqualifier. |
| Dhaval Shah | 8/30 (27%) | F | Hard No | ⚠️ Verify | CSM @ eVitalRx (pharmacy SaaS); weak overall SaaS pedigree, no US exposure, thin credentials. |
