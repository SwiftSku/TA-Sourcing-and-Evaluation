# Pipeline Run Log — LIR-Coord-Test-03-25-26

**Started:** 2026-03-25 18:04 ET
**Parameters:** A-rated target = 1, Hard cap = 60
**Source URL:** https://www.linkedin.com/talent/hire/1894950466/discover/recruiterSearch?searchContextId=312cab47-3c39-4273-839d-0cf94cae521c&searchHistoryId=20947970570&searchRequestId=749d83a2-b005-4d82-a255-6d122443d4a2&start=0
**Model:** Opus (parent) / Sonnet (all sub-agents)
**CANARY:** bridge amber copper quartz

---

## STARTUP
Parameters confirmed: Recruiting Coordinator, 1 A-rated target, 60 hard cap
Source: LIR-Coord-Test-03-25-26
JD File: JD--Recruiting_Coord.md
Output File: _OUTPUT--Recruiting_Coord.xlsx
Anti-detection delay: 10-25s (user override for this run)

## PRE-FLIGHT CLEANUP
CLEANUP | Checked: 101 | Valid: 101 | Rescored: 0 | Re-evaluated: 0 | URLs filled: 5 | Names fixed: 0 | Stuck: 0 | Uncleaned: 0

## URL_EXTRACT
PAGE 1 | POS 6 | 5 candidates extracted
1. Paras Shah
2. Anamika Pandit
3. Iramben Saumil Virani
4. Yash Raj
5. Vipul P.

## CANDIDATES (Batch 1)
1. Paras Shah | C | 57.4% | Maybe | Accenture
2. Anamika Pandit | F | 0% | Hard No | SUDERO ADVISORS
3. Iramben Saumil Virani | F | 0% | Hard No | HGS / IMS People Possible
4. Yash Raj | F | 0% | Hard No | Hirextra
5. Vipul P. | F | 0% | Unable to Evaluate | Access denied

## QUALITY CHECK (after 5)
Result: Mixed (1C, 4F, 0A) → Continue for 1 more batch, reassess at 10.
run_total_count: 5 | run_a_rated_count: 0

## URL_EXTRACT (Batch 2)
PAGE 1 | POS 11 | 4 new candidates (skipped Vipul P. dup)
6. Dhwani Saija
7. Roger Sequeira
8. Manasha Ranjan
9. Prachi Parmar

## CANDIDATES (Batch 2)
6. Dhwani Saija | F | 0% | Hard No | E2M Solutions
7. Roger Sequeira | F | 0% | Hard No | Microlink Solutions
8. Manasha Ranjan | F | 33.1% | Hard No | MSBC Group
9. Prachi Parmar | D | 37.1% | No | Skynet Technologies

## URL_EXTRACT (Batch 3)
PAGE 1 | POS 17 | 5 candidates
10. Bhagyashree Joglekar
11. Liladhar Suthar
12. Jyoti Tiwari
13. Suresh Vaghela
14. Mariya D.

## CANDIDATES (Batch 3 - partial)
10. Bhagyashree Joglekar | C | 54.7% | Maybe | Silver Touch Technologies Ltd

## CANARY CHECK (at 10)
Recalled: bridge amber copper quartz — PASS

## QUALITY CHECK (at 10)
Result: 0 A-rated out of 10 (2C, 1D, 6F, 1 error) → Quality gate says STOP.
run_total_count: 10 | run_a_rated_count: 0

