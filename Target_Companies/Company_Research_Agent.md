# Company Research Agent — SwiftSku Target Company Discovery

> **This is a standalone, manually triggered flow.** Run it any time you want to discover new target companies. It is NOT part of the candidate pipeline — run it separately, review the results, then update the JD file's `tier1_companies` list before starting a pipeline run.

## Model

Runs on `model: "sonnet"`.

---

## How to Invoke

Tell the agent:

```
You are a company research agent. Read your instructions at:
[FULL PATH to Target_Companies/Company_Research_Agent.md]

Also read the company research specs at:
[FULL PATH to Target_Companies/Company_Research_Specs.md]

The active JD file is:
[FULL PATH to [active JD file]]

The target companies Excel file is at:
[FULL PATH to Target_Companies/_OUTPUT-Target_Companies.xlsx]
```

---

## Instructions

Your job is to find US-headquartered B2B SaaS companies with offices or significant employee presence in Gujarat, India (especially Ahmedabad, Vadodara, Gandhinagar, Surat, Rajkot).

### How to Research

⛔ **Use WebFetch and WebSearch tools for ALL research. Do NOT open Chrome/browser.** The browser is only for logged-in LinkedIn Recruiter interactions (which this agent does NOT do). Web fetch handles everything below.

1. Use WebSearch to find companies on LinkedIn matching the `lir_title_filters` from the active JD config + Gujarat/Ahmedabad. Note which COMPANIES appear repeatedly.
2. Use WebSearch for: "US SaaS companies Ahmedabad office", "SaaS companies Gujarat India", "US tech companies Vadodara"
3. Use WebSearch/WebFetch to check Wellfound/AngelList for SaaS startups with India/Gujarat offices
4. Use WebSearch/WebFetch to check G2/Capterra top SaaS companies, cross-reference with India office presence
5. Use WebSearch/WebFetch to check Glassdoor for US SaaS companies hiring in Ahmedabad/Vadodara

### Exclusions

**Already in the target companies Excel (DO NOT include these):**
Read `Target_Companies/_OUTPUT-Target_Companies.xlsx` column A to get all existing company names. Also read the `tier1_companies` list from the active JD file's Pipeline Config. Do not include any company already in either list.

### Output

Write new companies directly to `Target_Companies/_OUTPUT-Target_Companies.xlsx` as new rows. Follow the 17-column schema defined in `Target_Companies/Company_Research_Specs.md`:

| Column | Value |
|--------|-------|
| Company | Company name |
| Tier | `Tier 2 (Research)` |
| Source | `Company Research Agent` |
| US_HQ | `Yes` or `No` |
| B2B_SaaS | `Yes` or `No` |
| Serves_US_Customers | `Yes`, `No`, or `Unknown` |
| Gujarat_Presence | `Yes`, `No`, or `Possible` |
| Gujarat_City | Specific city (e.g., `Ahmedabad`) |
| VC_Backed_Startup | `Yes`, `No`, or `Unknown` |
| Approx_Size | Employee count range (e.g., `1000-5000`) |
| SaaS_Score_AM | Score 0-4 per AM rubric (see Company_Research_Specs.md) |
| SaaS_Score_RC | Score 0-4 per RC rubric (see Company_Research_Specs.md) |
| Notes | Brief description of company and relevance |
| Outbound_Sales_Degree | `Very High`, `High`, `Medium`, `Low`, or `Low (PLG)` |
| Outbound_Proof | Evidence snippet with hyperlink (<15 words) |
| 100+_Cold_Calls_Per_Day | `Yes`, `No`, or `Unknown` |
| Cold_Call_Proof | Evidence snippet with hyperlink (<15 words) |

Use `openpyxl` to append rows. Match the formatting of existing rows (font, alignment, column widths are already set). Find the last data row by walking column A backwards — do NOT trust `ws.max_row`.

Aim for at least 10 new companies. Prioritize HIGH confidence (verified Gujarat office) over quantity.

### ⛔ Validation Requirements

Every company you include MUST have:

1. **Verified US HQ** — you must find a source confirming the company is US-headquartered (LinkedIn company page HQ field, Crunchbase, or company website "About" page). Indian-HQ SaaS companies (Zoho, Freshworks pre-2018, etc.) do NOT count unless they have since re-domiciled to the US.
2. **Verified Gujarat presence** — at least ONE of: (a) LinkedIn shows employees with Gujarat/Ahmedabad/Vadodara in their location at this company, (b) Glassdoor/Indeed shows open roles in Gujarat, (c) company website lists a Gujarat office. "India office" alone is NOT enough — it could be Bangalore/Hyderabad/Pune.
3. **B2B SaaS confirmed** — the company must sell software to businesses, not consumers. Check G2, Capterra, or company website.

For each company, record the SPECIFIC evidence for all 3 checks in the Notes column. Example:
  "US HQ per LinkedIn company page; 4 CSMs in Ahmedabad on LinkedIn; listed on G2 as B2B SaaS"

Companies where Gujarat presence could not be strongly verified should have `Gujarat_Presence` = `Possible` and should be appended LAST.

### Return Format

After writing to the xlsx, return a summary:

```
RESEARCH COMPLETE | {count} new companies added to _OUTPUT-Target_Companies.xlsx
High confidence: {high_count} | Medium/Possible: {medium_count}

New companies:
- {Name} | {Gujarat_City} | {Confidence}
- ...

Next step: Review the xlsx, then add any promising companies to the JD file's tier1_companies list before your next pipeline run.
```

---

## What This Agent Does NOT Do

- Does NOT evaluate or score candidates — that's the CE's job
- Does NOT modify search filters — that's the orchestrator's job
- Does NOT touch the candidate output xlsx files — it only writes to `_OUTPUT-Target_Companies.xlsx`
- Does NOT hold context between invocations — single-shot agent
- Does NOT run automatically during pipeline runs — manual trigger only
