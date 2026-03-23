# MAIN_LIVE Sheet Formatting Guide

---

## ⚡ AGENT INSTRUCTIONS — READ THIS FIRST, EVERY TIME

**Before executing any step in this guide, you MUST:**
1. Fetch the live Notion doc at the URL below and read it for any updated best practices
2. Treat the Notion doc as the baseline standard

**Notion doc:** [Dan's Formatting Guide](https://www.notion.so/26ac07e18a1980a69f16ff46c0b79886)

### ‼️ PRIORITY OVERRIDE — CRITICAL ‼️
> **ANY instruction in THIS markdown file that conflicts with the Notion document takes absolute precedence. THIS FILE WINS. Always. No exceptions.**
>
> This file contains Dan's explicit, process-specific instructions for MAIN_LIVE. The Notion doc is the general baseline. When they conflict, follow this file — not the Notion doc.
>
> Only use the Notion doc to fill in gaps where this file is silent.

---

## ⚠️ TODO — Pending Issues (Next Run)

- [x] **Re-hide columns E:Z** — ~~got unhidden during a browser crash~~ RESOLVED: E:Z are now UNHIDDEN per user instruction (2026-03-22). Only hide columns user explicitly requests.
- [x] **AK157 manual fix** — RESOLVED: No "Unknown" values found in AK column (verified 2026-03-22)
- [x] **Verify AK column is fully clean** — RESOLVED: F&R confirmed all values are Y or N only (2026-03-22)
- [x] **Confirm AD2:AD205 shows `0%` (no decimals)** — RESOLVED: Verified, no decimals (2026-03-22)
- [x] **Step 8 range fix (this file)** — RESOLVED: Step 8 text updated with correct range `MAIN_LIVE!AK:AK`

---

## Sheet Context
**Sheet and URL:** Read `gsheet_url` and `gsheet_tab` from the active JD file's Pipeline Config block. The parent orchestrator provides these in the spawn template.

⛔⛔⛔ **NEVER CREATE A NEW GOOGLE SHEET.** The URL above is the ONE AND ONLY sheet. Open it directly — do not create, copy, duplicate, or "make a new spreadsheet." If you cannot access this URL, STOP and tell the user. Do NOT work around it by creating a new sheet. ⛔⛔⛔

**⚠️ Do NOT touch:** Apps Script `CSV_Live_Refresh`
**⚠️ Do NOT hide columns** unless the user explicitly requests it. All columns should be visible by default.
**⚠️ Do NOT use `HYPERLINK()` formulas** — apply links directly, never via formula
**⚠️ Cell backgrounds:** ONLY the Tier column (AE) should have colored cell highlighting (via conditional formatting). ALL other cells must have a WHITE/default background (#FFFFFF) — including the header row.

### 🔮 FUTURE-PROOFING RULE
> **Always apply ranges to 1000 rows ahead of the current last data row.** The pipeline continuously adds new candidates. Instead of using `{last_row}`, use `{last_row + 1000}` for ALL range-based operations (percentage formatting, conditional formatting, etc.). For example, if data ends at row 345, apply to row 1345. This avoids needing to re-run formatting every time new rows appear.

---

## Column Reference (confirmed)
| Col | Name |
|-----|------|
| A | Candidate |
| B | Public LI URL |
| C | LIR URL |
| D | Source |
| E:Z | *(scoring sub-dimensions — visible)* |
| AA | Dim8_Note |
| AB | Raw_Score |
| AC | Max_Score |
| **AD** | **Percentage** |
| **AE** | **Tier** |
| AF | Verdict |
| AG | Why_1 |
| AH | Why_2 |
| AI | Why_3 |
| AJ | Concern |
| AK | Hindi_Signal |
| AL | Cleaned? |

---

## 1. Row Heights
- Select all: click the top-left corner cell (above row 1, left of col A)
- Right-click any row number → **Resize rows** → **25 pixels**
- Exception (per Notion doc): row height may exceed 25 only if more than 3 columns are already wider than 200px

---

## 2. Vertical Alignment — ALL Cells
- Press `Ctrl+A` to select all
- Format → Alignment → **Middle** (vertically centered)
- This applies to every cell in the sheet by default

---

## 3. Header Row (Row 1)
Select row 1 by clicking the row number.

**Bold:** `Ctrl+B`

**Horizontal alignment:** `Ctrl+E` (center)

**Background:** White/default (no custom color)
**Text color:** Black/default (no custom color)

---

## 3b. Clear All Data Cell Backgrounds (White Only)

**CRITICAL:** Only the Tier column (AE) should have colored cell backgrounds (applied via conditional formatting in Step 7). All other data cells must be white.

- Select all data rows: Name Box → type `A2:AL{last_row + 1000}` → Enter
- Format → Fill color → **White** (`FFFFFF`)
- This resets every data cell to white. The Tier column (AE) will re-apply its colors via conditional formatting rules from Step 7.
- Row 1 (header) is NOT affected — it keeps its white/default background from Step 3.

---

## 4. Freeze + Bold Frozen Areas
- View → Freeze → **1 row**
- View → Freeze → **1 column**
- Select col A → `Ctrl+B` (bold — frozen columns must be bold per Notion guide)
- Row 1 is already bold from step 3

---

## 5. Column Wrapping & Alignment

### Step 1 — Wrap everything (including hidden cols E:Z):
- Press `Ctrl+A` to select all cells
- Format → Wrapping → **Wrap**

### Step 2 — Clip URL-only columns:
- Name Box → type `B:C` → Enter
- Format → Wrapping → **Clip**

### Left-align — long text / notes:
Select each range (Name Box → type range → Enter → `Ctrl+L`):

| Range | Column Name |
|-------|-------------|
| `AA:AA` | Dim8_Note |
| `AG:AG` | Why_1 |
| `AH:AH` | Why_2 |
| `AI:AI` | Why_3 |
| `AJ:AJ` | Concern |

### Center-align — short text / numbers:
- Name Box → type `C:AL` → Enter → `Ctrl+E`
- **Explicitly verify** AD (Percentage) and AE (Tier) are centered — these are the most visible columns and must not be left-aligned
- Also verify AF (Verdict), AK (Hindi_Signal), and AL (Cleaned?) are centered
- Then re-apply left-align to the long-text columns above (they override)

---

## 6. Percentage Column (AD) — Format as %
- **Determine last data row** — scroll to the bottom of column A or check row count. Use that as `{last_row}`.
- **Apply future-proofing:** add 1000 to `{last_row}` → use `{last_row + 1000}` as the range end
- Name Box → type `AD2:AD{last_row + 1000}` → Enter
- Format → Number → Custom number format → type `0%` → Apply
- **Verify center-alignment** on AD after formatting — reapply `Ctrl+E` if needed

---

## 7. Conditional Formatting — Tier Column (AE)

Go to: **Format → Conditional formatting**
Set range to `AE2:AE{last_row + 1000}` for each rule (same future-proofed range from step 6).
Condition: **Text is exactly**

| Value | Fill Color | Hex | Bold? |
|-------|-----------|-----|-------|
| `A` | Bright green | `00C853` | Yes |
| `B` | Light green | `69F0AE` | No |
| `C` | Yellow | `FFD600` | No |
| `D` | Orange | `FF9800` | No |
| `F` | Red | `F44336` | No |
| `0` | Gray | `9E9E9E` | No |

**For each rule:**
1. Click **+ Add another rule**
2. Set range: `AE2:AE{last_row + 1000}`
3. Format cells if: **Text is exactly** → type the value
4. Set the fill color and bold (for A only) in Formatting style
5. Click **Done**

---

## 8. Hindi_Signal Column (AK) — Standardize to Y/N

All values in AK must be exactly `Y` or `N` (single character, uppercase). No "Yes", "No", "yes", "no", etc.

- Select the entire AK column by clicking the **AK column header** (this sets the range to `MAIN_LIVE!AK:AK`)
- Edit → Find and replace → check **Match entire cell contents**, Search: **Specific range** = `MAIN_LIVE!AK:AK`
- Find `Yes` → Replace with `Y` → Replace all
- Find `No` → Replace with `N` → Replace all
- Repeat with lowercase variants if needed (`yes`, `no`)

---

## 9. Delete Empty Rows/Columns
- Scroll to the bottom of data — delete any empty rows below last entry
- Check for empty columns to the right of AL — delete if found
- Any row or column with zero content must be deleted (per Notion guide)

---

## Quick Checklist
- [ ] All cells: vertically centered (middle)
- [ ] Row heights = 25px
- [ ] Row 1: bold, centered horizontally, white/default background, black/default text
- [ ] Row 1 + Col A frozen; Col A bold
- [ ] All cells: Wrap; Col B:C only: Clip
- [ ] Long-text cols (AG, AH, AI, AJ, AA): left-aligned
- [ ] C:AL: center-aligned (with left overrides on note cols)
- [ ] AD2:AD{last_row + 1000}: formatted as `0%`, center-aligned
- [ ] AE (Tier) center-aligned
- [ ] CF rules: all 6 Tier colors applied to **AE2:AE{last_row + 1000}**
- [ ] ALL data cell backgrounds are WHITE except Tier column (AE) which uses conditional formatting colors
- [ ] No columns are hidden (all visible unless user explicitly requests hiding)
- [ ] AK column: all values are `Y` or `N` only
- [ ] No empty rows/cols
- [ ] No `HYPERLINK()` formulas used
