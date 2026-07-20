/**
 * 真太阳时：经度均时差 + 均时差（Equation of Time）
 * 中国默认以东八区中央经线 120°E 为标准。
 */

export type CityLon = { name: string; lon: number; lat?: number }

/** 常用城市经度（东经） */
export const CITY_LONGITUDES: CityLon[] = [
  { name: '北京', lon: 116.41, lat: 39.9 },
  { name: '上海', lon: 121.47, lat: 31.23 },
  { name: '广州', lon: 113.26, lat: 23.13 },
  { name: '深圳', lon: 114.06, lat: 22.55 },
  { name: '成都', lon: 104.07, lat: 30.67 },
  { name: '重庆', lon: 106.55, lat: 29.56 },
  { name: '武汉', lon: 114.31, lat: 30.59 },
  { name: '西安', lon: 108.94, lat: 34.34 },
  { name: '杭州', lon: 120.16, lat: 30.25 },
  { name: '南京', lon: 118.8, lat: 32.06 },
  { name: '天津', lon: 117.2, lat: 39.08 },
  { name: '苏州', lon: 120.62, lat: 31.3 },
  { name: '郑州', lon: 113.63, lat: 34.75 },
  { name: '长沙', lon: 112.94, lat: 28.23 },
  { name: '沈阳', lon: 123.43, lat: 41.8 },
  { name: '哈尔滨', lon: 126.54, lat: 45.8 },
  { name: '长春', lon: 125.32, lat: 43.89 },
  { name: '大连', lon: 121.62, lat: 38.91 },
  { name: '青岛', lon: 120.38, lat: 36.07 },
  { name: '济南', lon: 117.12, lat: 36.65 },
  { name: '厦门', lon: 118.09, lat: 24.48 },
  { name: '福州', lon: 119.3, lat: 26.08 },
  { name: '昆明', lon: 102.71, lat: 25.04 },
  { name: '贵阳', lon: 106.63, lat: 26.65 },
  { name: '南宁', lon: 108.37, lat: 22.82 },
  { name: '海口', lon: 110.35, lat: 20.02 },
  { name: '拉萨', lon: 91.11, lat: 29.65 },
  { name: '乌鲁木齐', lon: 87.62, lat: 43.83 },
  { name: '兰州', lon: 103.83, lat: 36.06 },
  { name: '银川', lon: 106.23, lat: 38.49 },
  { name: '西宁', lon: 101.78, lat: 36.62 },
  { name: '呼和浩特', lon: 111.75, lat: 40.84 },
  { name: '台北', lon: 121.56, lat: 25.03 },
  { name: '香港', lon: 114.17, lat: 22.32 },
  { name: '澳门', lon: 113.54, lat: 22.19 },
  { name: '东经120°（不校正）', lon: 120 },
]

/** 均时差（分钟），简化傅里叶近似 */
export function equationOfTimeMinutes(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 0)
  const day = Math.floor((date.getTime() - start) / 86400000)
  const B = ((2 * Math.PI) / 365) * (day - 81)
  return 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)
}

/** 经度均时差：相对东八区 120°E，每度 4 分钟 */
export function longitudeCorrectionMinutes(longitudeEast: number, standardMeridian = 120): number {
  return (longitudeEast - standardMeridian) * 4
}

export type TrueSolarResult = {
  /** 校正后的公历日期 YYYY-M-D */
  solarDate: string
  /** 校正后时分 */
  hour: number
  minute: number
  /** iztro 时辰索引 0–12 */
  timeIndex: number
  /** 总偏移分钟（经度+均时差） */
  offsetMinutes: number
  longitudeCorr: number
  eot: number
  summary: string
}

/** 钟表时 → 真太阳时 */
export function toTrueSolarTime(
  solarDate: string,
  hour: number,
  minute: number,
  longitudeEast: number,
): TrueSolarResult {
  const [y, m, d] = solarDate.split(/[-/]/).map(Number)
  const base = new Date(y, m - 1, d, hour, minute, 0, 0)
  const lonCorr = longitudeCorrectionMinutes(longitudeEast)
  const eot = equationOfTimeMinutes(base)
  const offset = lonCorr + eot
  const adjusted = new Date(base.getTime() + offset * 60 * 1000)

  const ay = adjusted.getFullYear()
  const am = adjusted.getMonth() + 1
  const ad = adjusted.getDate()
  const ah = adjusted.getHours()
  const amin = adjusted.getMinutes()
  const solarOut = `${ay}-${am}-${ad}`
  const timeIndex = clockToTimeIndex(ah, amin)

  const sign = offset >= 0 ? '+' : ''
  const summary = `经度${longitudeEast.toFixed(2)}°E，经度差${sign}${lonCorr.toFixed(1)}分，均时差${eot >= 0 ? '+' : ''}${eot.toFixed(1)}分 → 真太阳时 ${pad(ah)}:${pad(amin)}（${TIME_INDEX_LABEL[timeIndex]}）`

  return {
    solarDate: solarOut,
    hour: ah,
    minute: amin,
    timeIndex,
    offsetMinutes: offset,
    longitudeCorr: lonCorr,
    eot,
    summary,
  }
}

function pad(n: number) {
  return n < 10 ? `0${n}` : String(n)
}

/** 钟点 → 时辰索引（含早晚子） */
export function clockToTimeIndex(hour: number, minute = 0): number {
  const total = hour * 60 + minute
  // 23:00–23:59 晚子 12；00:00–00:59 早子 0
  if (total >= 23 * 60) return 12
  if (total < 60) return 0
  // 1:00–2:59 丑 … 每两小时一辰
  return Math.floor((total - 60) / 120) + 1
}

export const TIME_INDEX_LABEL = [
  '早子',
  '丑时',
  '寅时',
  '卯时',
  '辰时',
  '巳时',
  '午时',
  '未时',
  '申时',
  '酉时',
  '戌时',
  '亥时',
  '晚子',
] as const

/** 时辰中点钟点（用于未开真太阳时的默认） */
export function timeIndexToClock(timeIndex: number): { hour: number; minute: number } {
  if (timeIndex === 0) return { hour: 0, minute: 30 }
  if (timeIndex === 12) return { hour: 23, minute: 30 }
  return { hour: timeIndex * 2 - 1, minute: 0 }
}
