# Anti-Detection Rules — LinkedIn Sources

## What This File Is

The single source of truth for all anti-detection behavior when interacting with LinkedIn. Every agent that touches Chrome reads this file before any LinkedIn interaction. No other file should contain anti-detection rules — they all point here.

⛔ **These rules apply ONLY to LinkedIn sources.** Non-LinkedIn sources (PDFs, spreadsheets, job boards) do not require anti-detection behavior.

---

## 1. Profile Browsing — Pre-Extraction (CE, Cleanup enrichment, Save_To_LIR)

Before extracting ANY data from a LinkedIn profile:

1. **Dwell for 20-30 seconds** before starting to read or extract data
2. **Scroll down slowly** — at least 2-3 scroll actions at random intervals (1-3 seconds between scrolls)
3. **Vary scroll distance** — some short, some long
4. **Highlight a random piece of text** (e.g., a job title or company name) as a human would while reading

Do NOT skip this step. Do NOT rush through it. The profile must look "read" before any data is captured.

---

## 2. Search Results Browsing (URL Extractor)

When scrolling through LinkedIn Recruiter search results:

- Scroll naturally — 2-3 seconds between scrolls, vary scroll distance
- Do NOT rapid-fire click through results
- Do NOT use keyboard shortcuts to navigate search results
- Do NOT scroll aggressively or load more than what's visible
- Behave like a human recruiter scanning a page — pause, scroll, read
- You are extracting from search result cards only — you do NOT open individual profile pages

---

## 3. Inter-Candidate Delay + Idle Behavior (CE agents)

After evaluating a candidate and writing the row to the output file:

1. **Do NOT close the profile tab.** Stay on it.
2. The parent orchestrator passes a `DELAY_SECONDS` value (random 45-200s, never the same twice in a row) in the spawn template.
3. **During the delay**, perform random idle movements on the current page:
   - Scroll up/down randomly (small amounts, not full page jumps)
   - Hover over random elements (job titles, skill endorsements, connections count)
   - Pause for random intervals (5-20s) between movements
   - Occasionally highlight a short piece of text then deselect it
   - Do NOT click any links, buttons, or navigate away
4. **After the delay expires**, navigate the same tab to the next candidate URL via `NEXT_URL`. If `NEXT_URL` is empty (last candidate in batch), close the tab.

This avoids the open-close-wait-reopen pattern that looks bot-like. The tab stays warm and active throughout.

**Who generates the delay value:** The parent orchestrator generates a random value between 45 and 200 (never the same twice in a row) and passes it as `DELAY_SECONDS` in the CE spawn template.

**Who executes the delay:** The CE sub-agent. The orchestrator does NOT sleep between spawns.

---

## 4. Inter-Profile Delay (Cleanup enrichment, Save_To_LIR)

For agents that open LIR profiles for enrichment or saving (NOT evaluation):

1. Process one profile at a time — never batch or parallelize
2. After finishing with a profile, **close the tab** (these are short visits, not full evaluations)
3. **Wait 45-200 seconds** (randomized, never the same gap twice in a row) before opening the next profile

Pattern: Open profile → browse/scroll → extract or save → write results → close tab → wait 45-200s → next profile.

**Save_To_LIR exception:** Uses a shorter delay of **30-90 seconds** between candidates (saving is a lighter-touch action than evaluation).

---

## 5. Tab Hygiene

- **Only close tabs YOU opened.** Do not close any tabs that may belong to other processes or were open before you started.
- **CE agents do NOT close tabs between candidates** — they navigate the same tab to `NEXT_URL` (see Section 3).
- **URL Extractors close all LinkedIn tabs** they opened before dying — they are disposable and should leave no trace.
- **Cleanup and Save_To_LIR agents close each profile tab** after processing it (see Section 4).

---

## 6. Chrome Concurrency

⛔ **Only ONE Chrome sub-agent active at a time.** Non-Chrome agents (Cleanup without enrichment, Company Research, handoff updates) can run in parallel while a Chrome agent is active.

Wait for each Chrome sub-agent to finish before spawning the next Chrome sub-agent.

**No delay needed** between the URL Extractor returning and the first CE spawn (different activity type).

---

## Who Reads This File

| Agent | Relevant Sections |
|-------|-------------------|
| **Candidate Evaluator (JD files)** | §1 (profile browsing), §3 (idle + tab reuse), §5 (tab hygiene) |
| **URL Extractor** | §2 (search results), §5 (tab hygiene) |
| **Cleanup Agent (enrichment step)** | §1 (profile browsing), §4 (inter-profile delay), §5 (tab hygiene) |
| **Save_To_LIR** | §1 (profile browsing), §4 (inter-profile delay, 30-90s variant), §5 (tab hygiene) |
| **Pipeline Orchestrator** | §3 (generates DELAY_SECONDS), §6 (Chrome concurrency) |
