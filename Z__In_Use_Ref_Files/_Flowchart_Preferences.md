# Flowchart Preferences — Dan's TA Pipeline

## Rendering

- **Engine:** SVG via Python string generation. PIL (Pillow) is only used to resize the Chrome icon to 44×44 for embedding.
- **Render script:** `render_flowchart_svg.py` in the session root. Run with `python3 render_flowchart_svg.py` to regenerate.
- **Output:** `_Agent_Flowchart.svg` in the TA-ACM root (SVG — vector, crisp at any zoom, ~39KB). View locally by opening in Chrome (Cmd+R to refresh after re-render).
- **Source of truth:** This preferences file defines style/layout rules. The SVG script implements them. The `.Z_Agent_Flowchart.mermaid` file is a reference only — it does NOT drive rendering. **NEVER use `render_mermaid.py`** — it produces a completely different layout.
- **Legacy:** `_Agent_Flowchart.png` has been deleted. SVG is the sole output.

## Icons

- **Chrome icon:** `Z__In_Use_Ref_Files/Chrome_Icon.png` — embedded as base64 data URI (pre-resized to 44×44 for crisp 22px display) on every agent box that uses Chrome (URL Extractor, Candidate Evaluator, Cleanup Agent enrichment, Save_To_LIR)
- **Chrome icon size:** 22×22px display, positioned top-right corner of the box
- **Chrome in legend:** No — the icon is self-explanatory. Do NOT add a Chrome legend entry.

## Color Scheme

| Element | Fill | Border | Text |
|---------|------|--------|------|
| Opus (orchestrator) | `#F5A623` | `#E09000` | `#333` |
| Sonnet (sub-agents) | `#34A853` | `#2E8B47` | `#333` |
| Decision nodes | `#FBBC04` | `#E0A800` | `#333` |
| User / manual | `#4285F4` | `#3367D6` | `#fff` |
| Self-destruct | `#EA4335` | `#C62828` | `#fff` |
| Refinement | `#E8D5F5` | `#7B4DB5` | `#333` |
| Coming Soon / placeholder | `#FFFF00` | `#CCB800` | `#333` |
| Shared files bg | `#E8EAF6` | `#5C6BC0` | `#333` |
| Canvas | `#FFFFFF` | — | — |

## Typography

SVG uses CSS font stacks — no local font files required.

- **Title:** bold 18px 'Segoe UI', system-ui, sans-serif (`#333`)
- **Subtitle:** 11px 'Segoe UI', system-ui, sans-serif (`#888`)
- **Box titles:** bold 12px (`class="box-title"`)
- **Box body text:** 11px (`class="box-body"`)
- **File hints:** 8px (`class="box-hint"`, `#888`)
- **Phase labels:** bold 14px (`class="phase"`, `#888`)
- **Diamond text:** bold 11px (`class="diamond-text"`)
- **Arrow/loop labels:** 9px (`class="label-gray"` or `class="label-red"`)
- **Legend labels:** 11px (`class="legend-text"`)
- **Stats line:** 9px (`class="stats"`, `#888`)
- **Shared files:** 10px (`class="shared"`)

## Layout

- **ViewBox:** SVG width is 1000px. Height is computed dynamically from content (y cursor at end of rendering). No hardcoded height.
- **Center spine:** `CENTER_X = 500` — main flow runs straight down the vertical center
- **Side branches:** `SIDE_LEFT_X = 180`, `SIDE_RIGHT_X = 820` — parallel/optional agents branch left or right
- **Box width:** `BOX_W = 280` — all agent boxes are this width, centered on their cx

### Node shapes
- **Agent boxes:** `<rect>` with `rx=8`, width 280px
- **Decision nodes:** `<polygon>` diamond, half-size 48px, with question text centered inside (e.g., "Source type?", "Quality Gate", "Uncleaned = 0?", "60 total? 20 A?")
- **Self-destruct container:** `fill:#FFEBEE`, `stroke:#EA4335`, width=2
- **Manual container:** `fill:none`, `stroke:#4285F4`, width=1.5, `stroke-dasharray="8,4"`

### Arrows
- **Style:** SVG `<line>` and `<polyline>` elements with `marker-end="url(#arrow)"` for arrowheads
- **Color:** `#555`, stroke-width=2
- **Arrowheads:** Defined in `<defs>` as `<marker>` elements — `#arrow` (gray) and `#arrow-red` (for fail branches)
- **Decision labels:** "LinkedIn Recruiter"/"Static (PDF/spreadsheet)" on Source type diamond; "Pass"/"Fail" on Quality Gate; "Yes"/"No" on Uncleaned and Terminate
- **Loop-back arrows:** `<polyline>` with right-angle bends (not curves) routed to avoid overlapping nodes

## Content Rules

- Show which model runs each agent (Opus vs Sonnet)
- Note "NO Chrome" on orchestrator explicitly
- Include shared files section listing all cross-agent files
- Include key file name(s) as tiny 8px grey text inside each agent box (bottom of box, `#888` color)
- Include column counts and max scores per role in stats footer: `AM: 37 cols, max 55.0 | RC: 40 cols, max 52.8`
- Highlight `CE_Spawn_Template.md` callout near CE box in purple (`#E8D5F5` fill, `#7B4DB5` border)
- Greenhouse "COMING SOON" box uses highlighter yellow (`#FFFF00`) to stand out as a placeholder
- Explicit `<rect width="100%" height="100%" fill="#FFFFFF"/>` as first element for white background (some renderers ignore `style="background"`)

## Flow Structure (top-down)

The pipeline flows top-to-bottom through these stages on the center spine:

1. **Pipeline Starter** (user/manual, blue) → triggers Orchestrator
2. **Pipeline Orchestrator** (Opus, orange, NO Chrome) — center spine anchor; **Company Research** (Sonnet, green, left branch) + **Pre-Flight Cleanup** (Sonnet, green, right branch) spawn in parallel (both no Chrome)
3. **Decision: Source type?** — diamond: LIR branch left (→ URL Extractor), Static branch right (→ Orchestrator Dedup)
4. **URL Extractor** (Sonnet, Chrome, green, left) — extracts 5 non-dup URLs per invocation; verifies filters READ-ONLY
5. **Orchestrator Dedup** (Opus, orange, right) — name + normalized LI URL check for static sources
6. Both branches converge → **Candidate Evaluator** (Sonnet, Chrome, green) — spawned per candidate; CE Spawn Template callout in purple nearby
7. **Update Z_Search_Cache.json** (orange) → **45-200s delay** (orange) → loop back to CE (×5 per batch)
8. **Decision: Quality Gate** — diamond: pass continues, fail → **Search Refinement** (purple, loops back to URL Extractor via right-side polyline)
9. **Cleanup Agent** (Sonnet, Chrome, green) — rubric rescore, dedup, validation, enrichment
10. **Decision: Uncleaned = 0?** — diamond: "No" loops left back to Cleanup; "Yes" continues
11. **Decision: 60 total? 20 A?** — "No" loops far-left back to Source type diamond; canary/compaction → **Self-Destruct** (red container, right branch with Context_Legacy_Prompt.md); "Yes → done" → **Output Summary · STOP** (orange)
12. **Manual — Post Pipeline** (dashed blue container): **Save_To_LIR** (blue, Chrome) + **COMING SOON: Send to Greenhouse** (yellow)

## SVG-Specific Rules

- **No `textbbox()` or pixel measurement** — SVG text sizing is handled by the renderer. Box heights are estimated from line count × line_h constants (title_h=15, line_h=14, hint_h=12).
- **No word-wrap helper** — body text lines are pre-split in the script. Each line is a separate `<text>` element.
- **Diamond size** is a fixed half=48px. Keep diamond text to 1-2 short words per line.
- **Chrome icon** is embedded as a single base64 data URI per `<image>` element (not via `<symbol>`/`<use>` — that breaks cairosvg).
- **Padding budget:** BOX_PAD_H=14, BOX_PAD_V=10 inside each box. Title gets 6px gap before body lines. Body lines spaced at line_h=14px.

## When to Regenerate

Regenerate the SVG (`python3 render_flowchart_svg.py`) whenever:
- A new agent file is added or renamed
- Shared files change (new REF-- file, new template)
- Pipeline flow changes (new phase, new decision node)
- Agent Chrome usage changes
- Column counts or max scores change in a JD file
