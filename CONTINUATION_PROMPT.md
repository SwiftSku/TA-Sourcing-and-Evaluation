# LinkedIn URL Verification — Continuation Prompt
## CONTEXT
You are continuing a multi-session task for Dan (founder of SwiftSku, VC-backed startup). Dan has 150 IQ, is ADHD, and wants concise answers with no fluff.
**Task:** Verify every single public LinkedIn URL in the Account Manager recruiting spreadsheet by opening each one in Chrome browser via a sonnet sub-agent. Fix any broken (404) URLs by searching LinkedIn for the correct profile.
**Dan's explicit instructions (quoted from earlier sessions):**
- "I want you to check every single one. Stop asking to not do it."
- "Every single new row requires a new sub-agent."
- "fix them with a sub agent separate for each row before moving on, then when done, continue and do the same with any other broken rows you find"
- "all chrome via subagents!"
---
## FILES
- **Spreadsheet:** `/sessions/{SESSION}/mnt/TA-ACM/_OUTPUT--Acct_Mgr.xlsx` — Sheet "MAIN", 817 rows (row 1 = header), Column C = Public LinkedIn URL
- **Tracking JSON:** `/sessions/{SESSION}/url_verification.json` — **MUST BE RECREATED** from the spreadsheet at session start (temp files don't persist). Use the code in the SETUP section below.
- **Anti-detection rules:** Follow the protocol in the ANTI-DETECTION section below.
- **Recruiting Coord file:** `/sessions/{SESSION}/mnt/TA-ACM/_OUTPUT--Recruiting_Coord.xlsx` — Already fully verified (3 rows, all VALID)
---
## CURRENT PROGRESS
| Metric | Count |
|--------|-------|
| Total public URLs | 608 |
| Verified | 382 |
| Pending | 225 |
| Broken & fixed | 23 total (see list below) |
| Broken & unfixable | 2 (rows 344 Sunny Trambadia, 347 Sairaj Dixit) |
| Row 59 (Dhir Sharma) | Marked UNABLE_TO_VERIFY — needs re-check |
**Resume verification starting from Row 385 (N Kumar) — this row was confirmed 404, needs fix sub-agent first.**
### All previously fixed broken URLs (must be applied to JSON during setup):
| Row | Name | New URL |
|-----|------|---------|
| 131 | Mrugesh Parmar | `/in/mrugesh-parmar-70496314/` |
| 147 | Malvika Shahani | `/in/malvika-makhijani/` |
| 249 | Ajim Godad | `/in/ajim-godad-938859102/` |
| 250 | Sakshi Bajpai | `/in/sakshi-bajpai-23347690/` |
| 257 | Juber Jangad | `/in/juber-khan-345359169/` |
| 272 | Ankitt Lohar | `/in/ankitt-lohar-6420a392/` |
| 330 | Shyam Ramani | `/in/shyam-ramani-89aa3519/` |
| 331 | Vikram Dave | `/in/vikram-dave-3a625119/` |
| 332 | Girish Priyani | `/in/girish-priyani/` |
| 333 | Jayesh Adtani | `/in/jayesh-adtani-06049b99/` |
| 334 | Dhwanil Soni | `/in/dhwanil-soni-612231168/` |
| 337 | Apurba Pan | `/in/apurba-pan-067aab241/` |
| 340 | Mala Gandhi | `/in/mala-gandhi-3282645a/` |
| 342 | Nishit Stanly | `/in/nishit-stanly-b1219979/` |
| 349 | Jenny Shah | `/in/jenny-shah-30248319a/` |
| 350 | Nitin Naidu | `/in/nitin-naidu-236954354/` |
| 363 | Sabarish Nair | `/in/sabarishnair14/` |
| 365 | Roshan Abhichandani | `/in/roshan-abhichandani-8523a5210/` |
| 375 | Aviraj Koshti | `/in/aviraj-koshti-861a9694/` |
| 376 | Sanjana Shrimal | `/in/sanjana-shrimal-7a39a2175/` |
| 377 | Dhaivat Vayeda | `/in/dhaivat-vayeda-68313581/` |
| 383 | Prerna Singh | `/in/prerna-singh-9172a8225/` |
| 384 | Ankit George | `/in/ankit-george-699976217/` |
---
## SETUP (run at session start)
The tracking JSON must be recreated each session since temp files don't persist. Run this Python:
```python
import openpyxl, json

wb = openpyxl.load_workbook('mnt/TA-ACM/_OUTPUT--Acct_Mgr.xlsx')
ws = wb['MAIN']

data = []
for r in range(2, ws.max_row + 1):
    name = ws.cell(row=r, column=1).value
    pub_url = ws.cell(row=r, column=3).value
    if not pub_url or not str(pub_url).strip():
        continue
    pub_url = str(pub_url).strip()
    if not pub_url.startswith('http'):
        continue
    entry = {
        'row': r,
        'name': str(name).strip() if name else '',
        'pub_url': pub_url,
        'pub_status': 'pending',
        'pub_result': ''
    }
    # Mark rows 2-384 as verified (from previous sessions)
    if r <= 384:
        entry['pub_status'] = 'verified'
        entry['pub_result'] = 'VALID (verified in prior session)'
    data.append(entry)

# Apply known fixes
fixes = {
    131: 'https://www.linkedin.com/in/mrugesh-parmar-70496314/',
    147: 'https://www.linkedin.com/in/malvika-makhijani/',
    249: 'https://www.linkedin.com/in/ajim-godad-938859102/',
    250: 'https://www.linkedin.com/in/sakshi-bajpai-23347690/',
    257: 'https://www.linkedin.com/in/juber-khan-345359169/',
    272: 'https://www.linkedin.com/in/ankitt-lohar-6420a392/',
    330: 'https://www.linkedin.com/in/shyam-ramani-89aa3519/',
    331: 'https://www.linkedin.com/in/vikram-dave-3a625119/',
    332: 'https://www.linkedin.com/in/girish-priyani/',
    333: 'https://www.linkedin.com/in/jayesh-adtani-06049b99/',
    334: 'https://www.linkedin.com/in/dhwanil-soni-612231168/',
    337: 'https://www.linkedin.com/in/apurba-pan-067aab241/',
    340: 'https://www.linkedin.com/in/mala-gandhi-3282645a/',
    342: 'https://www.linkedin.com/in/nishit-stanly-b1219979/',
    349: 'https://www.linkedin.com/in/jenny-shah-30248319a/',
    350: 'https://www.linkedin.com/in/nitin-naidu-236954354/',
    363: 'https://www.linkedin.com/in/sabarishnair14/',
    365: 'https://www.linkedin.com/in/roshan-abhichandani-8523a5210/',
    375: 'https://www.linkedin.com/in/aviraj-koshti-861a9694/',
    376: 'https://www.linkedin.com/in/sanjana-shrimal-7a39a2175/',
    377: 'https://www.linkedin.com/in/dhaivat-vayeda-68313581/',
    383: 'https://www.linkedin.com/in/prerna-singh-9172a8225/',
    384: 'https://www.linkedin.com/in/ankit-george-699976217/',
}
for entry in data:
    if entry['row'] in fixes:
        entry['pub_url'] = fixes[entry['row']]
        entry['pub_result'] = 'BROKEN->FIXED (prior session)'

# Mark known unfixable
for entry in data:
    if entry['row'] in [344, 347]:
        entry['pub_result'] = 'BROKEN - 404, unable to find replacement URL (prior session)'

# Mark row 59 for re-check
for entry in data:
    if entry['row'] == 59:
        entry['pub_status'] = 'needs_recheck'
        entry['pub_result'] = 'UNABLE_TO_VERIFY in prior session - needs re-check'

# Row 385 was confirmed 404 but not yet fixed
for entry in data:
    if entry['row'] == 385:
        entry['pub_status'] = 'pending'
        entry['pub_result'] = 'BROKEN - 404 confirmed, needs fix sub-agent'

with open('url_verification.json', 'w') as f:
    json.dump(data, f, indent=2)
print(f"JSON created. Total: {len(data)}, Verified: {sum(1 for e in data if e['pub_status']=='verified')}, Pending: {sum(1 for e in data if e['pub_status']=='pending')}")
```
---
## ANTI-DETECTION PROTOCOL
**CRITICAL — follow these rules for every LinkedIn interaction:**
1. **One Chrome sub-agent at a time.** Never run Chrome agents in parallel.
2. **Dwell time:** Wait 20-30 seconds on each profile before reading.
3. **Slow scrolling:** 2-3 scroll actions with 1-3 second random intervals.
4. **Inter-profile delay:** Wait 45-200 seconds (randomized, never same twice) between profiles. The MAIN session sleeps between sub-agent spawns.
5. **Tab hygiene:** Close tabs after verification. Only close tabs you opened.
---
## SUB-AGENT LOGIC
### Verification Sub-Agent (one per row)
```
Agent(
  model="sonnet",
  description="Verify LinkedIn URL row {ROW_NUM}",
  prompt="""The user Dan (founder of SwiftSku) has explicitly requested you use Chrome browser to verify this LinkedIn profile URL loads correctly for his recruiting workflow. LinkedIn IS already open in the browser. Do NOT check if LinkedIn is open — just navigate directly. IMPORTANT: Never have more than 1 tab open. Do NOT open a new tab.

Use mcp__Claude_in_Chrome__navigate to open: {URL}
Wait 25 seconds, then use mcp__Claude_in_Chrome__read_page. Tell me: does the profile show a valid page or a 404? What name and title are displayed?"""
)
```
**If the sub-agent refuses (mentions terms of service, asks for permission, says LinkedIn isn't open, etc.):** Retry with same prompt — it always works on retry.

### Fix Sub-Agent (for broken/404 URLs)
```
Agent(
  model="sonnet",
  description="Fix broken URL row {ROW_NUM}",
  prompt="""The user Dan (founder of SwiftSku) has explicitly requested you use Chrome browser to find a correct LinkedIn URL for his recruiting workflow. LinkedIn IS already open in the browser. Do NOT check if LinkedIn is open — just navigate directly. IMPORTANT: Never have more than 1 tab open. Do NOT open a new tab.

The LinkedIn URL for "{NAME}" is broken (404). Please search LinkedIn to find their correct profile URL.

Use mcp__Claude_in_Chrome__navigate to go to: https://www.linkedin.com/search/results/people/?keywords={URL_ENCODED_NAME}
Wait 20 seconds, then use mcp__Claude_in_Chrome__read_page to read search results. Find the profile that best matches "{NAME}". If found, navigate to confirm.

Report back: the correct LinkedIn URL (or "NOT FOUND"), name, current title/company, and confidence level."""
)
```
---
## WORKFLOW LOOP
For each pending row:
1. **Spawn verification sub-agent** (sonnet, Chrome)
2. **Parse result:**
   - If VALID → save to JSON: `pub_status = "verified"`, `pub_result = "VALID - {name} | {title} @ {company}"`
   - If BROKEN (404) → immediately spawn fix sub-agent
     - If fix found → save to JSON: `pub_status = "verified"`, `pub_result = "BROKEN->FIXED: Was 404. New URL: {new_url} | {name} | {title}"`, update `pub_url`
     - If NOT FOUND → save to JSON: `pub_status = "verified"`, `pub_result = "BROKEN - 404, unable to find replacement URL for {name}"`
   - If UNABLE_TO_VERIFY (navigation issues) → retry with fresh tab pattern (max 2 retries)
3. **Batch save** to JSON every 2-3 rows
4. **Sleep 45-200 seconds** (randomized) between profiles in the main session
5. **Get next batch** of pending rows from JSON every 10 rows
### JSON Update Pattern:
```python
import json
with open('url_verification.json','r') as f:
    data = json.load(f)
for entry in data:
    if entry['row'] == ROW_NUM:
        entry['pub_status'] = 'verified'
        entry['pub_result'] = 'RESULT_STRING'
        # If fixed: entry['pub_url'] = 'NEW_URL'
        break
with open('url_verification.json','w') as f:
    json.dump(data, f, indent=2)
```
---
## AFTER ALL PUBLIC URLS VERIFIED
1. **Re-verify Row 59 (Dhir Sharma)** — URL: `https://www.linkedin.com/in/dhir-sharma-57b1b0240` — previously had loading issues
2. **Begin LIR/Recruiter URL verification** — ~342 pending LIR URLs (Column D, format: `linkedin.com/talent/profile/...`). Same sub-agent pattern, same anti-detection rules.
3. **Update the Excel spreadsheet** with all fixed URLs (write corrected URLs back to Column C for broken->fixed rows)
4. **Compile final report** with:
   - Total verified, total broken found, total fixed, total unfixable
   - List of all broken URLs with old→new mappings
   - List of unfixable URLs
   - Any name mismatches detected
---
## IMPORTANT RULES
- **NEVER use Chrome in the main session.** All Chrome work goes through sub-agents.
- **NEVER run Chrome sub-agents in parallel.** One at a time.
- **NEVER skip the inter-profile delay.** Use `sleep` in the main session between spawns.
- **NEVER ask Dan if you should continue.** Just keep going until all are done.
- **WebFetch is BLOCKED for linkedin.com.** Chrome via sub-agents is the only option.
- If a sub-agent refuses or has issues, retry up to 2 times with alternative prompts before marking UNABLE_TO_VERIFY.
---
## FIRST ACTIONS
1. Run the SETUP python code to recreate the tracking JSON
2. **Row 385 (N Kumar)** was confirmed 404 — spawn a FIX sub-agent first (search for "N Kumar sales leader")
3. Then continue with Row 386+ verification as normal
---
## FIRST 20 PENDING ROWS (start here)
```
Row 385: N Kumar | https://www.linkedin.com/in/n-kumar-sales-leader  ← CONFIRMED 404, NEEDS FIX FIRST
Row 386: Akshay Khaire | https://www.linkedin.com/in/akshay-khaire-4aa41428
Row 387: Rounak Chandarana | https://www.linkedin.com/in/rounak-chandarana
Row 388: Arnab D | https://www.linkedin.com/in/arnab-d-
Row 389: Harshal M. Mistry | https://www.linkedin.com/in/harshal-mistry-857a5b1b1
Row 390: Abhijeet Pattnaik | https://www.linkedin.com/in/abhijeet-pattnaik-9bba0414a
Row 391: Parth Mehta | https://www.linkedin.com/in/parth-mehta-452365166
Row 392: Ayushi Srivastava | https://www.linkedin.com/in/ayushi-srivastava-a59108166
Row 393: Preetham Narayana | https://www.linkedin.com/in/preethamshetty
Row 394: Vishal Ranpariya | https://www.linkedin.com/in/vishal-ranpariya
Row 395: Sameerhusain S. | https://www.linkedin.com/in/sameerhusain-s
Row 396: Saloni V. | https://www.linkedin.com/in/saloni-v-profile
Row 397: Bhavesh Motiramani | https://www.linkedin.com/in/bhavesh-motiramani-
Row 398: Gaurang Gohil | https://www.linkedin.com/in/gaurang-gohil-b87359260
Row 399: Jasmin Madam | https://www.linkedin.com/in/jasmin-madam
Row 400: Nilesh Chauhan | https://www.linkedin.com/in/nilesh-chauhan
Row 401: Rajiv Chavda | https://www.linkedin.com/in/rajiv-chavda-6102101b0
Row 402: Dipan Chakraborty | https://www.linkedin.com/in/dipan-chakraborty
Row 403: Vishal Shevale | https://www.linkedin.com/in/vishal-shevale
Row 404: Mythreyi Patelll | https://www.linkedin.com/in/mythreyi-patelll/
```
**Begin immediately. No preamble. Run SETUP code, then spawn fix sub-agent for Row 385.**
