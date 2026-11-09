/**
 * 签发引擎（清单 #15「口径规则 + 签发 + 导出引擎框架」之签发部分）
 *
 * 前端实现范围：**内容指纹（哈希）计算与完整性校验**。
 * 说明：真实数字签名需服务端私钥（非对称加密：私钥签名 + 公钥验签），前端无法安全持有私钥；
 *       但**内容指纹的防篡改语义与签名一致**——内容任一字符变化，指纹即变，可检出篡改。
 *       生产环境应替换为服务端签名（见方案文档 §8.3）。
 */
import { sectionRowArray } from './sectionRows'

/** FNV-1a 32 位哈希：无依赖、速度快、雪崩性足以支撑完整性校验 */
function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0
  }
  return h >>> 0
}

/** 生成内容指纹：双通道（内容 + 加盐内容）拼接为 16 位十六进制，形如 A1B2-C3D4-E5F6-7890 */
export function contentFingerprint(text) {
  const s = String(text || '')
  const a = fnv1a(s).toString(16).padStart(8, '0')
  const b = fnv1a(s + '#zcip-salt').toString(16).padStart(8, '0')
  return (a + b).toUpperCase().replace(/(.{4})(?=.)/g, '$1-')
}

/**
 * 序列化待签名内容：标题 + 章节（名 / 叙述 / 数据行 / 说明）+ 附随佐证材料，顺序稳定。
 * 稳定性要求：同一份报告多次序列化结果必须一致，否则指纹比对无意义。
 *
 * 覆盖范围含佐证材料：佐证材料与报告同属一个「报送材料包」，若不计入指纹，
 * 归档后替换材料不会被检出——防篡改只防一半（材料侧失效）。
 * 同理，材料状态变更（缺项补录）会使指纹失效，须重新校验或补充留痕。
 */
export function serializeForSign(payload) {
  const p = payload || {}
  const parts = [String(p.title || '')]
  ;(p.sections || []).forEach(sec => {
    parts.push(String(sec.name || ''))
    if (sec.narrative) parts.push(String(sec.narrative))
    if (sec.columns && sec.columns.length) parts.push(sec.columns.join('|'))
    ;(sec.rows || []).forEach(r => parts.push(sectionRowArray(r, sec.columns || []).join('|')))
    if (sec.note) parts.push(String(sec.note))
  })
  const mats = p.materials || []
  if (mats.length) {
    parts.push('--佐证材料--')
    mats.forEach(m => {
      parts.push([
        String(m.group || ''),
        String(m.name || ''),
        String(m.type || ''),
        String(m.source || ''),
        String(m.status || ''),
        String(m.hash || '')
      ].join('|'))
    })
  }
  return parts.join('\n')
}

/** 签发：生成签名记录（内容指纹 + 时间 + 审核链摘要） */
export function signReport(payload, meta = {}) {
  const content = serializeForSign(payload)
  return {
    fingerprint: contentFingerprint(content),
    contentLength: content.length,
    signedAt: new Date().toLocaleString('zh-CN'),
    signer: meta.signer || '系统签发',
    // 审核链摘要：三级审核通过人与时间，随签发记录一并归档
    audits: meta.audits || [],
    algorithm: 'FNV-1a（双通道）· 前端内容指纹',
    note: '生产环境应使用服务端非对称签名（私钥签名 + 公钥验签）'
  }
}

/** 校验完整性：重算指纹并与签发记录比对，检出签发后的任何改动 */
export function verifyReport(payload, signed) {
  if (!signed || !signed.fingerprint) {
    return { ok: false, reason: '尚无签发记录', current: '', signed: '' }
  }
  const cur = contentFingerprint(serializeForSign(payload))
  const ok = cur === signed.fingerprint
  return {
    ok,
    current: cur,
    signed: signed.fingerprint,
    reason: ok ? '内容与签发时一致，未检出篡改' : '内容与签发时不一致，疑似被篡改'
  }
}
