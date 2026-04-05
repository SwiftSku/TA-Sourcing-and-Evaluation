# Resume Prompt — SwiftSku Candidate Pipeline

You are resuming a candidate evaluation pipeline that was interrupted. Follow these instructions exactly.

## Step 1: Read These Files (ONLY these — context budget is critical)

All files are in this directory: /sessions/wizardly-cool-brown/mnt/TA-ACM

**READ NOW:**
1. `2_Pipeline_Orchestrator.md` — your primary instructions
2. `REF--LIR_Interface_Learnings.md` — LinkedIn interface learnings (read before any LinkedIn interaction)
3. The active JD file's `Pipeline Config` block — for role-specific values

**Active JD file:** JD--Recruiting_Coord.md

**PATHS ONLY — do NOT read into your context:**
- `URL_Extractor.md` → URL extractor sub-agents read from disk, you pass the path
- `JD--Recruiting_Coord.md` → CE sub-agents read from disk, you pass the path
- `Output_Cleanup.md` → cleanup sub-agents read from disk, you pass the path
- `CE_Spawn_Template.md` → both orchestrator and cleanup read at spawn time, you pass the path
- `Target_Companies/Company_Research_Agent.md` → company research sub-agent reads from disk, you pass the path
- `_OUTPUT--Recruiting_Coord.xlsx` → sub-agents write here, you pass the path
- `Z_ChangeLog-AgentMaker.md` → update at end of run only
- `Z_Pipeline_Error_Log.md` → log errors here, do NOT read past errors

## Step 2: Understand Where We Left Off

- **Source name:** Coord--04-03-26
- **Source URL:** Company-targeted searches (multiple companies, see strategy below)
- **Source type:** LinkedIn Recruiter
- **Total candidates in source:** Multiple searches (Atlassian 200, Salesforce 254, ServiceNow 156, + others)
- **Candidates processed this session:** 113 (60 from session 1, 53 from session 2)
- **Last candidate written to output file:** Prathipa Sridhar
- **Current page in source:** Company-targeted mode — see search strategy below
- **Current position on page:** N/A (switching between companies)
- **Per-run chat log file:** Z_Old_Chat_Logs/Chat_Log-Coord--04-03-26-2026-04-03-1735.md
- **Reason for shutdown:** Session candidate cap (~60 per context window)
- **Run parameters:** A-rated target = 20, Hard cap = 600
- **Run counters (THIS RUN ONLY, not total output file):**
  - `run_a_rated_count` = 3
  - `run_total_count` = 113
- ⚠️ These counters are PER-RUN. Resume counting from these numbers, do NOT recount from the xlsx.

## Step 3: Key Context for Resuming

### Search Strategy Status — Company-Targeted Mode

**CRITICAL FINDING: Gujarat + SaaS recruiter intersection is near-zero on LIR.** All India-wide SaaS company searches produce ~60-80% Gujarat auto-DQ rate. The best strategy is to continue India-wide company searches at high-yield companies and accept the auto-DQ overhead.

**⚠️ A-RATED CANDIDATES NEED GUJARAT VERIFICATION:** The 3 A-rated candidates from Atlassian were scored by CE agents that may not have verified Gujarat connection. Cleanup must verify these — if they lack Gujarat connection, they should be F/0% (auto-DQ). This is the highest priority check for the next session.

#### Companies COMPLETED (do NOT re-search):
| Company | Results | Evaluated | A | B | C | D | F | Notes |
|---------|---------|-----------|---|---|---|---|---|-------|
| Sprinklr | 68 | 15 | 0 | 3 | 1 | 0 | 10+1skip | Best broad hit rate (3B from 5 non-DQ) |
| Salesforce | 254 | 7 | 0 | 2 | 1 | 0 | 4 | Kejal Joshi B/79.2% had Sales hiring |
| **Atlassian** | **200** | **10** | **3** | **4** | **0** | **0** | **3** | **⭐ BEST COMPANY: 70% B+ rate. Resume here first for page 2+** |
| HubSpot | 0 | 0 | - | - | - | - | - | All previously actioned |
| ServiceNow | 156 | 10 | 0 | 0 | 1 | 1 | 8 | 80% Gujarat auto-DQ |
| Workday | 0→0 | 0 | - | - | - | - | - | All previously actioned after RA filter |

#### Companies NOT YET SEARCHED (from Tier 2 research):
High confidence: SailPoint, Veeva Systems, Zendesk, York IE, Palo Alto Networks, SolarWinds, Apptio
Medium confidence: Okta, Elastic, Fortive, Twilio

#### Gujarat-Specific Searches COMPLETED (all exhausted):
1. Dan's original URL — 5/5 F-rated
2. Boolean search without location — 5,200+ results, all non-Gujarat auto-DQ
3. Gujarat + "Recruitment Coordinator" title — 199 results, ~11 evaluated
4. Gujarat + "Recruiter" title — 103 results, ~21 evaluated (pages 1-2)
5. Gujarat + SaaS companies batch (13 companies) — **0 results**
6. Gujarat + tech keywords — 8 results, 1C/1D/6F

### This Run's Results (113 candidates across 2 sessions)
- **A-rated: 3** (⚠️ UNVERIFIED Gujarat check)
  - Leena Visora | 94.6% | Atlassian (PGDM HR, Microsoft high-volume)
  - Tanvi Jain | 84.5% | Atlassian (Greenhouse, scaled Paytm 30→250+)
  - Moshina Rahamat | 83.14% | Atlassian (RC at Atlassian/ServiceNow/Salesforce, 60-80 interviews/week)
- **B-rated: 10** — Prabhleen Chopra 78.3% (Sprinklr), Shalini A S 80% (Atlassian), Kejal Joshi 79.2% (Salesforce/Sales hiring!), Alisha Chakraborty 78.7% (Atlassian), Pushpalatha S K 76.0% (Atlassian), Aman Verma 75.7% (Salesforce), Sukritha Sankaran 74.34% (ex-Sprinklr), Shrijan Shukla 70% (Atlassian), Harleen Sodhi 69.85% (Sprinklr), Komal Goyal 86% (Atlassian — may be A-tier, needs Gujarat check)
- **C-rated: 4** — Ramya Gangula 60.5% (Sprinklr), Zubair Khan 61.4% (Salesforce), Ponnal Niharika 59.93% (Aisera/ServiceNow), Manthan Jani 54.3% (VoIPOffice)
- **D-rated: 16** (14 from session 1, 2 from session 2)
- **F-rated: 80** (40 from session 1, ~40 from session 2 — majority Gujarat auto-DQ)

### Key Learnings from Sessions 1-2
- **Atlassian is GOLD:** 3A + 4B from 10 candidates (70% B+ rate). Resume here for page 2+.
- **Gujarat + SaaS = zero:** Every Gujarat-specific SaaS search returned 0. Accept India-wide + auto-DQ overhead.
- **Company-targeted >> keyword search:** Sprinklr/Salesforce/Atlassian produced B+ rates of 30-70%. Broad Gujarat search produced 0% A/B.
- **Auto-DQ rate ~60-80%:** Most SaaS recruiters are in Bangalore/Hyderabad/Gurgaon. Gujarat auto-DQ is the dominant filter.
- **Sales hiring is rare:** Even among B-rated SaaS recruiters, Sales hiring experience is nearly absent. Best candidate for this: Kejal Joshi (Salesforce, B/79.2%).
- **CE Gujarat check inconsistency:** Some CEs don't auto-DQ non-Gujarat candidates. All A-rated candidates need Gujarat verification by cleanup.

### Skipped Candidates (retry these)
- Drashti Gol — LIR access error (from session 1)
- Apoorva Jain — LIR access error (from session 1)
- Naga subramanayam Harapanahalli — profile inaccessible (Sprinklr search)

### Anti-Detection Notes
- CE agents handle delays internally (45-200 seconds random)
- One Chrome agent at a time
- The orchestrator does NOT sleep between spawns

## Step 4: What To Do

1. You are the **parent orchestrator**. Follow `2_Pipeline_Orchestrator.md`.
2. ⚠️ **FIRST PRIORITY: Verify Gujarat connection for 3 A-rated candidates** (Leena Visora, Tanvi Jain, Moshina Rahamat). Spawn CE agents to re-check their profiles specifically for Gujarat location or Gujarati language. If none have Gujarat connection, run_a_rated_count drops to 0.
3. **Resume Atlassian search** — best yield by far. Extract page 2+ from the Atlassian company search (200 results, only 10 used).
4. **Then try remaining Tier 2 companies:** SailPoint, Veeva, Zendesk, York IE, Palo Alto Networks, SolarWinds, Apptio, Okta, Elastic.
5. The output file has ~420+ candidates total. URL Extractor checks for duplicates.
6. **Continue the per-run chat log** — find the file named above and append to it.
7. This file (Context_Legacy_Prompt.md) can be deleted after you've read it.

## Step 5: Self-Destruct Rule Still Applies

Generate a NEW canary token for this resumed session. If any self-destruct trigger fires, write a NEW Context_Legacy_Prompt.md and stop.
