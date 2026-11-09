/**
 * 模板章节 rows 行值解析（消费方共用：章节预览组件 / 整篇预览 / 导出服务 / 内容指纹）
 *
 * rows 行的三种形态（向后兼容）：
 *  1. '行名'                            —— 字符串：首列填行名，其余列留空
 *  2. ['v0', 'v1', ...]                 —— 数组：按列位置取值（规则引擎生成内容即此形态）
 *  3. { name, cells: { 列名: 值 }, vals: [按位置] } —— 对象：模板预置行（计量单位 / 代码 / 参考折标系数等）
 *     优先级：首列取 name → vals[ci-1]（按位置）→ cells[列名]（按列名）
 */

/** 取行在指定列的值 */
export function sectionRowValue(row, colName, colIndex) {
  if (row === null || row === undefined) return ''
  if (Array.isArray(row)) return row[colIndex] === undefined ? '' : row[colIndex]
  if (typeof row === 'string') return colIndex === 0 ? row : ''
  if (colIndex === 0) return row.name || ''
  if (row.vals && row.vals[colIndex - 1] !== undefined) return row.vals[colIndex - 1]
  return (row.cells && row.cells[colName]) || ''
}

/** 取整行的按列值数组（导出 / 序列化用） */
export function sectionRowArray(row, columns) {
  return (columns || []).map((c, i) => sectionRowValue(row, c, i))
}
