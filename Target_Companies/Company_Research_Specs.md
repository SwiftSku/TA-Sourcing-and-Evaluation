# Company Research Specs — SwiftSku Target Account List

## Purpose

This document defines which companies SwiftSku targets when sourcing candidates for its India-based hiring pipelines (Senior Account Manager and Recruiting Coordinator roles). It also documents the structure and logic behind `_OUTPUT-Target_Companies.xlsx`.

---

## Company Preferences

### Must-Haves

- **B2B SaaS**: The company must sell software-as-a-service to businesses. No hardware-only, consumer, or non-tech companies.
- **Gujarat / Ahmedabad Presence**: The company must have employees (ideally an office or engineering center) in Gujarat, India — with Ahmedabad as the strongest signal. This is the labor market SwiftSku recruits from.

### Strong Preferences

- **US-Headquartered**: US HQ companies score highest (SaaS Score = 4) because their employees are most likely to have worked US sales cycles, US tooling, and US communication norms.
- **VC-Backed / High-Growth Startup**: Indicates a performance-driven culture, quota-carrying sales teams, and familiarity with startup operating cadence — all of which transfer well to SwiftSku.
- **Serves US Customers**: Employees at companies selling into the US market are more likely to understand US buyer personas, time zones, and outbound workflows.
- **Outbound Sales Motion**: Companies whose sales teams actively do outbound prospecting (cold calls, cold emails, SDR/BDR functions) produce candidates with directly transferable skills for SwiftSku's pipeline.
- **High-Volume Cold Calling (100+ per day)**: The gold standard. Companies that expect their SDRs to make 100+ outbound activities/calls per day produce the highest-caliber outbound reps.

### Deprioritized

- **India-Only Customer Base**: Still valid for Gujarat presence, but candidates may lack US-market experience.
- **Product-Led Growth (PLG) Only**: Companies like Atlassian that famously have no outbound sales team. Candidates from these companies are less likely to have cold-calling experience.
- **Non-SaaS / Services Companies**: IT staffing firms, consultancies, etc. are generally excluded unless they have a clear SaaS product.

---

## Tier System

| Tier                        | Meaning                                                                                                                     | Source                                                                  |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Tier 1 (AM + RC)**        | Proven top-producing companies for both Account Manager and Recruiting Coordinator pipelines. Hardcoded in both JD configs. | `JD--Acct_Mgr.md` and `JD--Recruiting_Coord.md` `tier1_companies` lists |
| **Tier 1 (AM only)**        | Proven for Account Manager pipeline only. Hardcoded in AM JD config but not RC.                                             | `JD--Acct_Mgr.md` `tier1_companies` list                                |
| **Tier 2 (Research)**       | Discovered through company research. High confidence Gujarat presence verified via LinkedIn.                                | `Company Research Agent`                                                |
| **Validated SaaS (US)**     | Appears on the validated US HQ SaaS company list in the AM scoring rubric. Gujarat presence not yet confirmed for all.      | `JD--Acct_Mgr.md` scoring rubric                                        |
| **Validated SaaS (Non-US)** | Appears on the validated non-US SaaS company list. Typically India-HQ'd B2B SaaS with Gujarat presence.                     | `JD--Acct_Mgr.md` scoring rubric                                        |
| **New Addition**            | Manually added by Dan; not yet categorized into a pipeline tier.                                                            | Direct request                                                          |

---

## _OUTPUT-Target_Companies.xlsx — Column Reference

| #   | Column                      | Type            | Description                                                                                                                                                                                                                  |
| --- | --------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Company**                 | Text            | Company name                                                                                                                                                                                                                 |
| 2   | **Tier**                    | Text            | Tier classification (see Tier System above)                                                                                                                                                                                  |
| 3   | **Source**                  | Text            | Where this company was sourced from (`JD Config`, `Company Research Agent`, `JD Rubric`, `LinkedIn URL provided`)                                                                                                             |
| 4   | **US_HQ**                   | Yes/No          | Is the company headquartered in the US?                                                                                                                                                                                      |
| 5   | **B2B_SaaS**                | Yes/No          | Is this a B2B SaaS company?                                                                                                                                                                                                  |
| 6   | **Serves_US_Customers**     | Yes/No          | Does the company sell to US-based customers?                                                                                                                                                                                 |
| 7   | **Gujarat_Presence**        | Yes/No/Possible | Does the company have employees or offices in Gujarat, India?                                                                                                                                                                |
| 8   | **Gujarat_City**            | Text            | Specific city in Gujarat (usually Ahmedabad)                                                                                                                                                                                 |
| 9   | **VC_Backed_Startup**       | Yes/No          | Is the company VC-backed, PE-backed, or a high-growth startup?                                                                                                                                                               |
| 10  | **Approx_Size**             | Text            | Approximate employee count range                                                                                                                                                                                             |
| 11  | **SaaS_Score_AM**           | Number (0-4)    | Score a candidate from this company would receive on the SaaS/Software dimension in the **AM rubric** (Dim 2, weight 2.5×). 4 = US HQ SaaS, 3 = Non-US validated or Tier 1 non-US SaaS, 2 = clear SaaS not on validated list |
| 12  | **SaaS_Score_RC**           | Number (0-4)    | Score for the **RC rubric** SaaS dimension (Dim 4, weight 3×). Same 4/3/2 scale but the RC JD's US HQ SaaS list explicitly includes BrowserStack, Freshworks, and Toast                                                      |
| 13  | **Notes**                   | Text            | Free-form notes about the company and its relevance                                                                                                                                                                          |
| 14  | **Outbound_Sales_Degree**   | Text            | How much the company's sales team relies on outbound prospecting: Very High, High, Medium, Low, or Low (PLG)                                                                                                                 |
| 15  | **Outbound_Proof**          | Text            | Evidence snippet (<15 words) with hyperlink to source                                                                                                                                                                        |
| 16  | **100+_Cold_Calls_Per_Day** | Yes/No/Unknown  | Whether the company's SDRs/BDRs are expected to make 100+ cold calls or outbound activities per day                                                                                                                          |
| 17  | **Cold_Call_Proof**         | Text            | Evidence snippet (<15 words) with hyperlink to source (primarily from job descriptions)                                                                                                                                      |

---

## Scoring Context (AM Pipeline)

When a candidate is evaluated, their current/previous company affects their score via the **SaaS/Software** dimension (2.5x weight):

- **Score 4**: Current company is onΩz mmhmm the validated US HQ SaaS list
- **Score 3**: Current company is on the validated non-US SaaS list
- **Score 2**: Works in SaaS/software but company not on either validated list
- **Score 1**: Non-SaaS/software company

Additionally, candidates from **Tier 1 companies** receive implicit priority because the pipeline agents are configured to flag them for immediate review.

---

## How to Add a New Company

1. Confirm it is B2B SaaS
2. Check for Gujarat/Ahmedabad presence (LinkedIn is the best source)
3. Determine US HQ status and whether they serve US customers
4. Research their sales motion — look for SDR/BDR job postings to assess outbound degree and cold call volume
5. Assign a tier based on pipeline relevance
6. Add a row to `_OUTPUT-Target_Companies.xlsx` with all 17 columns populated
7. If the company should be a Tier 1 target, update the `tier1_companies` list in the relevant JD config file(s)

---

## Current Stats

- **Total Companies**: 44
- **Tier 1 (AM + RC)**: 8 companies
- **Tier 1 (AM only)**: 6 companies
- **Tier 2 (Research)**: 9 companies
- **Validated SaaS (US)**: 3 companies
- **Validated SaaS (Non-US)**: 17 companies
- **New Addition**: 1 company
