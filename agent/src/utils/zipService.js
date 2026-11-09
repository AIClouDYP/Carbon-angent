/**
 * 打包服务（报送材料包）：零依赖 ZIP 写入器（store 模式，不压缩）。
 *
 * 设计取舍：不引入 jszip（约 100KB）——报送包内容以报告数据表、材料清单与索引件为主，
 *          压缩收益有限；store 模式（compression method = 0）的 ZIP 结构简单，
 *          纯前端约 120 行即可产出被 Windows / macOS / 7-Zip 正常解压的标准 .zip，
 *          与 exportService「零新增依赖」的既定取舍一致。
 * 生产环境应改为服务端打包（含真实佐证材料原件与其哈希校验）。
 *
 * ZIP 结构：本地文件头 → 文件数据 →（逐文件重复）→ 中央目录 → 中央目录结束记录（EOCD）。
 * 文件名统一置 UTF-8 标志位（0x0800），避免中文名乱码。
 */

/** CRC32 查表（ZIP 校验字段必需，惰性构建） */
let CRC_TABLE = null
function crcTable() {
  if (CRC_TABLE) return CRC_TABLE
  const t = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
    t[n] = c >>> 0
  }
  CRC_TABLE = t
  return t
}

/** 计算字节数组 CRC32 */
export function crc32(bytes) {
  const t = crcTable()
  let c = 0xFFFFFFFF
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8)
  return (c ^ 0xFFFFFFFF) >>> 0
}

/** DOS 时间/日期编码（ZIP 头使用 1980 纪元的 16 位字段） */
function dosDateTime(d) {
  const time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((Math.floor(d.getSeconds() / 2)) & 0x1F)
  const date = (((d.getFullYear() - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F)
  return { time, date }
}

function utf8(str) {
  return new TextEncoder().encode(String(str === null || str === undefined ? '' : str))
}

/**
 * 组装 ZIP Blob。
 * @param {Array<{path: string, content: string}>} files 路径（可含 / 目录）+ 文本内容
 * @returns {Blob} application/zip
 */
export function buildZipBlob(files) {
  const list = files || []
  const now = new Date()
  const { time, date } = dosDateTime(now)
  const chunks = []
  const central = []
  let offset = 0

  list.forEach(f => {
    const nameBytes = utf8(f.path)
    const dataBytes = utf8(f.content)
    const crc = crc32(dataBytes)

    // 本地文件头（30 字节）+ 文件名 + 数据
    const local = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(local.buffer)
    lv.setUint32(0, 0x04034B50, true)   // 签名
    lv.setUint16(4, 20, true)           // 解压所需版本
    lv.setUint16(6, 0x0800, true)       // 通用标志位：文件名 UTF-8
    lv.setUint16(8, 0, true)            // 压缩方法：0 = store
    lv.setUint16(10, time, true)
    lv.setUint16(12, date, true)
    lv.setUint32(14, crc, true)
    lv.setUint32(18, dataBytes.length, true) // 压缩后大小 = 原大小
    lv.setUint32(22, dataBytes.length, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)           // 扩展字段长度
    local.set(nameBytes, 30)
    chunks.push(local, dataBytes)

    // 中央目录项（46 字节）+ 文件名
    const cd = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(cd.buffer)
    cv.setUint32(0, 0x02014B50, true)
    cv.setUint16(4, 20, true)           // 创建版本
    cv.setUint16(6, 20, true)           // 解压所需版本
    cv.setUint16(8, 0x0800, true)
    cv.setUint16(10, 0, true)
    cv.setUint16(12, time, true)
    cv.setUint16(14, date, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, dataBytes.length, true)
    cv.setUint32(24, dataBytes.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)           // 扩展字段
    cv.setUint16(32, 0, true)           // 注释
    cv.setUint16(34, 0, true)           // 起始磁盘
    cv.setUint16(36, 0, true)           // 内部属性
    cv.setUint32(38, 0, true)           // 外部属性
    cv.setUint32(42, offset, true)      // 本地文件头偏移
    cd.set(nameBytes, 46)
    central.push(cd)

    offset += local.length + dataBytes.length
  })

  const cdSize = central.reduce((s, c) => s + c.length, 0)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054B50, true)
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, list.length, true)
  ev.setUint16(10, list.length, true)
  ev.setUint32(12, cdSize, true)
  ev.setUint32(16, offset, true)
  ev.setUint16(20, 0, true)             // 注释长度

  return new Blob(chunks.concat(central, [eocd]), { type: 'application/zip' })
}

/** 触发浏览器下载 .zip（与 exportService 同一下载出口） */
export function downloadZip(files, filename) {
  const blob = buildZipBlob(files)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { filename, size: blob.size, fileCount: (files || []).length }
}
