import { astro } from 'iztro'
import type { BirthInput } from '../types'
import { lunarToSolar } from './lunar'
import { getMutagensByStem, SIHUA_LABELS } from './sihua'
import { toTrueSolarTime, timeIndexToClock } from './solarTime'
import { normalizeBranch } from './time'
import { analyzeFlyStars, type FlyStarSummary } from './flyStar'
import { buildBaziFromAstrolabe, type BaziView } from './bazi'

export type StarView = {
  name: string
  brightness?: string
  mutagen?: string
  type: 'major' | 'minor' | 'adj'
  /** 宫干自化 */
  selfMutagen?: string
}

export type PalaceView = {
  index: number
  name: string
  heavenlyStem: string
  earthlyBranch: string
  isBodyPalace: boolean
  isOriginalPalace: boolean
  isSoul: boolean
  majorStars: StarView[]
  minorStars: StarView[]
  adjectiveStars: StarView[]
  changsheng12: string
  boshi12: string
  decadal: { range: [number, number]; heavenlyStem: string; earthlyBranch: string }
  ages: number[]
}

export type ChartView = {
  gender: string
  solarDate: string
  lunarDate: string
  chineseDate: string
  time: string
  timeRange: string
  sign: string
  zodiac: string
  soul: string
  body: string
  fiveElementsClass?: string
  palaces: PalaceView[]
  raw: ReturnType<typeof astro.bySolar>
  /** 真太阳时说明 */
  trueSolarSummary?: string
  /** 实际用于排盘的公历/时辰 */
  effectiveSolarDate: string
  effectiveTimeIndex: number
  inputCalendar: 'solar' | 'lunar'
  fly: FlyStarSummary
  /** 八字四柱 */
  bazi: BaziView
}

export type HoroscopeView = {
  solarDate: string
  lunarDate: string
  decadal: { name: string; heavenlyStem: string; earthlyBranch: string; index: number }
  yearly: { name: string; heavenlyStem: string; earthlyBranch: string; index: number }
  monthly: { name: string; heavenlyStem: string; earthlyBranch: string; index: number }
  daily: { name: string; heavenlyStem: string; earthlyBranch: string; index: number }
  age: { nominalAge: number; name: string; index: number }
}

function mapStar(
  s: { name: string; brightness?: string; mutagen?: string },
  type: StarView['type'],
  selfMutagen?: string,
): StarView {
  return {
    name: s.name,
    brightness: s.brightness || undefined,
    mutagen: s.mutagen || undefined,
    type,
    selfMutagen,
  }
}

/** 解析最终排盘用的公历日期与时辰 */
export function resolveBirth(input: BirthInput): {
  solarDate: string
  timeIndex: number
  trueSolarSummary?: string
} {
  let solarDate = input.solarDate
  if (input.calendarType === 'lunar') {
    solarDate = lunarToSolar({
      year: input.lunarYear,
      month: input.lunarMonth,
      day: input.lunarDay,
      isLeap: input.isLeapMonth,
    })
  }

  if (input.useTrueSolar) {
    const ts = toTrueSolarTime(
      solarDate,
      input.clockHour,
      input.clockMinute,
      input.longitude,
    )
    return {
      solarDate: ts.solarDate,
      timeIndex: ts.timeIndex,
      trueSolarSummary: ts.summary,
    }
  }

  return { solarDate, timeIndex: input.timeIndex }
}

export function buildChart(
  input: BirthInput,
  algorithm: 'default' | 'zhongzhou' = 'default',
): ChartView {
  astro.config({ algorithm })
  const resolved = resolveBirth(input)

  const raw =
    input.calendarType === 'lunar' && !input.useTrueSolar
      ? astro.byLunar(
          `${input.lunarYear}-${input.lunarMonth}-${input.lunarDay}`,
          input.timeIndex,
          input.gender,
          input.isLeapMonth,
          true,
          'zh-CN',
        )
      : astro.bySolar(resolved.solarDate, resolved.timeIndex, input.gender, true, 'zh-CN')

  // 自化 map: palaceIndex:starName -> mutagen
  const selfMap = new Map<string, string>()
  for (const p of raw.palaces) {
    const muts = getMutagensByStem(String(p.heavenlyStem))
    muts.forEach((starName, i) => {
      selfMap.set(`${p.index}:${starName}`, SIHUA_LABELS[i])
    })
  }

  const palaces: PalaceView[] = raw.palaces.map((p) => {
    const selfOf = (name: string) => selfMap.get(`${p.index}:${name}`)
    return {
      index: p.index,
      name: p.name,
      heavenlyStem: p.heavenlyStem,
      earthlyBranch: normalizeBranch(p.earthlyBranch),
      isBodyPalace: p.isBodyPalace,
      isOriginalPalace: p.isOriginalPalace,
      isSoul: p.name === '命宫',
      majorStars: p.majorStars.map((s) => mapStar(s, 'major', selfOf(s.name))),
      minorStars: p.minorStars.map((s) => mapStar(s, 'minor', selfOf(s.name))),
      adjectiveStars: p.adjectiveStars.map((s) => mapStar(s, 'adj', selfOf(s.name))),
      changsheng12: p.changsheng12,
      boshi12: p.boshi12,
      decadal: {
        range: p.decadal.range,
        heavenlyStem: p.decadal.heavenlyStem,
        earthlyBranch: p.decadal.earthlyBranch,
      },
      ages: p.ages,
    }
  })

  const view: ChartView = {
    gender: raw.gender,
    solarDate: raw.solarDate,
    lunarDate: raw.lunarDate,
    chineseDate: raw.chineseDate,
    time: raw.time,
    timeRange: raw.timeRange,
    sign: raw.sign,
    zodiac: raw.zodiac,
    soul: raw.soul,
    body: raw.body,
    fiveElementsClass: (raw as { fiveElementsClass?: string }).fiveElementsClass,
    palaces,
    raw,
    trueSolarSummary: resolved.trueSolarSummary,
    effectiveSolarDate: resolved.solarDate,
    effectiveTimeIndex: resolved.timeIndex,
    inputCalendar: input.calendarType,
    fly: { natal: [], self: [], arrows: [] },
    bazi: buildBaziFromAstrolabe(raw as Parameters<typeof buildBaziFromAstrolabe>[0]),
  }
  view.fly = analyzeFlyStars(view)
  return view
}

export function buildHoroscope(chart: ChartView, date?: string): HoroscopeView {
  const h = chart.raw.horoscope(date)
  return {
    solarDate: h.solarDate,
    lunarDate: h.lunarDate,
    decadal: {
      name: h.decadal.name,
      heavenlyStem: h.decadal.heavenlyStem,
      earthlyBranch: h.decadal.earthlyBranch,
      index: h.decadal.index,
    },
    yearly: {
      name: h.yearly.name,
      heavenlyStem: h.yearly.heavenlyStem,
      earthlyBranch: h.yearly.earthlyBranch,
      index: h.yearly.index,
    },
    monthly: {
      name: h.monthly.name,
      heavenlyStem: h.monthly.heavenlyStem,
      earthlyBranch: h.monthly.earthlyBranch,
      index: h.monthly.index,
    },
    daily: {
      name: h.daily.name,
      heavenlyStem: h.daily.heavenlyStem,
      earthlyBranch: h.daily.earthlyBranch,
      index: h.daily.index,
    },
    age: {
      nominalAge: h.age.nominalAge,
      name: h.age.name,
      index: h.age.index,
    },
  }
}

export function palaceByBranch(chart: ChartView, branch: string): PalaceView | undefined {
  return chart.palaces.find((p) => p.earthlyBranch === branch)
}

export function defaultClockFromTimeIndex(timeIndex: number) {
  return timeIndexToClock(timeIndex)
}
