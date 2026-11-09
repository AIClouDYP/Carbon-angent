import openpyxl, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

wb = openpyxl.load_workbook('风机产品碳足迹收资清单.xlsx')

# 只重建Sheet8
ws8 = wb['8.数据质量评估DQR']

# 解除所有合并
for m in list(ws8.merged_cells.ranges):
    ws8.unmerge_cells(str(m))

# 清除所有行
for row in range(1, 20):
    for col in range(1, 11):
        ws8.cell(row, col).value = None
        ws8.cell(row, col).font = Font(name='Arial', size=10)
        ws8.cell(row, col).fill = PatternFill()
        ws8.cell(row, col).alignment = Alignment()

# ── 样式 ──
HEADER_FILL = PatternFill('solid', fgColor='1F4E79')
HEADER_FONT = Font(name='Arial', bold=True, size=11, color='FFFFFF')
SECTION_FONT = Font(name='Arial', bold=True, size=11, color='1F4E79')
NORMAL_FONT = Font(name='Arial', size=10)
NOTE_FONT = Font(name='Arial', size=9, color='666666')
THIN_BORDER = Border(
    left=Side(style='thin', color='BBBBBB'),
    right=Side(style='thin', color='BBBBBB'),
    top=Side(style='thin', color='BBBBBB'),
    bottom=Side(style='thin', color='BBBBBB')
)

# ── Row 1: 标题 ──
ws8.cell(1, 1, 'Sheet8 \u00b7 \u6570\u636e\u8d28\u91cf\u8bc4\u4f30(DQR) \u2014 \u53cc\u8f68\u6821\u9a8c(\u56e0\u5b50\u8f69+活动数据轨)')
ws8.cell(1, 1).font = Font(name='Arial', bold=True, size=14, color='1F4E79')
ws8.merge_cells('A1:J1')

# ── Row 2: 空行 ──
# (separator)

# ── Row 3: 表头(10列) ──
headers = [
    '\u5e8f\u53f7',
    '\u6570\u636e\u9879(\u5bf9\u5e94\u4e0a\u8ff0\u5404\u8868\u6761\u76ee)',
    '\u6570\u636e\u7c7b\u578b(\u521d\u7ea7/\u6b21\u7ea7)',
    '\u53ef\u9760\u6027\u8bc4\u5206',
    '\u6280\u672f\u4ee3\u8868\u6027\u8bc4\u5206',
    '\u65f6\u95f4\u4ee3\u8868\u6027\u8bc4\u5206',
    '\u5730\u7406\u4ee3\u8868\u6027\u8bc4\u5206',
    '\u5b8c\u6574\u6027\u8bc4\u5206',
    '\u7efc\u5408DQR',
    '\u8bf4\u660e'
]

for i, h in enumerate(headers):
    ws8.cell(3, i+1, h)
    ws8.cell(3, i+1).font = HEADER_FONT
    ws8.cell(3, i+1).fill = HEADER_FILL
    ws8.cell(3, i+1).alignment = Alignment(horizontal='center', wrap_text=True)
    ws8.cell(3, i+1).border = THIN_BORDER

# ── Row 4-13: 数据行(10行空白+示例提示) ──
# 预填5行示例引导
dqr_examples = [
    ('1', '\u94a2\u6750\u7528\u91cf(\u5854\u67b6/\u5e95\u76d8\u7b49)', '\u521d\u7ea7(\u5b9e\u6d4b/\u91c7\u8d2d\u5355)', '1~2', '', '', '', '', '', '\u5b9e\u6d4b\u6570\u636e\u53ef\u9760\u60271\u5206\uff0c\u91c7\u8d2d\u53552\u5206'),
    ('2', 'NdFeB\u6c38\u78c1\u4f53\u7528\u91cf', '\u521d\u7ea7/\u6b21\u7ea7', '3~5', '', '', '', '', '', '\u7a00\u571f\u6570\u636e\u591a\u4e3a\u6b21\u7ea7(\u6570\u636e\u5e93)\uff0c\u53ef\u9760\u6027\u504f\u4f4e'),
    ('3', '\u7535\u529b\u6d88\u8179(\u5404\u5de5\u5e8f)', '\u521d\u7ea7(\u7535\u8868)', '1', '', '', '', '', '', '\u6821\u51c6\u4eea\u8868\u8fde\u7eed\u5b9e\u6d4b=1\u5206\u6700\u4f18'),
    ('4', '\u8fd0\u8f93\u8ddd\u79bb/\u65b9\u5f0f', '\u521b\u7ea7(\u7269\u6d41\u5355\u636e)', '1~2', '', '', '', '', '', '\u7269\u6d41\u7cfb\u7edf\u6570\u636e\u53ef\u9760'),
    ('5', '\u533a\u57df\u7535\u7f51\u6392\u653e\u56e0\u5b50', '\u6b21\u7ea7(\u56fd\u5bb6\u53d1\u5e03)', '2~3', '', '', '', '', '', '\u653f\u5e9c\u53d1\u5e03\u56e0\u5b50\uff0c\u5730\u7406/\u6280\u672f\u4ee3\u8868\u6027\u53d6\u51b3\u4e8e\u7535\u7f51\u8303\u56f4'),
]

for i, (seq, item, dtype, reliability, tech, temporal, geo, completeness, dqr, note) in enumerate(dqr_examples):
    row = 4 + i
    ws8.cell(row, 1, seq).font = NORMAL_FONT
    ws8.cell(row, 2, item).font = NORMAL_FONT
    ws8.cell(row, 3, dtype).font = NORMAL_FONT
    ws8.cell(row, 4, reliability).font = NOTE_FONT
    ws8.cell(row, 5, tech).font = NORMAL_FONT
    ws8.cell(row, 6, temporal).font = NORMAL_FONT
    ws8.cell(row, 7, geo).font = NORMAL_FONT
    ws8.cell(row, 8, completeness).font = NORMAL_FONT
    ws8.cell(row, 9, dqr).font = NORMAL_FONT
    ws8.cell(row, 10, note).font = NOTE_FONT
    for col in range(1, 11):
        ws8.cell(row, col).border = THIN_BORDER

# Row 9-13: 空白待填行
for row in range(9, 14):
    for col in range(1, 11):
        ws8.cell(row, col).border = THIN_BORDER

# ── Row 14: 说明 ──
ws8.cell(14, 1, '\u8bf4\u660e\uff1aDQR\u91c7\u7528Pedigree Matrix\u4e94\u7ef4\u5ea6\u8bc4\u5206(1\u4f18~5\u5dee)\uff1a\u53ef\u9760\u6027\u3001\u5b8c\u6574\u6027\u3001\u65f6\u95f4\u76f8\u5173\u6027\u3001\u5730\u7406\u76f8\u5173\u6027\u3001\u6280\u672f\u76f8\u5173\u6027\u3002\u56e0\u5b50\u8f68(D-F)\u4e0e\u6d3b\u52a8\u6570\u636e\u8f68(D-A)\u5fc5\u987b\u5206\u522b\u8bc4\u5206\u3001\u5206\u522b\u6821\u9a8c\uff0c\u4e24\u8f68\u7efc\u5408DQR\u5747\u987b\u2264\u4e2e\u9650\u503c(\u9ed8\u8ba43.0)\u65b9\u53ef\u51fa\u5177\u62a5\u544a\u3002\u7efc\u5408DQR\u516c\u5f0f\u7c7b\u578b(\u7b49\u6743\u91cd\u7b97\u672f\u5e73\u5300/\u53ef\u914d\u7f6e\u52a0\u6743\u5e73\u5300)\u53ca\u5404\u7ef4\u5ea6\u6743\u91cd\u7531PCR/\u6807\u51c6\u89c4\u5b9a\uff0c\u672c\u8868\u4f9b\u53c2\u8003\u3002\u53ef\u9760\u6027\u8bc4\u5206\u5efa\u8bae\uff1a\u6821\u51c6\u4eea\u8868\u5b9e\u6d4b=1\uff0c\u91c7\u8d2d\u5355/\u5408\u89c4\u53d1\u7968=2\uff0c\u4f01\u4e1a\u7edf\u8ba1\u62a5\u8868=3\uff0c\u4e13\u5bb6\u4f30\u7b97=4\uff0c\u7c97\u7565\u4f30\u7b97/\u65e0\u4f9d\u636e=5\u3002')
ws8.cell(14, 1).font = NOTE_FONT
ws8.merge_cells('A14:J14')

# ── Row 15: 风机典型DQR关注点 ──
ws8.cell(15, 1, '\u98ce\u673a\u7279\u522b\u5173\u6ce8\uff1a\u6c38\u78c1\u4f53(\u7a00\u571f)\u6570\u636e\u53ef\u9760\u6027\u504f\u4f4e(3~5)\uff1b\u7535\u529b\u6570\u636e\u53ef\u9760\u6027\u9ad8(1~2)\uff1b\u6392\u653e\u56e0\u5b50\u6280\u672f/\u5730\u7406\u4ee3\u8868\u6027\u53d6\u51b3\u4e8e\u7535\u7f51\u8303\u56f4\uff1bSF6\u6570\u636e\u5b8c\u6574\u6027\u9700\u91cd\u70b9\u8bc4\u4f30(\u6f0f\u8d44\u6570\u636e\u5f80\u5f80\u4e0d\u5168)\u3002')
ws8.cell(15, 1).font = NOTE_FONT
ws8.merge_cells('A15:J15')

# 设置列宽
col_widths = {1:6, 2:25, 3:12, 4:10, 5:10, 6:10, 7:10, 8:10, 9:10, 10:30}
for c, w in col_widths.items():
    ws8.column_dimensions[openpyxl.utils.get_column_letter(c)].width = w

wb.save('风机产品碳足迹收资清单.xlsx')
print('Sheet8 DQR rebuilt OK')
print('Row3 headers:', [ws8.cell(3,c).value for c in range(1,11)])
print('Row4 example:', [ws8.cell(4,c).value for c in range(1,11)])
