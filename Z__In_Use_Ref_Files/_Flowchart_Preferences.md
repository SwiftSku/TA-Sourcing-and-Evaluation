# Flowchart Preferences — Dan's TA Pipeline

## Rendering

- **Engine:** PIL (Pillow) — no external network dependencies (mermaid-py, npm, playwright all fail in sandbox)
- **Output:** `_Agent_Flowchart.png` in the TA-ACM root
- **Source:** This preferences file + the PIL script are the source of truth. No mermaid file — PIL renders everything directly.

## Icons

- **Chrome icon:** `Z__In_Use_Ref_Files/Chrome_Icon.png` — paste on every agent box that uses Chrome (URL Extractor, Candidate Evaluator, Cleanup Agent enrichment, Save_To_LIR)
- **Chrome icon size:** 22×22px, positioned top-right corner of the box
- **Chrome in legend:** Include Chrome icon with "= uses Chrome" label

## Color Scheme

| Element | Fill | Border | Text |
|---------|------|--------|------|
| Opus (orchestrator) | `#F5A623` | `#E09000` | `#333` |
| Sonnet (sub-agents) | `#34A853` | `#2E8B47` | `#333` |
| Decision nodes | `#FBBC04` | `#E0A800` | `#333` |
| User / manual | `#4285F4` | `#3367D6` | `#333` |
| Self-destruct | `#EA4335` | `#C62828` | `#fff` |
| Refinement | `#E8D5F5` | `#7B4DB5` | `#333` |
| Phase backgrounds | `#F8F9FA` | `#BDC3C7` | — |
| Shared files bg | `#E8EAF6` | `#5C6BC0` | — |
| Canvas | `#FFFFFF` | — | — |

## Typography

- **Title:** DejaVuSans-Bold 18px
- **Box titles:** DejaVuSans-Bold 14px
- **Box body text:** DejaVuSans 11px
- **Phase labels:** DejaVuSans-Bold 14px, color `#888`
- **Legend labels:** DejaVuSans 11px

## Layout

- **Canvas width:** 1200px
- **Layout pattern:** Center spine — main flow runs straight down the vertical center
- **Side branches:** Parallel/optional agents branch left or right off the center spine
- **Loop-back arrows:** Curved arrows returning to an earlier node (e.g., "next batch" loops back to URL Extractor, refinement loops back to CE)

### Node shapes
- **Agent boxes:** rounded_rectangle, radius=8, width ~280-320px
- **Decision nodes:** Diamond (rotated square), ~100×100px, with question text centered inside (e.g., "Source type?", "Quality Gate", "Uncleaned=0?", "Terminate?")
- **Phase containers:** rounded_rectangle, radius=10
- **Self-destruct container:** `fill:#FFEBEE`, `stroke:#EA4335`, width=2
- **Manual container:** `fill:#E3F2FD`, `stroke:#4285F4`, width=2, dashed

### Arrows
- **Color:** `#555`, width=2, with filled triangle arrowheads
- **Decision labels:** "Yes"/"No" or "LIR"/"Public" labels on arrows exiting decision diamonds
- **Loop-back arrows:** Same style, curved to avoid overlapping other nodes

## Content Rules

- Show which model runs each agent (Opus vs Sonnet)
- Note "NO Chrome" on orchestrator explicitly
- Include shared files section listing all cross-agent files
- Include key files per agent in a legend/footer section
- Include column counts and max scores per role in footer
- Highlight `CE_Spawn_Template.md` callout near CE box in purple (`#7B4DB5`)
- Auto-crop canvas height to content + 20px padding

## Flow Structure (top-down)

The pipeline flows top-to-bottom through these stages on the center spine:

1. **Pipeline Starter** (user/manual) → triggers Orchestrator
2. **Pipeline Orchestrator** (Opus, NO Chrome) — center spine anchor
3. **Decision: Source type?** — diamond: LIR branch left, Public LI branch right
4. **URL Extractor** (Sonnet, Chrome) — branches back to center
5. **Candidate Evaluator** (Sonnet, Chrome) — spawned per candidate; CE Spawn Template callout in purple nearby
6. **Decision: Quality Gate** — diamond: pass/fail
7. **Output Cleanup Agent** (Sonnet, Chrome for re-evals) — runs on output file
8. **Decision: Uncleaned=0?** — diamond: loop back if no, continue if yes
9. **Decision: Terminate?** — diamond: "next batch" loops back to URL Extractor; "yes" branches to Self-Destruct
10. **Self-Destruct** (red container) — branches right off terminate diamond
11. **Save_To_LIR** (manual, Chrome) — separate branch, user-invoked only

## When to Regenerate

Regenerate the PNG whenever:
- A new agent file is added or renamed
- Shared files change (new REF-- file, new template)
- Pipeline flow changes (new phase, new decision node)
- Agent Chrome usage changes
