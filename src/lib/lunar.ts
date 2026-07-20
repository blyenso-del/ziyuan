import { astro } from 'iztro'

export type LunarParts = {
  year: number
  month: number
  day: number
  isLeap: boolean
}

/** 公历 → 农历（经 iztro，避免直接引 CJS 的 lunar-lite） */
export function solarToLunar(solarDate: string): LunarParts {
  const normalized = solarDate.replace(/\//g, '-')
  // 时辰无关，取 0 即可
  const a = astro.bySolar(normalized, 0, '男', true, 'zh-CN')
  const L = a.rawDates.lunarDate
  return {
    year: L.lunarYear,
    month: L.lunarMonth,
    day: L.lunarDay,
    isLeap: !!L.isLeap,
  }
}

/** 农历 → 公历 YYYY-M-D */
export function lunarToSolar(parts: LunarParts): string {
  const str = `${parts.year}-${parts.month}-${parts.day}`
  const a = astro.byLunar(str, 0, '男', parts.isLeap, true, 'zh-CN')
  // iztro 返回可能是 1990-1-1
  return a.solarDate
}

export function formatLunar(parts: LunarParts): string {
  return `${parts.year}年${parts.isLeap ? '闰' : ''}${parts.month}月${parts.day}日`
}

export const LUNAR_YEAR_MIN = 1900
export const LUNAR_YEAR_MAX = 2100

export const LUNAR_MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
export const LUNAR_DAYS = Array.from({ length: 30 }, (_, i) => i + 1)
