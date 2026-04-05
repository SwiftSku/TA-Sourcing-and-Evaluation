---
name: zbrowser
description: "How to use the Chrome browser correctly for any browser-based task. Use this skill whenever you need to interact with Chrome — including navigating websites, filling forms, researching online, managing tabs, or any task involving web pages. Trigger whenever the user asks you to open a site, look something up in the browser, interact with a web app, click through pages, or any request that implies browser usage, even if they don't say 'browser' explicitly. Also trigger for tasks like LinkedIn browsing, checking dashboards, web scraping, booking, shopping, or any multi-tab workflow."
---

# ZBrowser — Dan's Browser Operating Manual

Dan is a startup founder who values speed and clean workspaces. When you use the browser, operate like a disciplined power user: get in, do the job, clean up, get out.

## Default Browser

Always use **"Dan Windows Chrome"**. At the start of any browser session, if you're not already connected to Dan Windows Chrome, call `switch_browser` to connect to it before doing anything else.

## Core Principles

### 1. Tab Hygiene — Close What You Don't Need

This is the most important rule. Dan's browser is his workspace, and stale tabs are clutter.

- **Close tabs immediately** when they are no longer needed for the current task. Don't wait until the end — close them as soon as you've extracted what you need.
- Before starting work, call `tabs_context_mcp` to see what's open. If there are leftover tabs from a previous session in your tab group, close them.
- After completing a task, do a final sweep: call `tabs_context_mcp` and close every tab in your group that isn't actively needed going forward.
- If you opened a page just to grab a piece of information (a URL, a name, a data point), close it right after you've captured that info.
- The only exception: don't close tabs the user explicitly asked you to keep open or that you're actively working in right now.

### 2. Subagents for Repeated Work

When a task involves doing the same browser action across multiple items (e.g., visiting 5 LinkedIn profiles, checking 3 dashboards, researching 4 companies), use subagents to handle each item in parallel rather than doing them sequentially in the parent context. This keeps the parent conversation lean and avoids bloating it with repetitive screenshot/click cycles.

- Each subagent handles one item end-to-end (open tab → do the work → extract info → close tab)
- The parent collects results and presents them to Dan
- This is especially important for research tasks, multi-profile reviews, and batch operations

### 3. Start Every Session Right

Every browser interaction should begin with:

1. Call `tabs_context_mcp` (with `createIfEmpty: true` if needed) to get your tab group and see existing tabs
2. Create a new tab with `tabs_create_mcp` for your work (don't reuse old tabs unless the user says to)
3. Navigate to where you need to go

### 4. Efficient Navigation

- Use `navigate` to go to URLs directly — don't type URLs into the address bar manually
- Use `find` to locate elements on the page by description rather than hunting with screenshots when possible
- Use `read_page` with `filter: "interactive"` when you need to find clickable/fillable elements — it's faster than reading the whole page
- Use `get_page_text` to extract article/text content rather than screenshotting and reading it visually
- Use `form_input` with element refs to fill forms rather than clicking and typing character by character
- Take a screenshot before clicking to confirm you're targeting the right element

### 5. Prefer Non-Browser Tools When Possible

If the information you need can be obtained via `WebFetch` or `WebSearch` without needing to interact with a page (click, scroll, log in), prefer those tools. They're faster, use less context, and don't require tab management. Only open the browser when you need to:

- Log into an authenticated session
- Click through interactive UI
- Fill out forms
- See visual layout that matters for the task
- Interact with web apps (dashboards, CRMs, etc.)

## Tool Reference

| Tool | When to use |
|------|------------|
| `tabs_context_mcp` | First call of any session; check what's open; get tab IDs |
| `tabs_create_mcp` | Open a new tab for a new task |
| `tabs_close_mcp` | Close tabs you're done with (use aggressively) |
| `navigate` | Go to a URL or back/forward in history |
| `computer` | Click, type, screenshot, scroll, drag, hover |
| `read_page` | Get accessibility tree / element refs for a page |
| `find` | Locate elements by natural language description |
| `form_input` | Fill form fields by element ref |
| `get_page_text` | Extract plain text from a page |
| `file_upload` | Upload files to file inputs (don't click file pickers) |
| `switch_browser` | Connect to Dan Windows Chrome if not already connected |

## Anti-Patterns to Avoid

- **Tab hoarding**: Never leave tabs open "just in case." If you're done with it, close it.
- **Sequential batch work in parent**: If you're doing the same thing 3+ times, spawn subagents.
- **Typing URLs manually**: Use `navigate`, not `computer` + `type`.
- **Clicking file upload buttons**: Use `file_upload` with a ref instead — clicking opens a native dialog you can't see.
- **Reading full page trees for simple tasks**: Use `filter: "interactive"` or `find` to narrow down.
- **Using the browser for simple lookups**: Prefer `WebFetch`/`WebSearch` when no interaction is needed.
