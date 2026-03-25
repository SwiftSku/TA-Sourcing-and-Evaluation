#!/usr/bin/env python3
"""
Generate a high-quality PNG flowchart from mermaid description with legend panel.
Uses PIL/Pillow to draw everything programmatically.
"""

from PIL import Image, ImageDraw, ImageFont
import textwrap
import os

# Color scheme from mermaid
COLORS = {
    'user': '#4285F4',      # blue
    'opus': '#F5A623',      # orange/amber
    'sonnet': '#34A853',    # green
    'decision': '#FBBC04',  # yellow
    'refine': '#E8D5F5',    # lavender
    'destruct': '#EA4335',  # red
    'phase_bg': '#f8f9fa',  # light gray
    'phase_border': '#bdc3c7',  # gray border
    'shared_bg': '#E8EAF6',  # light indigo
    'white': '#FFFFFF',
    'black': '#000000',
    'dark_text': '#333333',
    'light_text': '#555555',
}

def hex_to_rgb(hex_color):
    """Convert hex color to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

class FlowchartGenerator:
    def __init__(self, width=2400, height=3200):
        self.width = width
        self.height = height
        self.image = Image.new('RGB', (width, height), hex_to_rgb(COLORS['white']))
        self.draw = ImageDraw.Draw(self.image)

        # Try to load a nice font
        try:
            self.font_large = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 16)
            self.font_normal = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 14)
            self.font_small = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 11)
            self.font_tiny = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 9)
        except:
            # Fallback to default fonts
            self.font_large = ImageFont.load_default()
            self.font_normal = ImageFont.load_default()
            self.font_small = ImageFont.load_default()
            self.font_tiny = ImageFont.load_default()

        self.y_pos = 40
        self.x_left = 60
        self.box_width = 950
        self.line_height = 30

    def draw_rounded_rect(self, xy, radius=10, fill=None, outline=None, width=2):
        """Draw a rounded rectangle."""
        x1, y1, x2, y2 = xy

        # Draw corners
        self.draw.arc([x1, y1, x1+radius*2, y1+radius*2], 180, 270, fill=outline, width=width)
        self.draw.arc([x2-radius*2, y1, x2, y1+radius*2], 270, 360, fill=outline, width=width)
        self.draw.arc([x2-radius*2, y2-radius*2, x2, y2], 0, 90, fill=outline, width=width)
        self.draw.arc([x1, y2-radius*2, x1+radius*2, y2], 90, 180, fill=outline, width=width)

        # Draw edges
        self.draw.line([x1+radius, y1, x2-radius, y1], fill=outline, width=width)
        self.draw.line([x1+radius, y2, x2-radius, y2], fill=outline, width=width)
        self.draw.line([x1, y1+radius, x1, y2-radius], fill=outline, width=width)
        self.draw.line([x2, y1+radius, x2, y2-radius], fill=outline, width=width)

        # Fill rectangle
        if fill:
            self.draw.rectangle([x1+radius, y1, x2-radius, y2], fill=fill)
            self.draw.rectangle([x1, y1+radius, x2, y2-radius], fill=fill)

    def draw_diamond(self, center, width, height, fill=None, outline=None, line_width=2):
        """Draw a diamond shape for decisions."""
        cx, cy = center
        hw = width // 2
        hh = height // 2

        points = [
            (cx, cy - hh),      # top
            (cx + hw, cy),      # right
            (cx, cy + hh),      # bottom
            (cx - hw, cy),      # left
        ]

        # Fill
        if fill:
            self.draw.polygon(points, fill=fill)

        # Outline
        if outline:
            for i in range(len(points)):
                next_i = (i + 1) % len(points)
                self.draw.line([points[i], points[next_i]], fill=outline, width=line_width)

    def draw_arrow(self, start, end, color=None, dashed=False):
        """Draw an arrow from start to end point."""
        if color is None:
            color = hex_to_rgb(COLORS['light_text'])
        else:
            color = hex_to_rgb(color)

        x1, y1 = start
        x2, y2 = end

        # Draw line
        if dashed:
            # Draw dashed line
            distance = ((x2-x1)**2 + (y2-y1)**2)**0.5
            steps = int(distance / 10)
            for i in range(0, steps, 2):
                t_start = i / steps
                t_end = min((i + 1) / steps, 1.0)
                sx = x1 + (x2 - x1) * t_start
                sy = y1 + (y2 - y1) * t_start
                ex = x1 + (x2 - x1) * t_end
                ey = y1 + (y2 - y1) * t_end
                self.draw.line([(sx, sy), (ex, ey)], fill=color, width=2)
        else:
            self.draw.line([(x1, y1), (x2, y2)], fill=color, width=2)

        # Draw arrowhead
        import math
        angle = math.atan2(y2 - y1, x2 - x1)
        arrow_size = 12
        p1_x = x2 - arrow_size * math.cos(angle - math.pi/6)
        p1_y = y2 - arrow_size * math.sin(angle - math.pi/6)
        p2_x = x2 - arrow_size * math.cos(angle + math.pi/6)
        p2_y = y2 - arrow_size * math.sin(angle + math.pi/6)

        self.draw.polygon([(x2, y2), (p1_x, p1_y), (p2_x, p2_y)], fill=color)

    def draw_box(self, text, color_key, y_offset=None, width=None, height=None, box_type='rect'):
        """Draw a box with text and return its bounding box."""
        if y_offset is None:
            y_offset = self.y_pos
        if width is None:
            width = self.box_width
        if height is None:
            height = 80

        x1 = self.x_left
        y1 = y_offset
        x2 = x1 + width
        y2 = y1 + height

        fill_color = hex_to_rgb(COLORS[color_key])
        outline_color = hex_to_rgb(COLORS.get(color_key + '_border', '#333333'))

        if box_type == 'diamond':
            center = ((x1 + x2) / 2, (y1 + y2) / 2)
            self.draw_diamond(center, width, height, fill=fill_color, outline=outline_color)
        else:
            self.draw_rounded_rect((x1, y1, x2, y2), radius=8, fill=fill_color, outline=outline_color, width=2)

        # Draw text
        lines = text.split('\n')
        text_y = y1 + 10
        for line in lines:
            if line.strip():
                text_x = x1 + 20
                self.draw.text((text_x, text_y), line[:60], fill=hex_to_rgb('#FFFFFF'), font=self.font_small)
                text_y += 20

        self.y_pos = y2 + 30
        return (x1, y1, x2, y2)

    def add_phase_label(self, text, y_offset):
        """Add a phase/subgraph label."""
        self.draw.text((self.x_left + 10, y_offset + 5), text, fill=hex_to_rgb(COLORS['dark_text']), font=self.font_large)

    def generate_flowchart(self):
        """Generate the main flowchart."""
        x_pos = 40
        y_pos = 40
        col_width = 1000

        # Title
        self.draw.text((x_pos, y_pos), "TA-ACM Agent Pipeline Flowchart",
                      fill=hex_to_rgb(COLORS['black']), font=self.font_large)
        y_pos += 50

        # Phase 0: Pre-Flight
        self.add_phase_label("Phase 0 · Pre-Flight", y_pos)
        y_pos += 30

        box1 = self._draw_simple_box("👤 Dan answers 4 startup questions", y_pos, 'user', 70)
        y_pos = box1[3] + 25

        box2 = self._draw_simple_box("📄 1_Pipeline_Starter.md\n(Opus parent, Q1-Q4, role selection)", y_pos, 'opus', 90)
        y_pos = box2[3] + 25

        box3 = self._draw_simple_box("🟡 2_Pipeline_Orchestrator.md\n(Opus parent, spawns sub-agents)", y_pos, 'opus', 90)
        y_pos = box3[3] + 25

        box4 = self._draw_simple_box("🟢 Company Research Agent\n(Sonnet, parallel)", y_pos, 'sonnet', 70)
        y_pos = box4[3] + 25

        box5 = self._draw_simple_box("🟢 Pre-flight CSV Cleanup", y_pos, 'sonnet', 70)
        y_pos = box5[3] + 40

        # Source Type Check
        self.add_phase_label("Source Type Check", y_pos)
        y_pos += 30
        box_src = self._draw_diamond_box("🔶 Source type?", y_pos, 'decision', 80)
        y_pos = box_src[3] + 40

        # Phase 1: URL Extraction
        self.add_phase_label("Phase 1 · URL Extraction", y_pos)
        y_pos += 30
        box_url = self._draw_simple_box("🟢 URL_Extractor.md\n(Sonnet, 5 URLs per batch)", y_pos, 'sonnet', 100)
        y_pos = box_url[3] + 40

        # Phase 2: Evaluate
        self.add_phase_label("Phase 2 · Evaluate", y_pos)
        y_pos += 30
        box_ce = self._draw_simple_box("🟢 [active JD file]\n(Sonnet, 1 candidate at a time)", y_pos, 'sonnet', 100)
        y_pos = box_ce[3] + 25

        box_delay = self._draw_simple_box("⏱️ 45-200s anti-detection delay", y_pos, 'opus', 70)
        y_pos = box_delay[3] + 25

        box_cache = self._draw_simple_box("🟡 Update Z_Search_Cache.json", y_pos, 'opus', 70)
        y_pos = box_cache[3] + 40

        # Phase 3: Quality Gates
        self.add_phase_label("Phase 3 · Quality Gates", y_pos)
        y_pos += 30
        box_qg = self._draw_diamond_box("🔶 Quality Gate\n(0 A in 10 → fail)", y_pos, 'decision', 100)
        y_pos = box_qg[3] + 25

        box_refine = self._draw_simple_box("🟣 Search Refinement\n(Lavender refine node)", y_pos, 'refine', 80)
        y_pos = box_refine[3] + 40

        # Phase 4: Cleanup
        self.add_phase_label("Phase 4 · Cleanup", y_pos)
        y_pos += 30
        box_cleanup = self._draw_simple_box("🟢 CSV_Cleanup_Agent.md\n(Sonnet, never delete rows)", y_pos, 'sonnet', 100)
        y_pos = box_cleanup[3] + 25

        box_cg = self._draw_diamond_box("🔶 Uncleaned = 0?", y_pos, 'decision', 80)
        y_pos = box_cg[3] + 40

        # Termination Check
        self.add_phase_label("Termination Check", y_pos)
        y_pos += 30
        box_cap = self._draw_diamond_box("🔶 Hard cap 60?\n20 A-rated?", y_pos, 'decision', 100)
        y_pos = box_cap[3] + 40

        # Pipeline Complete
        self.add_phase_label("Pipeline Complete", y_pos)
        y_pos += 30
        box_gsheet = self._draw_simple_box("🟢 GSheet_Formater.md\n(Sonnet, format output)", y_pos, 'sonnet', 90)
        y_pos = box_gsheet[3] + 25

        box_summary = self._draw_simple_box("🟡 Output Summary · STOP", y_pos, 'opus', 70)
        y_pos = box_summary[3] + 40

        # Self-Destruct
        self.add_phase_label("🔴 Self-Destruct", y_pos)
        y_pos += 30
        box_sd = self._draw_simple_box("🔴 Write Context_Legacy_Prompt.md\n(Self-destruct, red node)", y_pos, 'destruct', 90)
        y_pos = box_sd[3] + 40

        # Manual Save
        self.add_phase_label("🔧 Manual (Separate Invocation)", y_pos)
        y_pos += 30
        box_save = self._draw_simple_box("👤 Save_To_LIR.md\n(Manual, blue dashed border)", y_pos, 'user', 80)
        y_pos = box_save[3] + 40

        # Shared Files
        self.add_phase_label("📁 Shared Files", y_pos)
        y_pos += 30
        box_files = self._draw_simple_box("[output CSV] + Z_Search_Cache.json\n+ Target_Companies/company_research.json + logs", y_pos, 'sonnet', 90)

        return y_pos

    def _draw_simple_box(self, text, y, color, height):
        """Helper to draw a simple rounded box."""
        x = 60
        w = 950
        box = (x, y, x + w, y + height)

        fill_color = hex_to_rgb(COLORS[color])
        outline_color = hex_to_rgb(COLORS.get(color + '_border', '#333333'))

        self.draw_rounded_rect(box, radius=8, fill=fill_color, outline=outline_color, width=2)

        # Draw text
        lines = text.split('\n')
        text_y = y + 12
        for line in lines:
            self.draw.text((x + 20, text_y), line[:70], fill=hex_to_rgb('#FFFFFF'), font=self.font_small)
            text_y += 22

        return box

    def _draw_diamond_box(self, text, y, color, height):
        """Helper to draw a diamond box."""
        x = 60
        w = 950
        cx = x + w // 2
        cy = y + height // 2

        fill_color = hex_to_rgb(COLORS[color])
        outline_color = hex_to_rgb(COLORS.get(color + '_border', '#333333'))

        self.draw_diamond((cx, cy), w, height, fill=fill_color, outline=outline_color, line_width=2)

        # Draw text
        lines = text.split('\n')
        text_y = y + height // 2 - len(lines) * 8
        for line in lines:
            text_width = len(line) * 8
            text_x = cx - text_width // 2
            self.draw.text((text_x, text_y), line, fill=hex_to_rgb(COLORS['dark_text']), font=self.font_small)
            text_y += 18

        return (x, y, x + w, y + height)

    def generate_legend(self):
        """Generate the legend panel on the right side."""
        legend_x = 1080
        legend_y = 40
        legend_width = 1300

        # Legend title
        self.draw.text((legend_x, legend_y), "LEGEND & FILE INVENTORY",
                      fill=hex_to_rgb(COLORS['black']), font=self.font_large)
        legend_y += 50

        # Section 1: Node Types
        self._draw_legend_section("NODE TYPES", legend_x, legend_y, [
            ("🟦 Blue (User)", COLORS['user']),
            ("🟧 Orange (Opus)", COLORS['opus']),
            ("🟩 Green (Sonnet)", COLORS['sonnet']),
            ("🟨 Yellow (Decision)", COLORS['decision']),
            ("🟪 Lavender (Refine)", COLORS['refine']),
            ("🟥 Red (Destruct)", COLORS['destruct']),
        ])
        legend_y += 220

        # Section 2: File Inventory
        self._draw_text_section("FILE INVENTORY", legend_x, legend_y, [
            "Pipeline Agents:",
            "  • 1_Pipeline_Starter.md",
            "  • 2_Pipeline_Orchestrator.md",
            "  • URL_Extractor.md",
            "  • CSV_Cleanup_Agent.md",
            "  • GSheet_Formater.md",
            "",
            "JD Files (role-specific):",
            "  • JD--Acct_Mgr.md",
            "  • JD--AMD_Recruiting_Coord.md",
            "",
            "Generated Files:",
            "  • Z_Search_Cache.json",
            "  • Z_Old_Chat_Logs/Chat_Log-*.md",
            "  • Context_Legacy_Prompt.md",
        ])
        legend_y += 420

        # Section 3: Key Rules
        self._draw_text_section("KEY ARCHITECTURE", legend_x, legend_y, [
            "• Parent = Opus (no Chrome)",
            "• 1 Chrome agent at a time",
            "• 5 URLs per batch",
            "• 45-200s delay between CEs",
            "• NEVER delete CSV rows",
            "• Rubric change → rescore ALL",
            "• Tier 1 → Tier 2 → keyword",
            "• Hard cap: 60 total / 20 A-rated",
        ])
        legend_y += 280

        # Section 4: Tier Colors
        self._draw_legend_section("TIER RATING COLORS", legend_x, legend_y, [
            ("A = Bright Green (#00C853)", "#00C853"),
            ("B = Light Green (#69F0AE)", "#69F0AE"),
            ("C = Yellow (#FFD600)", "#FFD600"),
            ("D = Orange (#FF9800)", "#FF9800"),
            ("F = Red (#F44336)", "#F44336"),
            ("0 = Gray (#9E9E9E)", "#9E9E9E"),
        ])
        legend_y += 220

        # Section 5: Context Budget
        self._draw_text_section("CONTEXT BUDGET @ CANDIDATE 60", legend_x, legend_y, [
            "• 1_Pipeline_Starter.md: ~2KB",
            "• 2_Pipeline_Orchestrator.md: ~15KB",
            "• URL Extractor (12×~500B): ~6KB",
            "• Candidate Eval (60×~100B): ~6KB",
            "• Cleanup (6×~500B): ~3KB",
            "• TOTAL: ~35KB",
        ])

    def _draw_legend_section(self, title, x, y, items):
        """Draw a legend section with colored boxes."""
        self.draw.text((x, y), title, fill=hex_to_rgb(COLORS['black']), font=self.font_large)
        y += 35

        for label, color in items:
            # Draw colored box
            box_x = x + 10
            box_y = y + 2
            self.draw_rounded_rect((box_x, box_y, box_x + 20, box_y + 20),
                                  radius=3, fill=hex_to_rgb(color),
                                  outline=hex_to_rgb(COLORS['black']), width=1)

            # Draw label
            self.draw.text((x + 40, y), label, fill=hex_to_rgb(COLORS['dark_text']), font=self.font_small)
            y += 30

    def _draw_text_section(self, title, x, y, lines):
        """Draw a text section."""
        self.draw.text((x, y), title, fill=hex_to_rgb(COLORS['black']), font=self.font_large)
        y += 35

        for line in lines:
            if line.startswith("  "):
                self.draw.text((x + 20, y), line, fill=hex_to_rgb(COLORS['light_text']), font=self.font_tiny)
            elif line.startswith("•"):
                self.draw.text((x + 15, y), line, fill=hex_to_rgb(COLORS['light_text']), font=self.font_small)
            else:
                self.draw.text((x, y), line, fill=hex_to_rgb(COLORS['dark_text']), font=self.font_small)
            y += 20

    def save(self, path):
        """Save the image to a file."""
        self.image.save(path, 'PNG')
        print(f"Flowchart saved to {path}")

def main():
    print("Generating flowchart...")

    # Create generator
    gen = FlowchartGenerator(width=2400, height=3600)

    # Generate main flowchart
    gen.generate_flowchart()

    # Generate legend
    gen.generate_legend()

    # Save
    output_path = '/sessions/awesome-intelligent-babbage/mnt/TA-ACM/_Agent_Flowchart.png'
    gen.save(output_path)
    print(f"Success! Flowchart saved to {output_path}")

if __name__ == '__main__':
    main()
