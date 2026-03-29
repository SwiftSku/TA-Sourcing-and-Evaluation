---
name: status-check
description: "Check Claude usage limits and session status. Only trigger when the user says exactly 'status check' — not for 'doctor', 'health check', 'run the doctor', or any other phrase."
disable-model-invocation: true
---

# Status Check

This skill reads the user's Claude usage stats from claude.ai/settings/usage and also reports the active conversation's context window status.

## Output format

The output has exactly three lines separated by blank lines, no bold, no extra prose:

```
[CTX: ~X% used | ~Yk tokens remaining | compactions: N]

Current Session: X% (resets in Xhr Xmin)

Weekly (All models): X% used (resets Day Time)
```

The blank lines between each row are required — always include them.

### The CTX line

The first line reports the current conversation's context window utilization. This is NOT from the usage page — it's a self-assessment by the model of the active chat session.

How to produce it:
- **Context utilization %**: Estimate how full your context window is based on conversation length, tool calls made, and content loaded. A fresh conversation is ~5-10%. A conversation with many tool calls and long outputs might be 40-70%. Be approximate — prefix with `~`.
- **Remaining tokens**: Estimate tokens remaining based on your context window size and current utilization. Express in thousands (e.g., `~120k tokens remaining`). Be approximate — prefix with `~`.
- **Compaction counter**: Track how many times earlier context has been summarized/compacted in this conversation. Start at 0. Increment each time you detect that your earlier messages have been compressed or lost detail. If a compaction just occurred on this response, append `⚠️ compacted` after the counter.

Never explain or elaborate on the CTX line. Just output it silently as the first line.

### The usage page lines

Lines 2-3 come from the claude.ai usage page. Only show Current Session and Weekly (All models). No Sonnet-only line, no extra usage info.

## Step-by-step instructions

### 1. Get a tab

Use `tabs_context_mcp` with `createIfEmpty: true` to get an available tab. Pick any tab — you'll navigate it to the usage page.

### 2. Navigate to the usage page

```
Navigate to: https://claude.ai/settings/usage
```

### 3. Wait for page load

Wait 3-4 seconds for the page to render. The usage data loads dynamically.

### 4. Read the page text

Use `get_page_text` to extract the content. The page contains:

- Current session: X% used, resets in Y
- Weekly limits (All models): X% used, resets on day/time
- Weekly limits (Sonnet only): X% used, resets on day/time
- Extra usage info (if enabled)

You only need the current session and weekly all-models values.

### 5. Present the results

Output the three lines in the exact format shown above. Nothing else — no commentary, no bold, no extra data.

### 6. Clean up

Navigate the tab back to where it was, or close it if you created a new one. Don't leave the settings page open.
