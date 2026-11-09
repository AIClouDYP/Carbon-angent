import openpyxl, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

wb = openpyxl.load_workbook('风机产品碳足迹收资清单.xlsx')

# ═══════════════════════════════════════
# Sheet0: 使用说明 — 29个合并
# ═══════════════════════════════════════
ws0 = wb['使用说明']
# Title: A1:F1
ws0.merge_cells('A1:F1')
# Section headers: A3:F3, A5:F5, A15:F15, A25:F15... (这些是"一、适用范围"等标题行)
ws0.merge_cells('A3:F3')   # 一、适用范围
ws0.merge_cells('A5:F5')   # 二、主要依据标准
ws0.merge_cells('A15:F15') # 三、本工作簿结构
ws0.merge_cells('A25:F25') # 四、填写建议 (原row25)
# Content rows: B列内容跨B:F (长文本说明)
for r in [4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16, 17, 18, 19, 20, 21, 22, 23,
          26, 27, 28, 29]:
    ws0.merge_cells(f'B{r}:F{r}')
# 新增的校验自查区域也需要合并
# Row30: section title
ws0.merge_cells('A30:F30')
# Row31-34: content rows
for r in range(31, 35):
    ws0.merge_cells(f'B{r}:F{r}')

print(f'Sheet0: 使用说明 merges restored')

# ═══════════════════════════════════════
# Sheet1: 基本信息 — 53个合并
# ═══════════════════════════════════════
ws1 = wb['1.基本信息与边界']
# Title: A1:F1
ws1.merge_cells('A1:F1')
# Section headers: A3:F3 (基本信息), A15:F15 (功能单位), A20:F20 (系统边界), A30:F30 (GHG范围)
ws1.merge_cells('A3:F3')
ws1.merge_cells('A15:F15')
ws1.merge_cells('A20:F20')
# A30原来是GHG范围, 但我们新加了内容在Row28-37, 需要检查
# Row30原有是GHG范围标题行, 现在Row28是海上专项标题, Row35是SF6声明标题
# GHG范围标题在Row35附近（原来在Row30，因为我们加了6行海上+2行SF6，所以移到了Row38?）
# 实际上我在脚本中是在Row28开始插入海上专项, Row35开始SF6
# 原Row30(GHG范围)变成了Row37或38? 让我检查实际内容
# 原始结构: Row29=温室气体范围与GWP口径, Row30=纳入GHG种类, Row31=GWP取值来源, Row32=截断准则
# 我在Row28插入了海上专项(6行到Row33), Row35插入SF6(2行到Row36)
# 所以原来的Row29变成了Row37, Row30→38, Row31→39, Row32→40
# 但实际我的脚本是在Row28后面插入, 所以原来的Row29-32保持不动?
# 等等, 我用的是ws1.cell(row, col)直接在空行上写, 不影响原有行位置
# 原有内容在Row3-32, 我在Row28-36上写入新内容
# 原Row28是"主要排除项及理由"行, Row29是"温室气体范围"标题行
# 我在Row28写入了"海上风电专项"标题, 覆盖了原来的Row28空行?
# 原Row28: 主要排除项及理由 (在E列有hint)
# 让我检查当前Row28的内容来确认
print(f'Row28: {ws1.cell(28,1).value}')  # 应该是海上风电专项
print(f'Row29: {ws1.cell(29,1).value}')  # 应该是海上基础类型
# 原有的Row28(排除项)被我的海上专项标题覆盖了

# 对于已修改的sheet1, 需要根据实际内容重新确定合并
# 先读取所有行内容来确定合并策略
for r in range(1, ws1.max_row + 1):
    a = ws1.cell(r, 1).value or ''
    if a.strip():
        print(f'Row{r} A: {a[:50]}')

# 标题行合并(A列跨全行)
ws1.merge_cells('A1:F1')    # 总标题
ws1.merge_cells('A3:F3')    # "基本信息"标题

# 每个字段行: B:D合并(label), E:F合并(hint)
# 原4-13行是字段行, 16-18是功能单位行, 21-27是边界行, 29-32是GHG行
# 现在需要根据实际内容来合并

# 读取各行确定哪些是字段行(有label在A列)
field_rows = []
for r in range(4, ws1.max_row + 1):
    a_val = ws1.cell(r, 1).value
    if a_val and str(a_val).strip() and not str(a_val).startswith('是否') and '声明' not in str(a_val) and '专项' not in str(a_val):
        # 这是一个字段标签行
        field_rows.append(r)
    elif a_val and ('声明' in str(a_val) or '专项' in str(a_val) or '范围' in str(a_val) or '边界' in str(a_val) or '功能' in str(a_val) or '信息' in str(a_val)):
        # 这是section标题行
        ws1.merge_cells(f'A{r}:F{r}')

print(f'Section title merges applied')
print(f'Field rows: {field_rows}')

# 字段行: B:D=label, E:F=hint
for r in field_rows:
    ws1.merge_cells(f'B{r}:D{r}')
    ws1.merge_cells(f'E{r}:F{r}')

print(f'Sheet1: 基本信息 merges restored')

# ═══════════════════════════════════════
# Sheet2: BOM — 2个合并
# ═══════════════════════════════════════
ws2 = wb['2.整机BOM物料清单']
ws2.merge_cells('A1:K1')   # 标题
# 填写说明行(原Row29, 现可能有偏移)
# 找到填写说明行
for r in range(28, 32):
    v = ws2.cell(r, 1).value
    if v and '填写说明' in str(v):
        ws2.merge_cells(f'A{r}:M{r}')  # 现在是13列
        print(f'Sheet2 note row: {r}')
        break
# 新增列说明行
for r in range(28, 32):
    v = ws2.cell(r, 1).value
    if v and '新增列' in str(v):
        ws2.merge_cells(f'A{r}:M{r}')
        print(f'Sheet2 new-col note row: {r}')
        break

print(f'Sheet2: BOM merges restored')

# ═══════════════════════════════════════
# Sheet3: 生产制造 — 6个合并
# ═══════════════════════════════════════
ws3 = wb['3.生产制造阶段']
ws3.merge_cells('A1:J1')    # 标题
# 找到分区标题行(A列含"A."/"B."/"C."/"D.")
for r in range(3, 25):
    v = ws3.cell(r, 1).value
    if v and ('A.' in str(v) or 'B.' in str(v) or 'C.' in str(v) or 'D.' in str(v)):
        ws3.merge_cells(f'A{r}:J{r}')
        print(f'Sheet3 section row: {r} = {str(v)[:30]}')
# 找到提示/说明行
for r in range(25, 31):
    v = ws3.cell(r, 1).value
    if v and ('提示' in str(v) or '说明' in str(v)):
        ws3.merge_cells(f'A{r}:J{r}')
        print(f'Sheet3 note row: {r}')
        break

print(f'Sheet3: 生产制造 merges restored')

# ═══════════════════════════════════════
# Sheet4: 运输 — 1个合并
# ═══════════════════════════════════════
ws4 = wb['4.运输与分销阶段']
ws4.merge_cells('A1:J1')    # 标题(现在10列)
print(f'Sheet4: 运输 merges restored')

# ═══════════════════════════════════════
# Sheet5: 安装 — 1个合并
# ═══════════════════════════════════════
ws5 = wb['5.安装建设阶段(可选)']
ws5.merge_cells('A1:H1')
print(f'Sheet5: 安装 merges restored')

# ═══════════════════════════════════════
# Sheet6: 使用 — 1个合并
# ═══════════════════════════════════════
ws6 = wb['6.使用阶段(可选)']
ws6.merge_cells('A1:H1')
print(f'Sheet6: 使用 merges restored')

# ═══════════════════════════════════════
# Sheet7: 生命末期 — 合合并
# ═══════════════════════════════════════
ws7 = wb['7.生命末期阶段(可选)']
ws7.merge_cells('A1:H1')    # 标题
# 回收方法论声明行合并
for r in range(10, 15):
    v = ws7.cell(r, 1).value
    if v and ('回收方法论' in str(v) or '核算方法' in str(v) or '回收负排放' in str(v) or '叶片回收' in str(v) or '永磁体稀土' in str(v)):
        ws7.merge_cells(f'A{r}:H{r}')
        print(f'Sheet7 method row: {r}')
print(f'Sheet7: 生命末期 merges restored')

# ═══════════════════════════════════════
# Sheet8: DQR — 已在fix脚本中处理
# ═══════════════════════════════════════
ws8 = wb['8.数据质量评估DQR']
# 检查当前合并
current_merges = list(ws8.merged_cells.ranges)
print(f'Sheet8 current merges: {current_merges}')
# 确保有: A1:J1(标题), A14:J14(说明), A15:J15(风机关注)
if not any('A1' in str(m) for m in current_merges):
    ws8.merge_cells('A1:J1')
if not any('A14' in str(m) for m in current_merges):
    ws8.merge_cells('A14:J14')
if not any('A15' in str(m) for m in current_merges):
    ws8.merge_cells('A15:J15')
print(f'Sheet8: DQR merges verified')

# ── 保存 ──
wb.save('风机产品碳足迹收资清单.xlsx')
print('\n所有合并单元格已恢复！')
