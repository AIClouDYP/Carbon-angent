import openpyxl, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

wb = openpyxl.load_workbook('风机产品碳足迹收资清单.xlsx')

SECTION_FONT = Font(name='Arial', bold=True, size=11, color='1F4E79')
SECTION_FILL = PatternFill('solid', fgColor='D5E8F0')
THIN_BORDER = Border(
    left=Side(style='thin', color='BBBBBB'),
    right=Side(style='thin', color='BBBBBB'),
    top=Side(style='thin', color='BBBBBB'),
    bottom=Side(style='thin', color='BBBBBB')
)

# ═══════════════════════════════════════
# Fix 1: Sheet3 - 恢复"A.能源消耗"分区标题
# ═══════════════════════════════════════
ws3 = wb['3.生产制造阶段']

# 当前: Row3-9是预填工序数据, Row10空, Row11是B区标题
# 需要在Row10插入"A. 能源消耗..."分区标题, 把数据保持不动
# Row10目前是空的, 正好可以用

ws3.cell(10, 1, 'A. 能源消耗（外购电力、燃气、燃煤、蒸汽、压缩空气等，按产线/工序列出）')
ws3.cell(10, 1).font = SECTION_FONT
ws3.cell(10, 1).fill = SECTION_FILL
ws3.cell(10, 1).alignment = Alignment(horizontal='left', wrap_text=True)

# 合并Row10的A:J
ws3.unmerge_cells('A10:J10') if any('A10' in str(m) for m in ws3.merged_cells.ranges) else None
ws3.merge_cells('A10:J10')

# 给Row3-9加上边框
for r in range(3, 10):
    for c in range(1, 11):
        ws3.cell(r, c).border = THIN_BORDER

# Row10边框
for c in range(1, 11):
    ws3.cell(10, c).border = THIN_BORDER

print('Sheet3: A区标题恢复在Row10')

# ═══════════════════════════════════════
# Fix 2: Sheet1 - Row22-27 "是否含XX阶段" 的 B:D 和 E:F 合并
# ═══════════════════════════════════════
ws1 = wb['1.基本信息与边界']

for r in range(22, 28):
    ws1.merge_cells(f'B{r}:D{r}')
    ws1.merge_cells(f'E{r}:F{r}')
    print(f'Sheet1 Row{r}: B:D + E:F merged')

# Row21也需要(边界类型)
ws1.merge_cells('B21:D21')
ws1.merge_cells('E21:F21')
print(f'Sheet1 Row21: B:D + E:F merged')

# Row38-40也需要合并(原GHG范围行, 可能被移到了后面)
for r in range(38, 42):
    a = ws1.cell(r, 1).value or ''
    if a.strip():
        ws1.merge_cells(f'B{r}:D{r}')
        ws1.merge_cells(f'E{r}:F{r}')
        print(f'Sheet1 Row{r}: {a[:30]} merged')

# 检查是否有GHG范围标题行
for r in range(30, 45):
    a = ws1.cell(r, 1).value or ''
    if a.strip() and ('温室' in a or 'GHG' in a or 'GWP' in a or '截断' in a or '纳入' in a):
        print(f'Row{r}: {a[:40]}')

# 保存
wb.save('风机产品碳足迹收资清单.xlsx')
print('\nFixes saved!')
