# Company Research Agent — SwiftSku Candidate Pipeline

> **This agent runs IN PARALLEL with candidate processing.** Spawn it during Phase 0 and don't wait for it. Its results feed Tier 2 of the target company list.

## Model

Runs on `model: "sonnet"` — same as other sub-agents.

---

## Spawn Template

```
You are a company research agent. Read your instructions at:
[FULL PATH to Target_Companies/Company_Research_Agent.md]

Also read the company research specs at:
[FULL PATH to Target_Companies/Company_Research_Specs.md]

The active JD file is:
[FULL PATH to [active JD file]]

Return ONLY: RESEARCH | {count} companies found ({high_count} high, {medium_count} medium)
```

---

## Instructions (read by the sub-agent at runtime)

Your job is to find US-headquartered B2B SaaS companies with offices or significant employee presence in Gujarat, India (especially Ahmedabad, Vadodara, Gandhinagar, Surat, Rajkot).

### How to Research

1. Open Chrome. Search LinkedIn using the `lir_title_filters` from the active JD config + Gujarat/Ahmedabad. Note which COMPANIES appear repeatedly.
2. Search Google for: "US SaaS companies Ahmedabad office", "SaaS companies Gujarat India", "US tech companies Vadodara"
3. Search Wellfound/AngelList for SaaS startups with India/Gujarat offices
4. Search G2/Capterra top SaaS companies, cross-reference with India office presence
5. Check Glassdoor for US SaaS companies hiring in Ahmedabad/Vadodara

### Exclusions

**Already known (DO NOT include these):**
Read the `tier1_companies` list from the active JD file's Pipeline Config. Do not include any company already on that list.

### Output

Write results to `[FULL PATH]/Target_Companies/company_research.json` in this format:

```json
{
  "discovered_at": "YYYY-MM-DD HH:MM:SS",
  "companies": [
    {"name": "...", "hq": "...", "gujarat_city": "...", "confidence": "high/medium", "source": "where you found this"},
    ...
  ]
}
```

Aim for at least 10 new companies. Prioritize HIGH confidence (verified Gujarat office) over quantity.

### ⛔ Validation Requirements

Every company you include MUST have:

1. **Verified US HQ** — you must find a source confirming the company is US-headquartered (LinkedIn company page HQ field, Crunchbase, or company website "About" page). Indian-HQ SaaS companies (Zoho, Freshworks pre-2018, etc.) do NOT count unless they have since re-domiciled to the US.
2. **Verified Gujarat presence** — at least ONE of: (a) LinkedIn shows employees with Gujarat/Ahmedabad/Vadodara in their location at this company, (b) Glassdoor/Indeed shows open roles in Gujarat, (c) company website lists a Gujarat office. "India office" alone is NOT enough — it could be Bangalore/Hyderabad/Pune.
3. **B2B SaaS confirmed** — the company must sell software to businesses, not consumers. Check G2, Capterra, or company website.

For each company, record the SPECIFIC evidence for all 3 checks in the "source" field. Example:
  "source": "US HQ per LinkedIn company page; 4 CSMs in Ahmedabad on LinkedIn; listed on G2 as B2B SaaS"

Companies with only MEDIUM confidence (e.g., "I think they have a Gujarat office but couldn't verify") should be marked as such and placed LAST in the list. The orchestrator will search HIGH confidence companies first.

### Return Format

Return ONLY: `RESEARCH | {count} companies found ({high_count} high, {medium_count} medium)`

---

## Rules (for the Orchestrator)

- Spawned once during Phase 0, runs in parallel with Tier 1 company searches
- The orchestrator checks for `Target_Companies/company_research.json` existence before starting each new company search. If the file exists and has new companies, add them to the Tier 2 queue.
- If the research agent fails or returns 0 companies, log it and continue — Tier 1 alone is valuable
- Do NOT wait for this agent before starting Tier 1 searches

### ⛔ Orchestrator Validation Before Queuing Tier 2 Companies

When reading `Target_Companies/company_research.json`, the orchestrator MUST:

1. Skip any company missing the `source` field or where `source` is vague (e.g., "found online")
2. Queue `high` confidence companies before `medium` confidence companies
3. If a company-targeted search returns 0 results after 2 pages, remove it from the queue — the Gujarat presence claim was likely wrong
4. Log every Tier 2 company searched and its yield to the per-run chat log: `COMPANY_SEARCH: {company} | {candidates_found} | {a_count}A {b_count}B`

---

## What This Agent Does NOT Do

- Does NOT evaluate or score candidates — that's the CE's job
- Does NOT modify search filters — that's the orchestrator's job
- Does NOT touch the output xlsx — it only writes to `company_research.json`
- Does NOT hold context between invocations — single-shot agent
