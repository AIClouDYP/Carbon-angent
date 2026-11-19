/**
 * 分时分区电碳因子 —— 区域字典与归一化工具
 *
 * 支持层级：
 *   province 省级（34 个省级行政区）
 *   city     市级（按需扩展，内置常用城市）
 *   grid     区域电网（7 个，用于省级因子缺失时的回退）
 *   national 全国
 *
 * 归一化优先级：精确名 > 去后缀 > 别名 > 拼音首字母 > 失败
 */

// ============ 省级行政区（含代码、所属区域电网、别名） ============
export const PROVINCES = [
  { code: '11', name: '北京', grid: '华北', aliases: ['北京市', '京', 'beijing'] },
  { code: '12', name: '天津', grid: '华北', aliases: ['天津市', '津', 'tianjin'] },
  { code: '13', name: '河北', grid: '华北', aliases: ['河北省', '冀', 'hebei'] },
  { code: '14', name: '山西', grid: '华北', aliases: ['山西省', '晋', 'shanxi'] },
  { code: '15', name: '内蒙古', grid: '华北', aliases: ['内蒙古自治区', '内蒙', '蒙', 'neimenggu', 'innermongolia'] },
  { code: '21', name: '辽宁', grid: '东北', aliases: ['辽宁省', '辽', 'liaoning'] },
  { code: '22', name: '吉林', grid: '东北', aliases: ['吉林省', '吉', 'jilin'] },
  { code: '23', name: '黑龙江', grid: '东北', aliases: ['黑龙江省', '黑', 'heilongjiang'] },
  { code: '31', name: '上海', grid: '华东', aliases: ['上海市', '沪', 'shanghai'] },
  { code: '32', name: '江苏', grid: '华东', aliases: ['江苏省', '苏', 'jiangsu'] },
  { code: '33', name: '浙江', grid: '华东', aliases: ['浙江省', '浙', 'zhejiang'] },
  { code: '34', name: '安徽', grid: '华东', aliases: ['安徽省', '皖', 'anhui'] },
  { code: '35', name: '福建', grid: '华东', aliases: ['福建省', '闽', 'fujian'] },
  { code: '36', name: '江西', grid: '华中', aliases: ['江西省', '赣', 'jiangxi'] },
  { code: '37', name: '山东', grid: '华北', aliases: ['山东省', '鲁', 'shandong'] },
  { code: '41', name: '河南', grid: '华中', aliases: ['河南省', '豫', 'henan'] },
  { code: '42', name: '湖北', grid: '华中', aliases: ['湖北省', '鄂', 'hubei'] },
  { code: '43', name: '湖南', grid: '华中', aliases: ['湖南省', '湘', 'hunan'] },
  { code: '44', name: '广东', grid: '南方', aliases: ['广东省', '粤', 'guangdong'] },
  { code: '45', name: '广西', grid: '南方', aliases: ['广西壮族自治区', '桂', 'guangxi'] },
  { code: '46', name: '海南', grid: '南方', aliases: ['海南省', '琼', 'hainan'] },
  { code: '50', name: '重庆', grid: '华中', aliases: ['重庆市', '渝', 'chongqing'] },
  { code: '51', name: '四川', grid: '西南', aliases: ['四川省', '川', '蜀', 'sichuan'] },
  { code: '52', name: '贵州', grid: '南方', aliases: ['贵州省', '黔', '贵', 'guizhou'] },
  { code: '53', name: '云南', grid: '南方', aliases: ['云南省', '滇', '云', 'yunnan'] },
  { code: '54', name: '西藏', grid: '西南', aliases: ['西藏自治区', '藏', 'xizang', 'tibet'] },
  { code: '61', name: '陕西', grid: '西北', aliases: ['陕西省', '陕', '秦', 'shaanxi'] },
  { code: '62', name: '甘肃', grid: '西北', aliases: ['甘肃省', '甘', '陇', 'gansu'] },
  { code: '63', name: '青海', grid: '西北', aliases: ['青海省', '青', 'qinghai'] },
  { code: '64', name: '宁夏', grid: '西北', aliases: ['宁夏回族自治区', '宁', 'ningxia'] },
  { code: '65', name: '新疆', grid: '西北', aliases: ['新疆维吾尔自治区', '新', 'xinjiang'] },
  { code: '71', name: '台湾', grid: '华东', aliases: ['台湾省', '台', 'taiwan'] },
  { code: '81', name: '香港', grid: '南方', aliases: ['香港特别行政区', '港', 'hongkong'] },
  { code: '82', name: '澳门', grid: '南方', aliases: ['澳门特别行政区', '澳', 'macau', 'macao'] }
]

// ============ 区域电网（省级因子缺失时的回退层级） ============
export const GRID_REGIONS = [
  { code: 'grid-north', name: '华北', aliases: ['华北区域', '华北电网', '华北区域电网'] },
  { code: 'grid-north-east', name: '东北', aliases: ['东北区域', '东北电网', '东北区域电网'] },
  { code: 'grid-east', name: '华东', aliases: ['华东区域', '华东电网', '华东区域电网', '长三角'] },
  { code: 'grid-central', name: '华中', aliases: ['华中区域', '华中电网', '华中区域电网'] },
  { code: 'grid-north-west', name: '西北', aliases: ['西北区域', '西北电网', '西北区域电网'] },
  { code: 'grid-south', name: '南方', aliases: ['南方区域', '南方电网', '南方区域电网'] },
  { code: 'grid-south-west', name: '西南', aliases: ['西南区域', '西南电网', '西南区域电网'] }
]

// ============ 常用市级（可扩充；推广时由后端字典下发） ============
export const CITIES = [
  // 江苏
  { code: '3201', name: '南京', province: '江苏', aliases: ['南京市'] },
  { code: '3202', name: '无锡', province: '江苏', aliases: ['无锡市'] },
  { code: '3203', name: '徐州', province: '江苏', aliases: ['徐州市'] },
  { code: '3204', name: '常州', province: '江苏', aliases: ['常州市'] },
  { code: '3205', name: '苏州', province: '江苏', aliases: ['苏州市'] },
  { code: '3206', name: '南通', province: '江苏', aliases: ['南通市'] },
  // 浙江
  { code: '3301', name: '杭州', province: '浙江', aliases: ['杭州市'] },
  { code: '3302', name: '宁波', province: '浙江', aliases: ['宁波市'] },
  { code: '3303', name: '温州', province: '浙江', aliases: ['温州市'] },
  { code: '3304', name: '嘉兴', province: '浙江', aliases: ['嘉兴市'] },
  { code: '3305', name: '湖州', province: '浙江', aliases: ['湖州市'] },
  { code: '3306', name: '绍兴', province: '浙江', aliases: ['绍兴市'] },
  // 广东
  { code: '4401', name: '广州', province: '广东', aliases: ['广州市'] },
  { code: '4403', name: '深圳', province: '广东', aliases: ['深圳市'] },
  { code: '4404', name: '珠海', province: '广东', aliases: ['珠海市'] },
  { code: '4406', name: '佛山', province: '广东', aliases: ['佛山市'] },
  { code: '4419', name: '东莞', province: '广东', aliases: ['东莞市'] },
  { code: '4420', name: '中山', province: '广东', aliases: ['中山市'] },
  // 山东
  { code: '3701', name: '济南', province: '山东', aliases: ['济南市'] },
  { code: '3702', name: '青岛', province: '山东', aliases: ['青岛市'] },
  { code: '3703', name: '淄博', province: '山东', aliases: ['淄博市'] },
  // 四川
  { code: '5101', name: '成都', province: '四川', aliases: ['成都市'] },
  { code: '5104', name: '攀枝花', province: '四川', aliases: ['攀枝花市'] },
  // 湖北
  { code: '4201', name: '武汉', province: '湖北', aliases: ['武汉市'] },
  { code: '4205', name: '宜昌', province: '湖北', aliases: ['宜昌市'] },
  // 福建
  { code: '3502', name: '厦门', province: '福建', aliases: ['厦门市'] },
  { code: '3501', name: '福州', province: '福建', aliases: ['福州市'] },
  // 直辖市（本身即省级，其下区县可映射到省）
  { code: '1101', name: '北京市区', province: '北京', aliases: ['北京城区'] }
]

// ============ 构建索引 ============
const PROV_MAP = new Map()
const CITY_MAP = new Map()
const GRID_MAP = new Map()

PROVINCES.forEach(p => {
  PROV_MAP.set(p.name, p)
  PROV_MAP.set(p.code, p)
  p.aliases.forEach(a => PROV_MAP.set(a.toLowerCase(), p))
})
CITIES.forEach(c => {
  CITY_MAP.set(c.name, c)
  CITY_MAP.set(c.code, c)
  c.aliases.forEach(a => CITY_MAP.set(a.toLowerCase(), c))
})
GRID_REGIONS.forEach(g => {
  GRID_MAP.set(g.name, g)
  GRID_MAP.set(g.code, g)
  g.aliases.forEach(a => GRID_MAP.set(a.toLowerCase(), g))
})

/** 去除常见行政区后缀 */
function stripSuffix(name) {
  return name.replace(/(特别行政区|维吾尔自治区|壮族自治区|回族自治区|自治区|省|市|地区|盟)$/, '')
}

/**
 * 归一化区域名 → { code, name, level, parentCode, grid }
 * @param {string} input 原始输入（如「北京」「北京市」「Beijing」「南京市」）
 * @returns {object|null} 归一化结果，无法识别时返回 null
 */
export function normalizeRegion(input) {
  if (!input) return null
  const raw = String(input).trim()
  if (!raw) return null

  // 1. 全国
  if (['全国', '中国', 'china', 'cn', 'national'].includes(raw.toLowerCase())) {
    return { code: 'CN', name: '全国', level: 'national', parentCode: null, grid: null }
  }

  // 2. 精确匹配（省级）
  if (PROV_MAP.has(raw)) {
    const p = PROV_MAP.get(raw)
    return { code: p.code, name: p.name, level: 'province', parentCode: null, grid: p.grid }
  }
  // 3. 精确匹配（市级）
  if (CITY_MAP.has(raw)) {
    const c = CITY_MAP.get(raw)
    const prov = PROVINCES.find(p => p.name === c.province)
    return { code: c.code, name: c.name, level: 'city', parentCode: prov ? prov.code : null, grid: prov ? prov.grid : null }
  }
  // 4. 精确匹配（区域电网）
  if (GRID_MAP.has(raw)) {
    const g = GRID_MAP.get(raw)
    return { code: g.code, name: g.name, level: 'grid', parentCode: null, grid: g.name }
  }

  // 5. 转小写别名匹配
  const lower = raw.toLowerCase()
  if (PROV_MAP.has(lower)) {
    const p = PROV_MAP.get(lower)
    return { code: p.code, name: p.name, level: 'province', parentCode: null, grid: p.grid }
  }
  if (CITY_MAP.has(lower)) {
    const c = CITY_MAP.get(lower)
    const prov = PROVINCES.find(p => p.name === c.province)
    return { code: c.code, name: c.name, level: 'city', parentCode: prov ? prov.code : null, grid: prov ? prov.grid : null }
  }

  // 6. 去后缀后再匹配
  const stripped = stripSuffix(raw)
  if (stripped !== raw) {
    if (PROV_MAP.has(stripped)) {
      const p = PROV_MAP.get(stripped)
      return { code: p.code, name: p.name, level: 'province', parentCode: null, grid: p.grid }
    }
    if (CITY_MAP.has(stripped)) {
      const c = CITY_MAP.get(stripped)
      const prov = PROVINCES.find(p => p.name === c.province)
      return { code: c.code, name: c.name, level: 'city', parentCode: prov ? prov.code : null, grid: prov ? prov.grid : null }
    }
  }

  // 7. 模糊包含匹配（如「江苏省南京市」→ 南京）
  for (const c of CITIES) {
    if (raw.includes(c.name)) {
      const prov = PROVINCES.find(p => p.name === c.province)
      return { code: c.code, name: c.name, level: 'city', parentCode: prov ? prov.code : null, grid: prov ? prov.grid : null }
    }
  }
  for (const p of PROVINCES) {
    if (raw.includes(p.name)) {
      return { code: p.code, name: p.name, level: 'province', parentCode: null, grid: p.grid }
    }
  }

  return null
}

/**
 * 解析日期（兼容 YYYYMMDD / YYYY-MM-DD / YYYY/MM/DD）
 * @returns {string|null} 归一为 YYYY-MM-DD
 */
export function normalizeDate(input) {
  if (!input) return null
  const s = String(input).trim().replace(/[\/\.]/g, '-')
  // YYYYMMDD
  let m = s.match(/^(\d{4})(\d{2})(\d{2})$/)
  if (m) {
    const [, y, mo, d] = m
    if (+mo >= 1 && +mo <= 12 && +d >= 1 && +d <= 31) return `${y}-${mo}-${d}`
  }
  // YYYY-M-D 或 YYYY-MM-DD
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (m) {
    const [, y, mo, d] = m
    return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return null
}

/**
 * 解析小时（兼容 1~24 与 0~23）
 * @returns {number|null} 归一为 0~23
 */
export function normalizeHour(input) {
  if (input === null || input === undefined || input === '') return null
  const n = Number(String(input).trim())
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null
  if (n >= 1 && n <= 24) return n === 24 ? 23 : n - 1  // 1~24 → 0~23
  if (n >= 0 && n <= 23) return n                       // 已是 0~23
  return null
}

/** 小时显示（0~23 → 00:00~23:00 时段标签） */
export function hourLabel(h) {
  const start = String(h).padStart(2, '0')
  const end = String((h + 1) % 24).padStart(2, '0')
  return `${start}:00-${end}:00`
}

/** 获取区域的展示信息 */
export function regionMeta(code) {
  const p = PROVINCES.find(x => x.code === code)
  if (p) return { name: p.name, level: 'province', grid: p.grid }
  const c = CITIES.find(x => x.code === code)
  if (c) return { name: c.name, level: 'city', province: c.province }
  const g = GRID_REGIONS.find(x => x.code === code)
  if (g) return { name: g.name, level: 'grid' }
  if (code === 'CN') return { name: '全国', level: 'national' }
  return { name: code, level: 'unknown' }
}

/** 层级标签 */
export const LEVEL_LABELS = {
  national: '全国',
  grid: '区域电网',
  province: '省级',
  city: '市级'
}

/** 层级回退优先级（数值越小优先级越高） */
export const LEVEL_PRIORITY = {
  city: 1,
  province: 2,
  grid: 3,
  national: 4
}
