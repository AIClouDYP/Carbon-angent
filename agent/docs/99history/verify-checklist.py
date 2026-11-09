import openpyxl, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
wb = openpyxl.load_workbook('风机产品碳足迹收资清单.xlsx')

# Sheet2 BOM新增行
ws2 = wb['2.整机BOM物料清单']
print('=== Sheet2 BOM新增部件(Row 22-27) ===')
for row in range(22, 28):
    b = ws2.cell(row, 2).value or ''
    d = ws2.cell(row, 4).value or ''
    l = ws2.cell(row, 12).value or ''
    m = ws2.cell(row, 13).value or ''
    print(f'  Row{row}: {b} | {d[:30]} | L={l[:30]} | M={m}')

# Sheet8 DQR表头
ws8 = wb['8.数据质量评估DQR']
print('\n=== Sheet8 DQR表头(Row 2) ===')
for col in range(1, 11):
    v = ws8.cell(2, col).value
    print(f'  Col{col}: {v}')

# Sheet8 DQR示例
print('\n=== Sheet8 DQR示例(Row 3) ===')
for col in range(1, 11):
    v = ws8.cell(3, col).value
    print(f'  Col{col}: {v}')

# Sheet1海上专项
ws1 = wb['1.基本信息与边界']
print('\n=== Sheet1 海上风电+SF6(Row 28+) ===')
for row in range(28, 38):
    a = ws1.cell(row, 1).value or ''
    c = ws1.cell(row, 3).value or ''
    if a.strip() or c.strip():
        print(f'  Row{row}: {a[:40]} | hint={c[:40]}')

# Sheet6 SF6行
ws6 = wb['6.使用阶段(可选)']
print('\n=== Sheet6 SF6(Row 8) ===')
b = ws6.cell(8, 2).value or ''
n = ws6.cell(8, 8).value or ''
print(f'  {b} | note={n}')

# Sheet7 SF6行
ws7 = wb['7.生命末期阶段(可选)']
print('\n=== Sheet7 SF6+方法论(Row 8+) ===')
for row in range(8, 15):
    b = ws7.cell(row, 2).value or ''
    n = ws7.cell(row, 7).value or ''
    r = ws7.cell(row, 8).value or ''
    if b.strip():
        print(f'  Row{row}: {b} | note={n[:30]} | recycle={r}')
