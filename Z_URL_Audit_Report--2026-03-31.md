# URL Audit Report — Acct Mgr Pipeline
**Date:** 2026-03-31
**File Audited:** `_OUTPUT--Acct_Mgr.xlsx`
**Total rows with Public LI URLs:** 608
**High-risk URLs checked (exact firstname-lastname slug, no hash):** 62
**URLs verified via Chrome:** 62

---

## Summary

| Category | Count |
|----------|-------|
| ✅ Confirmed MATCH (name + company) | 29 |
| ⚠️ COMPANY MISMATCH (right person, wrong company — likely different person with same name) | 15 |
| ❌ PAGE NOT FOUND (404 — profile deleted or never existed) | 14 |
| 🔍 INCOMPLETE (profile loaded but company not visible) | 4 |

---

## MISMATCHES — Wrong Person (Different Company)

These are the most dangerous: the URL leads to a **different person** with the same name, or the same person who has moved companies (making the data row inaccurate either way).

| Row | Expected Name | Expected Company | Actual Company on LinkedIn | Severity |
|-----|---------------|------------------|---------------------------|----------|
| 18 | Dency Suchak | Knovator Technologies | Artha Job Board | HIGH |
| 93 | Khevna Chhaya | S&P Global | Loblaw Companies Limited | HIGH |
| 336 | Bhargav Shah | eClinicalWorks | Infobip / Yellow.ai | HIGH |
| 345 | Karan Barot | eClinicalWorks | RACV (Australia) | HIGH |
| **355** | **Divisha Gupta** | **GAMMASTACK** | **Google** | **HIGH** |
| 368 | Kartik D. | Automation Anywhere | KPN Fresh | HIGH |
| 399 | Jasmin Madam | Bright | No company shown (AppSec specialist) | MEDIUM |
| 400 | Nilesh Chauhan | Reelo | TD | HIGH |
| 402 | Dipan Chakraborty | BrowserStack | Indian Ministry of Finance / PNB | HIGH |
| 413 | Arpita Patel | Fuse Capital | Software Developer (Canada) | HIGH |
| 430 | Akash Das | Freshworks | Futurense Technologies | HIGH |
| 472 | Darshan Thakkar | Strideck | Riveron | HIGH |
| 475 | Jyoti Nigam | Rivulet Digital | Northern Trust Asset Management | HIGH |
| 517 | Sushmita Verma | BlueKaktus | PwC | HIGH |

---

## PAGE NOT FOUND (404)

These URLs lead to non-existent profiles — either deleted, set to private, or never existed.

| Row | Expected Name | Expected Company |
|-----|---------------|------------------|
| 147 | Malvika Shahani | BrowserStack |
| 249 | Ajim Godad | Narjis Infotech |
| 334 | Dhwanil Soni | Gurukrupa Travels |
| 347 | Sairaj Dixit | eClinicalWorks |
| 377 | Dhaivat Vayeda | Automation Anywhere |
| 383 | Prerna Singh | Automation Anywhere |
| 384 | Ankit George | Unicommerce |
| 387 | Rounak Chandarana | MakeMyTrip |
| 394 | Vishal Ranpariya | Sophos |
| 395 | Sameerhusain S. | MYCPE ONE |
| 405 | Meet Maravaniya | Metizsoft Inc |
| 406 | Nilaksh Rajpurohit | Zomato |
| 409 | Kewal Sanghadia | Simform |
| 414 | Axansh Yashvardhan | Hilti India |
| 426 | Pratibha Wadhwani | Birdeye |
| 477 | Karan Gulabani | Turabi AI |

---

## INCOMPLETE (Company not visible)

| Row | Expected Name | Expected Company |
|-----|---------------|------------------|
| 66 | Pritam Kumar Singh | Reelo |
| 102 | Margil Thakkar | SwiftSku (YC W21) |
| 252 | Sujay Dive | Travel Designer Group |
| 267 | Kandarp Trivedi | Silicon Signals |

---

## Root Cause

The JD config explicitly states: **"NEVER guess or construct a public LinkedIn URL from the candidate's name."** The correct process is to extract the actual `href` from the "Public profile" link on the LIR profile page.

All 62 flagged URLs had slugs that were **exact `firstname-lastname`** with no alphanumeric hash suffix — the telltale sign of a constructed/guessed URL rather than one extracted from the LIR page.

**47% of these constructed URLs (29/62) are confirmed broken** (wrong person or 404).

---

## Recommended Fix

For all 33 problematic rows (15 mismatches + 14 dead + 4 incomplete):
1. Open the LIR URL (Column 4) in LinkedIn Recruiter
2. Extract the actual "Public profile" link from the LIR page
3. Overwrite Column 3 with the real URL
4. If no public profile link is visible, leave Column 3 **empty**
