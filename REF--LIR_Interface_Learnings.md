# LinkedIn Recruiter Interface Learnings

## What This File Is

A shared knowledge base of **verified interface behaviors, quirks, and workarounds** for LinkedIn Recruiter. Every agent reads this file before interacting with LinkedIn Recruiter. Learnings accumulate here across runs so that no agent repeats a mistake or rediscovers a workaround.

⛔ **SCOPE: This file is about the LinkedIn Recruiter INTERFACE ONLY.** ⛔

Do NOT add anything related to:
- Specific roles, searches, or job titles (e.g., "AM searches have low signal-to-noise")
- Specific geographies or candidate pools (e.g., "Gujarat results tend to...")
- Scoring, evaluation criteria, or candidate quality patterns
- Anything that belongs in a role-specific framework or search refinement log

**Only add observations about how the LinkedIn Recruiter UI/platform behaves** — buttons, filters, navigation, loading, rate limits, bugs, workarounds. If the learning wouldn't apply equally to someone searching for a VP of Engineering in Berlin, it doesn't belong here.

---

## Rules for Adding to This File

⛔ **Do NOT add anything to this file unless you are ≥99% confident it is accurate and will be useful to future runs.**

Before writing a new entry, ask yourself:
- Did I observe this behavior directly and repeatedly (not just once)?
- Is this a property of the LinkedIn Recruiter interface itself (not a one-off network error or session glitch)?
- Would a future agent benefit from knowing this before it encounters the same situation?

If any answer is "no" or "maybe" — do not add it. False learnings are worse than no learnings.

**Format for new entries:** Add under the appropriate section below. Include the date and a one-line description of what was observed and what to do about it.

---

## Search URLs & Navigation

- **2026-03:** LinkedIn Recruiter search URLs expire within minutes. The `searchRequestId` token is session-bound. If a URL hangs on "Loading search results", it's stale. Navigate to LinkedIn Recruiter directly and re-run the search with the same filters instead of retrying the URL.

---

## Filters & Controls

### ⛔ MANDATORY FILTERS — Every LIR search MUST have these enabled

**Any agent that creates, modifies, or verifies a LinkedIn Recruiter search MUST ensure these two filters are active. If either is missing or misconfigured, the search is invalid — do NOT proceed with extraction or evaluation until both are confirmed.**

1. **Hide previously viewed = ON, Past 2 years**
   - The toggle must be ON (green), and the duration must be "Past 2 years" (not 30 days, 90 days, 6 months, or 1 year — those are wrong).
   - This filter resets between sessions. Verify it every time, even if you think it was set previously.
   - Why: Without this, the pipeline wastes evaluations on candidates already scored in prior runs and creates duplicate rows.

2. **Recruiting Activity = No Messages AND No Projects**
   - Both "Messages" and "Projects" must be set to "Doesn't have" (shown as red/negative filter pills).
   - Why: Candidates already messaged or added to projects have been actioned by the team. Evaluating them again is wasted work.

**If you are adjusting filters for any reason (adding companies, changing titles, refining keywords), you MUST also verify these two mandatory filters are still enabled after your changes.** Filter changes can sometimes reset other filter state.

**If either filter is missing or wrong:** If you have permission to modify filters (e.g., you're a filter adjustment agent), enable them. If you're a URL Extractor (read-only), return `ERROR: FILTER_MISMATCH` to the parent.

---

- **2026-03-23: CRITICAL — Filters are STATEFUL and DESTRUCTIVE on click.** Clicking on a filter pill, dropdown, toggle, or X button to "verify" or "inspect" its value can MODIFY the filter, which immediately re-runs the search with different parameters. This generates a new `searchRequestId`, which invalidates the previous URL permanently. The old search cannot be recovered — it is gone forever. **ALL filter verification must be visual/screenshot-only. NEVER click on any filter element.** This lesson was learned when a URL Extractor agent clicked into the Recruiting Activity filter to verify it, accidentally added a Messages filter, changed the results to 0, and destroyed the original 88-candidate search.

- **2026-03-23: Filter pills with "X" buttons are live controls.** Clicking anywhere near a filter pill (even to "read" it) can trigger removal. The X button has a large click target. Scroll past filters without clicking.

---

## Profile Pages

_(Add verified profile page behaviors here — e.g., sections that lazy-load, elements that require scrolling to appear, data that is only visible in certain views)_

---

## Search Results

- **2026-03:** Search results use a **virtualized DOM** — only ~7 candidate cards are rendered at a time. Attempting to extract all candidate URLs from a page at once returns a partial list. You must use scroll-based extraction: scroll down, read visible candidates, scroll again, repeat until all candidates on the page are captured. Do not assume a single DOM read gives all results.

---

## Rate Limits & Throttling

- **2026-03-27: HTTP 529 "Site is Overloaded" — LinkedIn's rate-limiting response.** This means LinkedIn has detected too many requests from the session and is temporarily blocking access. When you encounter a 529 error, wait 15 minutes and retry the same request. Retry up to 5 times (with a 15-minute wait before each attempt). If the request still fails after 5 retries, abort the current candidate and report the error to the parent orchestrator.

---

## Known Bugs & Workarounds

_(Add verified bugs here — e.g., UI elements that don't respond, filters that silently fail, pages that require refresh)_
