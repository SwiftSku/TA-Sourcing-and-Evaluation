# Claude Cowork Best Practices (April 2026)

*Compiled from official Anthropic docs, platform documentation, community findings, and the Agent Skills specification.*

---

## 1. Mindset Shift: Outcomes, Not Steps

The #1 thing that separates power users from everyone else: **describe the outcome you want, not the steps to get there.** Cowork is built around autonomous task execution. Tell it *what* you want delivered, not *how* to do it. Give it file access and let it work.

**Bad:** "Open my spreadsheet, go to column B, calculate the sum, then paste it into cell B50"
**Good:** "Add totals to every numeric column in Q1-revenue.xlsx and highlight anything over $50k"

---

## 2. Skills Are Everything

Skills are the highest-leverage thing you can build. They're reusable instruction sets that turn Cowork from a general assistant into a domain-specific operator.

### Creating Great Skills
- **Keep SKILL.md under 500 lines** — split extras into REFERENCE.md files
- **Write descriptions in third person** with specific trigger keywords front-loaded (first 250 chars matter most)
- **Use gerund naming:** `processing-pdfs`, `analyzing-spreadsheets`
- **Include concrete examples** with input/output pairs, not abstract instructions
- **Set appropriate degrees of freedom** — tight constraints for fragile tasks, loose for creative ones
- **Test with multiple models** (Haiku, Sonnet, Opus) — behavior varies significantly

### Iterative Skill Development Loop
1. Build evals FIRST (at least 3 test cases)
2. Use "Claude A" session to write/refine the skill
3. Use "Claude B" session to test it on real workflows
4. Observe where it breaks → feed observations back to Claude A
5. Repeat until solid

### Progressive Disclosure Pattern
Don't dump everything into SKILL.md. Structure it:
- `SKILL.md` — core instructions (loaded on trigger)
- `REFERENCE.md` — advanced features, edge cases
- `EXAMPLES.md` — detailed examples
- `FORMS.md` — templates and form patterns

Claude only loads what it needs, saving context window for actual work.

---

## 3. Memory System

Cowork has persistent file-based memory across sessions. Use it deliberately:

- **User memories:** Your role, preferences, communication style
- **Feedback memories:** Corrections and confirmed approaches (so you don't repeat yourself)
- **Project memories:** Active initiatives, deadlines, stakeholders
- **Reference memories:** Where to find things in external systems

**Pro tip:** Tell Claude to remember your preferences early. "Remember: I always want Excel formulas, not values" saves you from repeating it every session.

---

## 4. Plugins & Connectors (MCP)

Plugins bundle skills + connectors into installable packages. Connectors link Claude to external tools via MCP (Model Context Protocol).

- **Search the MCP registry** before building custom integrations — there's likely already a connector for Slack, Notion, Google Calendar, Linear, etc.
- **Use fully qualified MCP tool names:** `ServerName:tool_name`
- **Stack plugins** — combine LinkedIn + Recruiter skills, or Calendar + Slack for scheduling workflows

---

## 5. Sub-Agents & Parallel Processing

Cowork can spin up sub-agents to divide complex work into parallel streams. This is where it really shines for multi-step tasks:

- Let it decompose research tasks across multiple agents
- Use for batch operations (processing multiple files, analyzing multiple data sources)
- Each sub-agent gets its own context, so they don't interfere with each other

---

## 6. Scheduled Tasks

Set up recurring automations for work you do regularly:
- Daily/weekly report generation
- Recurring data pulls
- Scheduled file organization
- Periodic research updates

Use the `schedule` skill or the scheduled-tasks MCP tool.

---

## 7. File & Workspace Management

- **Grant folder access** via the directory picker — Cowork reads/writes directly to your local files
- **Use Cowork for file organization:** renaming, sorting, deduplicating, surfacing relevant content from large folders
- **For company research:** Use WebFetch/WebSearch, not Chrome browser (faster, more reliable)
- **For web interactions that need login/auth:** Use Claude in Chrome

---

## 8. Chrome Integration Tips

Claude in Chrome extends Cowork to any website. Best practices:
- Close tabs immediately after completing actions (keeps workspace clean)
- Verify state before presenting results (e.g., check badges/confirmations)
- Use Chrome for auth-gated workflows; use WebFetch for public data
- Be explicit about what page elements to interact with

---

## 9. Prompting for Cowork Specifically

- **Be specific about deliverable format:** "Create an Excel spreadsheet" not "organize this data"
- **Specify quality standards upfront:** "Professional formatting, functional formulas, proper headers"
- **Use persistent conversations** to build context over time
- **Front-load constraints:** audience, length, tone, key requirements
- **For complex tasks:** Let Cowork ask you clarifying questions (it will via the AskUserQuestion tool)

---

## 10. Common Pitfalls to Avoid

1. **Over-directing:** Don't micromanage steps — describe outcomes
2. **Ignoring skills:** Not creating skills for repeated workflows = wasting time every session
3. **Vague deliverable specs:** "Make a presentation" without audience/length/tone = mediocre output
4. **Not using memory:** If you keep correcting the same thing, save it as a feedback memory
5. **Browser when you should WebFetch:** Chrome is slow for simple data gathering
6. **Monolithic skills:** Keep skills focused; compose multiple skills rather than building one mega-skill
7. **Not testing skills across models:** What works on Opus may fail on Haiku
8. **Skipping verification steps:** Always include a final QA/verification step in complex workflows

---

## 11. Power User Workflows

- **Research → Document pipeline:** WebSearch → synthesize → output as .docx/.pptx with one prompt
- **Recruiting pipeline:** LinkedIn Recruiter skill + Chrome for sourcing → spreadsheet tracker
- **Meeting prep:** Calendar MCP + Notion/Drive for context → markdown brief
- **Data extraction:** Upload contracts/reports → extract to structured Excel
- **Skill factory:** Use skill-creator skill to build new skills from observed patterns

---

## Sources

- [Anthropic Agent Skills Best Practices](https://platform.claude.com/docs/en/agents-and-tools/agent-skills/best-practices)
- [Agent Skills Specification](https://agentskills.io)
- [Anthropic Skills Repository](https://github.com/anthropics/skills) (111k stars)
- [Claude Code Skills Docs](https://code.claude.com/docs/en/skills)
- [Claude Cowork Product Page](https://claude.com/product/cowork)
- [Anthropic Newsroom](https://www.anthropic.com/news)
