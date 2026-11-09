import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from copy import copy

wb = openpyxl.load_workbook('e:/AI/碳亦管碳足迹智能体/CFP/风机产品碳足迹收资清单.xlsx')

# ── 样式定义 ──
HEADER_FILL = PatternFill('solid', fgColor='1F4E79')
HEADER_FONT = Font(name='Arial', bold=True, size=11, color='FFFFFF')
SECTION_FILL = PatternFill('solid', fgColor='D5E8F0')
SECTION_FONT = Font(name='Arial', bold=True, size=11, color='1F4E79')
NORMAL_FONT = Font(name='Arial', size=10)
NOTE_FONT = Font(name='Arial', size=9, color='666666')
RED_FONT = Font(name='Arial', size=10, color='FF0000', bold=True)
THIN_BORDER = Border(
    left=Side(style='thin', color='BBBBBB'),
    right=Side(style='thin', color='BBBBBB'),
    top=Side(style='thin', color='BBBBBB'),
    bottom=Side(style='thin', color='BBBBBB')
)

def unmerge_all(ws):
    """解除所有合并单元格"""
    for m in list(ws.merged_cells.ranges):
        ws.unmerge_cells(str(m))

def apply_border(ws, min_row, max_row, min_col, max_col):
    for r in range(min_row, max_row+1):
        for c in range(min_col, max_col+1):
            ws.cell(r, c).border = THIN_BORDER

# ═══════════════════════════════════════
# Sheet 2: BOM 物料清单 — 缺口2/9/10
# ═══════════════════════════════════════
ws2 = wb['2.整机BOM物料清单']
unmerge_all(ws2)

# 先读取现有结构确定行列
# 当前: Row 2 是表头, Row 3-21 是19个部件行, Row 29 是填写说明
# 需要增加: 永磁体/变压器/偏航变桨轴承/液压系统/防雷系统/隔音防振 + 2列(预期因子库/预估贡献)

# Step 1: 增加2列到BOM表头(Row 2)
# 当前列: A=序号, B=所属部件, C=材料名称, D=材质规格, E=单位, F=单机用量, G=废损率, H=数据来源, I=供应商/产地, J=运输距离, K=备注
# 新增: L=预期排放因子库, M=预估排放贡献占比(%)

ws2.cell(2, 12, '预期排放因子库')
ws2.cell(2, 12).font = HEADER_FONT
ws2.cell(2, 12).fill = HEADER_FILL
ws2.cell(2, 12).alignment = Alignment(horizontal='center', wrap_text=True)

ws2.cell(2, 13, '预估排放贡献占比(%)')
ws2.cell(2, 13).font = HEADER_FONT
ws2.cell(2, 13).fill = HEADER_FILL
ws2.cell(2, 13).alignment = Alignment(horizontal='center', wrap_text=True)

# Step 2: 在现有部件行后插入6行新增部件
# 当前部件行: Row 3-21 (19行)
# 需要在Row 21(其他辅料)后插入6行
# 先在Row 22-27插入新行
new_parts = [
    ('20', '永磁体/稀土永磁材料(NdFeB)', '仅直驱/半直驱机型适用', '含Nd/Pr/Dy等稀土元素种类及用量，稀土开采冶炼排放因子极高(约50~100倍于普通钢材)', 'Ecoinvent/CLCD: Rare earth oxide production'),
    ('21', '变压器/箱式变电站', '含铜绕组+硅钢片+绝缘油', '整机PCF占比可达3%~5%，绝缘油须单独列项', 'Ecoinvent: Transformer production'),
    ('22', '偏航/变桨轴承(大型特种轴承)', '区别于主轴承', '与Row 6主轴及主轴承分开填报', ''),
    ('23', '液压系统(油缸/泵/阀/管路)', '含液压油', '液压油在使用阶段定期更换(见Sheet6)', ''),
    ('24', '防雷系统(接闪器/引下线/接地)', '含铜导体', '功能必要但质量占比小', ''),
    ('25', '隔音/防振材料', '聚氨酯/橡胶/矿棉', '机舱内部隔音层', ''),
]

for i, (seq, part, mat_spec, note, factor_db) in enumerate(new_parts):
    row = 22 + i
    ws2.cell(row, 1, seq).font = NORMAL_FONT
    ws2.cell(row, 2, part).font = NORMAL_FONT
    ws2.cell(row, 3, '').font = NORMAL_FONT  # 材料名称留空待填
    ws2.cell(row, 4, mat_spec).font = NOTE_FONT
    ws2.cell(row, 5, '').font = NORMAL_FONT
    ws2.cell(row, 6, '').font = NORMAL_FONT
    ws2.cell(row, 7, '').font = NORMAL_FONT
    ws2.cell(row, 8, '').font = NORMAL_FONT
    ws2.cell(row, 9, '').font = NORMAL_FONT
    ws2.cell(row, 10, '').font = NORMAL_FONT
    ws2.cell(row, 11, note).font = NOTE_FONT
    ws2.cell(row, 12, factor_db).font = NOTE_FONT
    ws2.cell(row, 13, '').font = NORMAL_FONT

# 永磁体行高亮红色提示
ws2.cell(22, 2).font = RED_FONT
ws2.cell(22, 11).font = RED_FONT

# Step 3: 给现有3-21行的L/M列填充引导性内容
# 为原有部件行也增加因子库提示和贡献占比提示
bom_factor_hints = {
    3: ('塔架', 'Ecoinvent/CLCD: Steel, low-alloyed', '15%~25%'),
    4: ('基础', 'Ecoinvent: Concrete/Reinforcing steel', '5%~15%'),
    5: ('机舱罩', 'Ecoinvent: Glass fibre reinforced plastic', '2%~3%'),
    6: ('叶片', 'Ecoinvent: Glass fibre reinforced plastic / epoxy resin', '5%~10%'),
    7: ('轮毂', 'Ecoinvent: Cast iron / Steel', '3%~5%'),
    8: ('主轴及主轴承', 'Ecoinvent: Steel, high-alloyed / bearing steel', '3%~5%'),
    9: ('机舱底盘', 'Ecoinvent: Steel, low-alloyed', '3%~5%'),
    10: ('发电机', 'Ecoinvent: Copper wire + NdFeB(如直驱)', '5%~15%'),
    11: ('齿轮箱', 'Ecoinvent: Steel + Gear oil', '3%~5%'),
    12: ('变流器/电控柜', 'Ecoinvent: Electronic components', '1%~3%'),
    13: ('偏航系统', 'Ecoinvent: Steel + Motor', '1%~2%'),
    14: ('变桨系统', 'Ecoinvent: Steel + Motor', '1%~2%'),
    15: ('制动系统', 'Ecoinvent: Cast iron + Brake pad', '<1%'),
    16: ('冷却与润滑系统', 'Ecoinvent: Heat exchanger + Lubricating oil', '1%~2%'),
    17: ('螺栓/紧固件', 'Ecoinvent: Steel, high-strength', '1%~2%'),
    18: ('油漆/防腐涂层', 'Ecoinvent: Paint / Coating', '<1%'),
    19: ('电缆及线缆', 'Ecoinvent: Copper + PVC/XLPE cable', '1%~3%'),
    20: ('包装材料', 'Ecoinvent: Wood pallet / Plastic wrap', '<1%'),
    21: ('其他辅料', '', '<1%'),
}

for row, (part, hint, contrib) in bom_factor_hints.items():
    ws2.cell(row, 12, hint).font = NOTE_FONT
    ws2.cell(row, 13, contrib).font = NOTE_FONT

# 更新填写说明(Row 29或更后)
note_row = 29  # 原填写说明行
# 在填写说明前插入一条关于新列的说明
ws2.cell(note_row - 1, 1, '新增列说明：①"预期排放因子库"列——建议标注每种材料预期匹配的排放因子数据库名称及因子类别，便于阶段5因子匹配预判；②"预估排放贡献占比"列——标注该部件对整机PCF的预估贡献比例，超过10%的项将在敏感性分析中重点关注。').font = NOTE_FONT

apply_border(ws2, 2, 27, 1, 13)

# 调整列宽
ws2.column_dimensions['L'].width = 30
ws2.column_dimensions['M'].width = 20

# ═══════════════════════════════════════
# Sheet 3: 生产制造阶段 — 缺口5
# ═══════════════════════════════════════
ws3 = wb['3.生产制造阶段']
unmerge_all(ws3)

# 当前: Row 3-9 是A能源消耗(7行空行), Row 10-15 B辅料(6行空行), Row 16-21 C废弃物(6行空行), Row 22-28 D电力因子(7行空行)
# 在A能源消耗区域(Row 3-9)预填典型工序引导行

manufacturing_processes = [
    ('1', '叶片车间', '叶片铺层/灌注/固化', '电力 + 压缩空气 + 树脂加热', 'kWh + m³ + MJ', '含真空灌注工艺压缩空气消耗'),
    ('2', '叶片车间', '叶片后处理(修边/打磨/涂装)', '电力 + 涂料/溶剂', 'kWh + kg', 'VOC排放须在C区记录'),
    ('3', '塔架车间', '塔架卷板/焊接', '电力 + 天然气 + 焊接气体', 'kWh + m³ + L', '焊缝探伤耗电另计'),
    ('4', '塔架车间', '塔架涂装/防腐', '电力 + 油漆/防腐涂料', 'kWh + kg', '海上型三层防腐须单独列项'),
    ('5', '铸造车间', '轮毂/机舱底盘铸造', '电力 + 天然气(熔炼)', 'kWh + m³', '铸件机加工台班另计'),
    ('6', '发电机车间', '发电机绕线/永磁体装配', '电力 + 粘接剂/绝缘材料', 'kWh + kg', '直驱型永磁体粘接需注明环氧树脂用量'),
    ('7', '齿轮箱车间(如适用)', '齿轮箱加工/装配', '电力 + 润滑油', 'kWh + L', '仅半直驱/双馈机型'),
]

for i, (seq, base, process, energy_type, unit, note) in enumerate(manufacturing_processes):
    row = 3 + i
    ws3.cell(row, 1, seq).font = NORMAL_FONT
    ws3.cell(row, 2, base).font = NORMAL_FONT
    ws3.cell(row, 3, process).font = NORMAL_FONT
    ws3.cell(row, 4, energy_type).font = NOTE_FONT
    ws3.cell(row, 5, '').font = NORMAL_FONT  # 消耗量留空
    ws3.cell(row, 6, unit).font = NOTE_FONT
    ws3.cell(row, 7, '').font = NORMAL_FONT  # 数据周期留空
    ws3.cell(row, 8, '').font = NORMAL_FONT  # 分摊方式留空
    ws3.cell(row, 9, '').font = NORMAL_FONT  # 数据来源留空
    ws3.cell(row, 10, note).font = NOTE_FONT

apply_border(ws3, 2, 28, 1, 10)

# ═══════════════════════════════════════
# Sheet 4: 运输与分销阶段 — 缺口6
# ═══════════════════════════════════════
ws4 = wb['4.运输与分销阶段']
unmerge_all(ws4)

# 当前: 只有4行(Row 3-6)，需要扩展为部件级细目
# 先删除现有内容(Row 3-6)，然后重建

# 新增列: 回程空载率(%) — 风机大部件运输的关键特性
ws4.cell(2, 10, '回程空载率(%)')
ws4.cell(2, 10).font = HEADER_FONT
ws4.cell(2, 10).fill = HEADER_FILL
ws4.cell(2, 10).alignment = Alignment(horizontal='center', wrap_text=True)

transport_items = [
    ('1', '原材料→部件厂', '钢板→塔架厂', '公路/铁路', '', '单程', '', '', '钢材运输', '>80%(专用车回程空载)'),
    ('2', '原材料→部件厂', '树脂/玻纤→叶片厂', '公路', '', '单程', '', '', '', '<30%'),
    ('3', '原材料→部件厂', '铜线/硅钢片→发电机厂', '公路/铁路', '', '单程', '', '', '', '<30%'),
    ('4', '原材料→部件厂', 'NdFeB永磁体→发电机厂', '公路/航空', '', '单程', '', '', '稀土运输需单独列项', '<50%'),
    ('5', '部件→总装厂', '轮毂→总装基地', '公路', '', '单程', '', '', '', '>50%'),
    ('6', '部件→总装厂', '齿轮箱→总装基地(如适用)', '公路', '', '单程', '', '', '', '>50%'),
    ('7', '部件→总装厂', '发电机→总装基地', '公路', '', '单程', '', '', '', '>50%'),
    ('8', '整机→风场(陆上)', '塔架分段(×3~5段)', '专用超长平板车', '', '单程', '', '柴油', '超长超重件，限速限路段', '>90%(几乎空车返回)'),
    ('9', '整机→风场(陆上)', '叶片(×3片)', '专用叶片运输车', '', '单程', '', '柴油', '最长可达80m+', '>90%'),
    ('10', '整机→风场(陆上)', '机舱整体', '重型平板车', '', '单程', '', '柴油', '', '>80%'),
    ('11', '整机→风场(海上)', '所有大部件→港口→海上风场', '海运+驳船+海上吊装船', '', '单程', '', '柴油(船舶)', '海上运输需单独列项，含安装船台班', '>70%(船舶返程)'),
    ('12', '包装材料运输', '木托盘/塑料膜等', '公路', '', '往返', '', '', '占比极小', '<10%'),
]

for i, (seq, stage, cargo, mode, dist, trip, load, fuel, source, empty_rate) in enumerate(transport_items):
    row = 3 + i
    ws4.cell(row, 1, seq).font = NORMAL_FONT
    ws4.cell(row, 2, stage).font = NORMAL_FONT
    ws4.cell(row, 3, cargo).font = NORMAL_FONT
    ws4.cell(row, 4, mode).font = NORMAL_FONT
    ws4.cell(row, 5, dist).font = NORMAL_FONT  # 距离留空待填
    ws4.cell(row, 6, trip).font = NOTE_FONT
    ws4.cell(row, 7, load).font = NORMAL_FONT
    ws4.cell(row, 8, fuel).font = NOTE_FONT
    ws4.cell(row, 9, source).font = NOTE_FONT
    ws4.cell(row, 10, empty_rate).font = NOTE_FONT

# 塔架和叶片行的空载率高亮
ws4.cell(10, 10).font = RED_FONT  # 塔架空载率>90%
ws4.cell(11, 10).font = RED_FONT  # 叶片空载率>90%

apply_border(ws4, 2, 14, 1, 10)
ws4.column_dimensions['J'].width = 25

# ═══════════════════════════════════════
# Sheet 5: 安装建设阶段 — 缺口7
# ═══════════════════════════════════════
ws5 = wb['5.安装建设阶段(可选)']
unmerge_all(ws5)

# 当前只有标题行(Row 0-2)，需要预填工序行
install_processes = [
    ('1', '道路/场地建设(陆上)', '柴油', '', 'L/m³', '挖掘机/推土机台班', '', '含进场道路修建、基础开挖'),
    ('2', '基础施工(陆上)', '柴油+电力', '', 'L+kWh', '混凝土搅拌车/泵车台班', '', '含混凝土浇筑、钢筋绑扎、预埋件安装'),
    ('3', '基础施工(海上)', '柴油(船舶)', '', 'L', '打桩船/施工平台台班', '', '含钢管桩施工/导管架安装，海上基础钢材用量远大于陆上'),
    ('4', '吊装(陆上)', '柴油', '', 'L', '吊车台班(500t+级)', '', '主吊+辅助吊车协同作业'),
    ('5', '吊装(海上)', '柴油(船舶)', '', 'L', '海上吊装船台班', '', '海上安装船燃油消耗极大，单台班可达数千升'),
    ('6', '海缆敷设(海上)', '柴油(船舶)', '', 'L', '海缆铺设船台班', '', '仅海上风电适用'),
    ('7', '调试并网', '电力', '', 'kWh', '', '', '机组调试期间用电(从电网取电)'),
]

for i, (seq, process, energy, qty, unit, equip, period, note) in enumerate(install_processes):
    row = 3 + i
    ws5.cell(row, 1, seq).font = NORMAL_FONT
    ws5.cell(row, 2, process).font = NORMAL_FONT
    ws5.cell(row, 3, energy).font = NORMAL_FONT
    ws5.cell(row, 4, qty).font = NORMAL_FONT
    ws5.cell(row, 5, unit).font = NOTE_FONT
    ws5.cell(row, 6, equip).font = NOTE_FONT
    ws5.cell(row, 7, period).font = NORMAL_FONT
    ws5.cell(row, 8, note).font = NOTE_FONT

apply_border(ws5, 2, 9, 1, 8)

# ═══════════════════════════════════════
# Sheet 6: 使用阶段 — 缺口8+3(SF6)
# ═══════════════════════════════════════
ws6 = wb['6.使用阶段(可选)']
unmerge_all(ws6)

# 当前: Row 3-7 有5行(自耗电/润滑油/备件/运维交通/检修)
# 需要增加: SF6泄漏/防腐重涂/重大部件更换/叶片油泄漏

new_use_items = [
    ('', 'SF₆开关设备泄漏(GWP=23,500)', '含SF₆开关柜/箱变的SF₆充注量×年泄漏率(0.5%~2%)', '', 'kg SF₆/年', '', '', '🔴 关键排放源！SF₆的GWP是CO₂的23500倍'),
    ('', '防腐重涂(海上)', '海上风机每5~8年重涂一次', '', 'kg涂料/次', '', '', '仅海上机型适用'),
    ('', '重大部件更换(齿轮箱/发电机等)', '20年寿命期内故障更换概率统计', '', '次/台', '', '', '基于行业故障率统计数据'),
    ('', '叶片/齿轮箱油泄漏补充', '运行期间润滑油微量泄漏及定期补充', '', 'L/年', '', '', '与Sheet2液压系统对应'),
]

for i, (seq, item, desc, val, unit, years, source, note) in enumerate(new_use_items):
    row = 8 + i
    ws6.cell(row, 1, seq).font = NORMAL_FONT
    ws6.cell(row, 2, item).font = NORMAL_FONT
    ws6.cell(row, 3, desc).font = NOTE_FONT
    ws6.cell(row, 4, val).font = NORMAL_FONT
    ws6.cell(row, 5, unit).font = NOTE_FONT
    ws6.cell(row, 6, years).font = NORMAL_FONT
    ws6.cell(row, 7, source).font = NORMAL_FONT
    ws6.cell(row, 8, note).font = NOTE_FONT

# SF6行红色高亮
ws6.cell(8, 2).font = RED_FONT
ws6.cell(8, 8).font = RED_FONT

apply_border(ws6, 2, 11, 1, 8)

# ═══════════════════════════════════════
# Sheet 7: 生命末期阶段 — 缺口11+3(SF6处置)
# ═══════════════════════════════════════
ws7 = wb['7.生命末期阶段(可选)']
unmerge_all(ws7)

# 当前: Row 3-7 有5行(金属/叶片/电子/基础/润滑油)
# 需要增加: SF6回收处置 + 回收方法论声明区域 + 回收率列

# 新增列: 回收率(%) — 在现有列后增加
ws7.cell(2, 8, '回收率(%)')
ws7.cell(2, 8).font = HEADER_FONT
ws7.cell(2, 8).fill = HEADER_FILL
ws7.cell(2, 8).alignment = Alignment(horizontal='center', wrap_text=True)

# 为现有5行填写典型回收率提示
existing_recycle_rates = {
    3: ('金属部件', '85%~95%'),
    4: ('叶片(复合材料)', '<5%(当前国内主要填埋)，欧盟目标>70%'),
    5: ('电子元件/电控设备', '60%~80%'),
    6: ('基础混凝土', '30%~50%(陆上可就地利用)，0%(海上基础不拆除)'),
    7: ('润滑油/绝缘油等危废', '90%(再生处理)'),
}

for row, (part, rate) in existing_recycle_rates.items():
    ws7.cell(row, 8, rate).font = NOTE_FONT

# 新增行: SF6回收处置 + 永磁体回收 + 回收方法论声明
new_EOL_items = [
    ('', 'SF₆气体回收/处置', '回收+净化再利用/高温分解', '', '', '', '🔴 须确保SF₆不释放至大气！回收率目标>95%', '>95%'),
    ('', '永磁体(NdFeB)回收', '稀土回收(当前<5%，目标>30%)', '', '', '', '稀土回收是行业难点，PCR对回收收益计算方式有规定', '<5%(当前)'),
]

for i, (seq, part, method, pct, dist, energy, note, recycle) in enumerate(new_EOL_items):
    row = 8 + i
    ws7.cell(row, 1, seq).font = NORMAL_FONT
    ws7.cell(row, 2, part).font = NORMAL_FONT
    ws7.cell(row, 3, method).font = NOTE_FONT
    ws7.cell(row, 4, pct).font = NORMAL_FONT
    ws7.cell(row, 5, dist).font = NORMAL_FONT
    ws7.cell(row, 6, energy).font = NORMAL_FONT
    ws7.cell(row, 7, note).font = NOTE_FONT
    ws7.cell(row, 8, recycle).font = NOTE_FONT

# SF6行红色高亮
ws7.cell(8, 2).font = RED_FONT
ws7.cell(8, 7).font = RED_FONT

# 在数据行后增加回收方法论声明区域
method_row = 10
ws7.cell(method_row, 1, '回收方法论声明（须在报告中明确）').font = SECTION_FONT
ws7.merge_cells(start_row=method_row, start_column=1, end_row=method_row, end_column=8)

method_items = [
    '核算方法：截断法(Cut-off) / 替代法(Substitution) / 回收含量法 —— 不同方法对总PCF影响差异可达10%~30%，以PCR规定为准',
    '回收负排放(金属回收减碳)是否纳入PCF：纳入/不纳入 —— 以采用PCR的最新条文规定为准',
    '叶片回收/处置方式占比：填埋(__%) / 焚烧(__%) / 机械回收(__%) / 热解(__%) / 其他(__%)',
    '永磁体稀土回收率假设：当前<5%(行业实际) / 未来目标>30%(前瞻性声明需标注)',
]

for i, item in enumerate(method_items):
    row = method_row + 1 + i
    ws7.cell(row, 1, f'{i+1}. {item}').font = NOTE_FONT
    ws7.merge_cells(start_row=row, start_column=1, end_row=row, end_column=8)

apply_border(ws7, 2, 14, 1, 8)
ws7.column_dimensions['H'].width = 20

# ═══════════════════════════════════════
# Sheet 8: DQR — 缺口1
# ═══════════════════════════════════════
ws8 = wb['8.数据质量评估DQR']
unmerge_all(ws8)

# 当前表头(Row 2): 序号/数据项/数据类型/技术代表性/时间代表性/地理代表性/完整性/综合DQR/说明
# 缺少"可靠性"维度! 应在"数据类型"后、"技术代表性"前插入

# 由于openpyxl不能插入列，我们重建表头区域
# 当前列映射: A=序号, B=数据项, C=数据类型, D=技术, E=时间, F=地理, G=完整性, H=综合DQR, I=说明
# 目标: A=序号, B=数据项, C=数据类型, D=可靠性, E=技术, F=时间, G=地理, H=完整性, I=综合DQR, J=说明

# 先把现有D~I列数据右移一列(在D列插入可靠性)
for row in range(3, 14):
    # 读取 D~I 的值
    vals = []
    for col in range(4, 10):  # D(4) to I(9)
        cell = ws8.cell(row, col)
        vals.append(cell.value)

    # 写入 E~J (右移1列)
    for j, v in enumerate(vals):
        ws8.cell(row, 5 + j, v)

    # D列留空(可靠性评分待填)
    ws8.cell(row, 4, '')

# 更新表头
ws8.cell(2, 4, '可靠性评分')
ws8.cell(2, 4).font = HEADER_FONT
ws8.cell(2, 4).fill = HEADER_FILL
ws8.cell(2, 4).alignment = Alignment(horizontal='center', wrap_text=True)

# 重新设置E~J表头(因为右移了)
new_headers = ['技术代表性评分', '时间代表性评分', '地理代表性评分', '完整性评分', '综合DQR', '说明']
for i, h in enumerate(new_headers):
    ws8.cell(2, 5 + i, h)
    ws8.cell(2, 5 + i).font = HEADER_FONT
    ws8.cell(2, 5 + i).fill = HEADER_FILL
    ws8.cell(2, 5 + i).alignment = Alignment(horizontal='center', wrap_text=True)

# 更新说明行(Row 14)
ws8.cell(14, 1, '说明：DQR采用Pedigree Matrix五维度评分(1优-5差)：可靠性、完整性、时间相关性、地理相关性、技术相关性。排放因子轨(D-F)与活动数据轨(D-A)须分别评分、分别校验，双轨均须≤限值(默认3.0)方可出具报告。综合DQR公式类型(等权重/加权)及各维度权重由PCR/标准规定。').font = NOTE_FONT
ws8.merge_cells(start_row=14, start_column=1, end_row=14, end_column=10)

# 预填几行示例数据项(引导填写)
dqr_examples = [
    ('1', '钢材用量(塔架/底盘等)', '初级(实测/采购单)', '1~2', '', '', '', '', '', '实测数据可靠性1分，采购单2分'),
    ('2', 'NdFeB永磁体用量', '初级/次级', '3~5', '', '', '', '', '', '稀土数据多为次级(数据库)，可靠性偏低'),
    ('3', '电力消耗(各工序)', '初级(电表)', '1', '', '', '', '', '', '校准仪表连续实测=1分最优'),
    ('4', '运输距离/方式', '初级(物流单据)', '1~2', '', '', '', '', '', '物流系统数据可靠'),
    ('5', '区域电网排放因子', '次级(国家发布)', '2~3', '', '', '', '', '', '政府发布因子，技术代表性取决于电网覆盖范围'),
]

for i, (seq, item, dtype, reliability, tech, temporal, geo, completeness, dqr, note) in enumerate(dqr_examples):
    row = 3 + i
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

apply_border(ws8, 2, 13, 1, 10)
ws8.column_dimensions['D'].width = 15

# ═══════════════════════════════════════
# Sheet 1: 基本信息与边界 — 缺口4(海上专项)
# ═══════════════════════════════════════
ws1 = wb['1.基本信息与边界']
unmerge_all(ws1)

# 在系统边界区域(Row 19-27)后增加海上风电专项区域
offshore_row = 28
ws1.cell(offshore_row, 1, '海上风电专项（仅海上机型需填写，陆上机型跳过）').font = SECTION_FONT
ws1.merge_cells(start_row=offshore_row, start_column=1, end_row=offshore_row, end_column=5)

offshore_fields = [
    ('海上基础类型', '', '钢管桩/导管架/重力式/漂浮式', '海上基础钢材用量是陆上的5~10倍'),
    ('海缆规格与长度', '', '35kV集电海缆+220kV送出海缆', '含铜+铅+XLPE绝缘，每km数吨，须单独列项'),
    ('阴极保护方式', '', '牺牲阳极(铝/锌合金)/外加电流', '防腐系统在Sheet2 BOM中也须对应列项'),
    ('海上施工船型与台班', '', '打桩船/吊装船/海缆铺设船', '燃油消耗数据在Sheet5填写'),
    ('海上运维船型', '', '运维船/直升机', '在Sheet6使用阶段填写'),
    ('海上退役处置差异', '', '基础是否拆除/海缆是否回收', '与陆上退役方案不同，在Sheet7标注'),
]

for i, (field, val, hint, note) in enumerate(offshore_fields):
    row = offshore_row + 1 + i
    ws1.cell(row, 1, field).font = NORMAL_FONT
    ws1.cell(row, 2, val).font = NORMAL_FONT  # 填写值留空
    ws1.cell(row, 3, hint).font = NOTE_FONT
    ws1.cell(row, 4, note).font = NOTE_FONT
    ws1.merge_cells(start_row=row, start_column=4, end_row=row, end_column=5)

# SF6声明区(无论陆上海上都需要)
sf6_row = offshore_row + 7
ws1.cell(sf6_row, 1, 'SF₆开关设备声明（含SF₆开关柜/箱变的机型须填写）').font = SECTION_FONT
ws1.merge_cells(start_row=sf6_row, start_column=1, end_row=sf6_row, end_column=5)

sf6_fields = [
    ('SF₆充注总量(kg)', '', '所有开关柜/箱变SF₆充注量合计', '🔴 SF₆ GWP=23,500(AR6)，是CO₂的23500倍'),
    ('年泄漏率(%)', '', '0.5%~2%(IEC标准)', '泄漏量=充注量×泄漏率'),
]

for i, (field, val, hint, note) in enumerate(sf6_fields):
    row = sf6_row + 1 + i
    ws1.cell(row, 1, field).font = NORMAL_FONT
    ws1.cell(row, 2, val).font = NORMAL_FONT
    ws1.cell(row, 3, hint).font = NOTE_FONT
    ws1.cell(row, 4, note).font = RED_FONT
    ws1.merge_cells(start_row=row, start_column=4, end_row=row, end_column=5)

apply_border(ws1, 2, sf6_row + 2, 1, 5)

# ═══════════════════════════════════════
# 使用说明 — 缺口12(数据校验自查指引)
# ═══════════════════════════════════════
ws_note = wb['使用说明']
unmerge_all(ws_note)

# 在Row 29(填写建议最后一行)后增加数据校验自查指引
check_row = 30
ws_note.cell(check_row, 1, '五、填写后数据校验自查指引（对应核算阶段6数据校验）').font = SECTION_FONT

check_items = [
    ('完整性自查', '①每个单元过程的输入/输出流是否都有数值？②每个能耗类工序是否至少有一种能耗数据填报？③末端阶段(如回收/报废)输出流是否完整？④核心BOM物料(钢材、铜、稀土、树脂等)是否都有用量数据？⑤SF₆充注量是否已填写(如含SF₆设备)？'),
    ('一致性自查', '①BOM总质量是否与整机设计重量吻合(偏差<5%)？②单位是否统一(kg/t/MW/kWh等不可混用)？③气体体积数据是否标注参考状态(Nm³/Sm³)？④上下游物料传递量是否一致(考虑传递损耗<5%)？'),
    ('趋势自查', '①核心物料用量与同型号历史均值偏差是否<5%(如>10%须澄清)？②主要能耗与去年同期偏差是否<30%？③排放因子年份距当前是否<5年？'),
    ('DQR自查', '①每项数据是否标注来源类型(初级实测/次级数据库)？②五维度评分(可靠性+完整性+时间+地理+技术)是否齐全？③排放因子轨与活动数据轨是否分别评分？④综合DQR是否≤3.0(或PCR规定限值)？'),
]

for i, (title, content) in enumerate(check_items):
    row = check_row + 1 + i
    ws_note.cell(row, 1, f'{title}').font = Font(name='Arial', bold=True, size=10)
    ws_note.cell(row, 2, content).font = NOTE_FONT

# ═══════════════════════════════════════
# 保存文件
# ═══════════════════════════════════════
output_path = 'e:/AI/碳亦管碳足迹智能体/CFP/风机产品碳足迹收资清单.xlsx'
wb.save(output_path)
print(f'收资清单已完善保存: {output_path}')
