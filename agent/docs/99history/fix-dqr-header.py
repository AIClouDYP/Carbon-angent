import openpyxl, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

from openpyxl.styles import Font, PatternFill, Alignment

wb = openpyxl.load_workbook('风机产品碳足迹收资清单.xlsx')
ws8 = wb['8.数据质量评估DQR']

HEADER_FILL = PatternFill('solid', fgColor='1F4E79')
HEADER_FONT = Font(name='Arial', bold=True, size=11, color='FFFFFF')
NOTE_FONT = Font(name='Arial', size=9, color='666666')

# 检查实际结构
print('Row1:', [ws8.cell(1,c).value for c in range(1,11)])
print('Row2:', [ws8.cell(2,c).value for c in range(1,11)])
print('Row3:', [ws8.cell(3,c).value for c in range(1,11)])

# 实际header在Row3! 修正:
# 1. 清除Row2的误写内容
for col in range(4, 11):
    ws8.cell(2, col).value = None

# 2. 修正Row3(真正的表头行): 读取原D~I值并右移到E~J, D列设为'可靠性评分'
old_vals = []
for col in range(4, 10):  # D(4) to I(9)
    old_vals.append(ws8.cell(3, col).value)

# 右移: E~J
for j, v in enumerate(old_vals):
    ws8.cell(3, 5 + j, v)
    ws8.cell(3, 5 + j).font = HEADER_FONT
    ws8.cell(3, 5 + j).fill = HEADER_FILL
    ws8.cell(3, 5 + j).alignment = Alignment(horizontal='center', wrap_text=True)

# D列设为可靠性评分
ws8.cell(3, 4, '可靠性评分')
ws8.cell(3, 4).font = HEADER_FONT
ws8.cell(3, 4).fill = HEADER_FILL
ws8.cell(3, 4).alignment = Alignment(horizontal='center', wrap_text=True)

# 修正A/B/C表头(保持原值)
ws8.cell(3, 1).font = HEADER_FONT
ws8.cell(3, 1).fill = HEADER_FILL
ws8.cell(3, 2).font = HEADER_FONT
ws8.cell(3, 2).fill = HEADER_FILL
ws8.cell(3, 3).font = HEADER_FONT
ws8.cell(3, 3).fill = HEADER_FILL

# 修正数据行(Row4~Row8示例行): 之前shift了Row3-13,但Row3是表头被shift了
# 需要重新修正Row4+的数据行
# Row4~Row8是示例行(之前的Row3~Row7被shift到了Row4~Row8?)
# 查看当前状态
print('\nAfter fix Row3:', [ws8.cell(3,c).value for c in range(1,11)])
for r in range(4, 9):
    print(f'Row{r}:', [ws8.cell(r,c).value for c in range(1,11)])

wb.save('风机产品碳足迹收资清单.xlsx')
print('\nSaved OK')
