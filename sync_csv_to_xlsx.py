"""Sync temp CSV data into the output Excel file. Run after every CE verdict."""
import csv
from openpyxl import Workbook
from openpyxl.styles import Font, Alignment
from openpyxl.utils import get_column_letter

CSV_PATH = "/sessions/awesome-determined-brown/_temp_rc.csv"
XLSX_PATH = "/sessions/awesome-determined-brown/mnt/TA-ACM/_OUTPUT--AMD_Recruiting_Coord.xlsx"

wb = Workbook()
ws = wb.active
ws.title = "MAIN"

hf = Font(name='Arial', size=10, bold=True, color='000000')
df = Font(name='Arial', size=10)
ca = Alignment(horizontal='center', vertical='center', wrap_text=True)

with open(CSV_PATH, 'r') as f:
    reader = csv.reader(f)
    for row_idx, row in enumerate(reader, 1):
        for col_idx, val in enumerate(row, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = hf if row_idx == 1 else df
            if row_idx == 1:
                cell.alignment = ca

widths = {1:22, 2:10, 3:6.14, 4:14, 5:20, 6:30, 7:22, 8:28, 9:16, 10:8, 11:35,
          12:8, 13:25, 14:8, 15:25, 16:8, 17:25, 18:8, 19:25, 20:8, 21:25,
          22:8, 23:25, 24:8, 25:25, 26:8, 27:25, 28:10, 29:13, 30:13, 31:6,
          32:12, 33:30, 34:28, 35:25, 36:32, 37:8, 38:10}
for col, w in widths.items():
    ws.column_dimensions[get_column_letter(col)].width = w

ws.freeze_panes = 'B2'
ws.auto_filter.ref = f"A1:{get_column_letter(38)}1"

wb.save(XLSX_PATH)
print(f"Synced {row_idx - 1} data rows to {XLSX_PATH}")
