/** 时辰选项：0 早子 … 12 晚子 */
export const TIME_OPTIONS: { index: number; label: string; range: string }[] = [
  { index: 0, label: '早子', range: '00:00–00:59' },
  { index: 1, label: '丑时', range: '01:00–02:59' },
  { index: 2, label: '寅时', range: '03:00–04:59' },
  { index: 3, label: '卯时', range: '05:00–06:59' },
  { index: 4, label: '辰时', range: '07:00–08:59' },
  { index: 5, label: '巳时', range: '09:00–10:59' },
  { index: 6, label: '午时', range: '11:00–12:59' },
  { index: 7, label: '未时', range: '13:00–14:59' },
  { index: 8, label: '申时', range: '15:00–16:59' },
  { index: 9, label: '酉时', range: '17:00–18:59' },
  { index: 10, label: '戌时', range: '19:00–20:59' },
  { index: 11, label: '亥时', range: '21:00–22:59' },
  { index: 12, label: '晚子', range: '23:00–23:59' },
]

/** 十二宫地支 → 盘面 4x4 格子坐标（经典排版） */
export const BRANCH_GRID: Record<string, { row: number; col: number }> = {
  巳: { row: 0, col: 0 },
  午: { row: 0, col: 1 },
  未: { row: 0, col: 2 },
  申: { row: 0, col: 3 },
  辰: { row: 1, col: 0 },
  酉: { row: 1, col: 3 },
  卯: { row: 2, col: 0 },
  戌: { row: 2, col: 3 },
  寅: { row: 3, col: 0 },
  丑: { row: 3, col: 1 },
  子: { row: 3, col: 2 },
  亥: { row: 3, col: 3 },
}

export function normalizeBranch(branch: string): string {
  // iztro 可能输出「寅」或带后缀
  const m = branch.match(/[子丑寅卯辰巳午未申酉戌亥]/)
  return m ? m[0] : branch
}
