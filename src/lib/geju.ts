import gejuDb from '../data/geju_database.json'
import type { GejuEntry, GejuHit } from '../types'

type StarLite = { name: string; mutagen?: string }
type PalaceLite = {
  name: string
  index: number
  earthlyBranch?: string
  heavenlyStem?: string
  isBodyPalace?: boolean
  isSoul?: boolean
  majorStars: StarLite[]
  minorStars: StarLite[]
  adjectiveStars?: StarLite[]
}

type ChartLite = {
  palaces: PalaceLite[]
  soul?: string
  body?: string
  gender?: string
}

const ENTRIES = (gejuDb as { entries: GejuEntry[] }).entries

const BRANCHES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const

function starsOf(p: PalaceLite | undefined): string[] {
  if (!p) return []
  return [...p.majorStars, ...p.minorStars, ...(p.adjectiveStars || [])].map((s) => s.name)
}

function setOf(p: PalaceLite | undefined): Set<string> {
  return new Set(starsOf(p))
}

function hasAll(p: PalaceLite | undefined, names: string[]): boolean {
  const s = setOf(p)
  return names.every((n) => s.has(n))
}

function hasAny(p: PalaceLite | undefined, names: string[]): boolean {
  const s = setOf(p)
  return names.some((n) => s.has(n))
}

function soulPalace(chart: ChartLite): PalaceLite | undefined {
  return chart.palaces.find((p) => p.isSoul || p.name === '命宫')
}

function palaceByName(chart: ChartLite, name: string): PalaceLite | undefined {
  return chart.palaces.find((p) => p.name === name || p.name.includes(name))
}

function palaceByBranch(chart: ChartLite, branch: string): PalaceLite | undefined {
  return chart.palaces.find((p) => p.earthlyBranch === branch)
}

/** 三合局地支 */
function triHarmony(branch: string): string[] {
  const groups = [
    ['申', '子', '辰'],
    ['寅', '午', '戌'],
    ['巳', '酉', '丑'],
    ['亥', '卯', '未'],
  ]
  return groups.find((g) => g.includes(branch)) || []
}

/** 对宫 */
function oppositeBranch(branch: string): string {
  const i = BRANCHES.indexOf(branch as (typeof BRANCHES)[number])
  return BRANCHES[(i + 6) % 12]
}

/** 邻宫（夹） */
function neighborBranches(branch: string): [string, string] {
  const i = BRANCHES.indexOf(branch as (typeof BRANCHES)[number])
  return [BRANCHES[(i + 11) % 12], BRANCHES[(i + 1) % 12]]
}

function chartHas(chart: ChartLite, name: string): boolean {
  return chart.palaces.some((p) => setOf(p).has(name))
}

function mutagensOnChart(chart: ChartLite): Set<string> {
  const s = new Set<string>()
  for (const p of chart.palaces) {
    for (const st of [...p.majorStars, ...p.minorStars]) {
      if (st.mutagen) s.add(st.mutagen)
    }
  }
  return s
}

function findStarPalace(chart: ChartLite, star: string): PalaceLite | undefined {
  return chart.palaces.find((p) => setOf(p).has(star))
}

type RuleResult = { ok: boolean; reasons: string[]; score: number }

/** 严格入格规则：必须结构成立，不再用「星曜比例」放水 */
const STRICT_RULES: Record<string, (c: ChartLite) => RuleResult> = {
  火贪格: (c) => {
    const soul = soulPalace(c)
    const ok = hasAll(soul, ['贪狼']) && hasAny(soul, ['火星'])
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['命宫贪狼与火星同宫'] : [],
    }
  },
  铃贪格: (c) => {
    const soul = soulPalace(c)
    const ok = hasAll(soul, ['贪狼']) && hasAny(soul, ['铃星'])
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['命宫贪狼与铃星同宫'] : [],
    }
  },
  马头带箭格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok =
      hasAll(soul, ['贪狼']) &&
      hasAny(soul, ['擎羊']) &&
      (b === '午' || b === '卯' || b === '酉' || b === '子')
    return {
      ok,
      score: ok ? 88 : 0,
      reasons: ok ? [`命宫(${b})贪狼擎羊同宫`] : [],
    }
  },
  巨机同宫格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok = hasAll(soul, ['巨门', '天机']) && (b === '卯' || b === '酉')
    return {
      ok,
      score: ok ? 92 : 0,
      reasons: ok ? [`命宫在${b}，巨门天机同宫`] : [],
    }
  },
  巨机化酉格: (c) => {
    const soul = soulPalace(c)
    const ok =
      soul?.earthlyBranch === '酉' &&
      hasAll(soul, ['巨门', '天机']) &&
      [...(soul?.majorStars || []), ...(soul?.minorStars || [])].some((s) => s.mutagen === '忌')
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['酉宫巨机同宫且见化忌'] : [],
    }
  },
  贞杀同宫格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok = hasAll(soul, ['廉贞', '七杀']) && (b === '丑' || b === '未')
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? [`${b}宫廉贞七杀同宫`] : [],
    }
  },
  极居卯酉格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok = hasAll(soul, ['紫微', '贪狼']) && (b === '卯' || b === '酉')
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? [`${b}宫紫微贪狼同宫`] : [],
    }
  },
  命无正曜格: (c) => {
    const soul = soulPalace(c)
    const ok = (soul?.majorStars.length ?? -1) === 0
    return {
      ok,
      score: ok ? 95 : 0,
      reasons: ok ? ['命宫无十四主星'] : [],
    }
  },
  命里逢空格: (c) => {
    const soul = soulPalace(c)
    const ok = hasAny(soul, ['地空', '地劫'])
    return {
      ok,
      score: ok ? 85 : 0,
      reasons: ok ? ['命宫见地空/地劫'] : [],
    }
  },
  日月反背格: (c) => {
    const sun = findStarPalace(c, '太阳')
    const moon = findStarPalace(c, '太阴')
    const soul = soulPalace(c)
    // 严格：日月对居戌辰/亥卯，或命坐陷地日月
    const strict =
      (sun?.earthlyBranch === '戌' && moon?.earthlyBranch === '辰') ||
      (sun?.earthlyBranch === '亥' && moon?.earthlyBranch === '卯') ||
      (soul?.earthlyBranch === '戌' && hasAny(soul, ['太阳'])) ||
      (soul?.earthlyBranch === '辰' && hasAny(soul, ['太阴'])) ||
      (soul?.earthlyBranch === '卯' && hasAny(soul, ['太阴'])) ||
      (soul?.earthlyBranch === '亥' && hasAny(soul, ['太阳']))
    return {
      ok: !!strict,
      score: strict ? 88 : 0,
      reasons: strict
        ? [
            `太阳在${sun?.earthlyBranch || '—'}，太阴在${moon?.earthlyBranch || '—'}，日月失辉/反背`,
          ]
        : [],
    }
  },
  日月照壁格: (c) => {
    // 简化：田宅宫见日月佳美（严格版：田宅有日月且庙旺——亮度信息可选）
    const tian = palaceByName(c, '田宅')
    const ok = hasAny(tian, ['太阳']) && hasAny(tian, ['太阴'])
    return {
      ok,
      score: ok ? 80 : 0,
      reasons: ok ? ['田宅宫日月同临'] : [],
    }
  },
  日月同临格: (c) => {
    const soul = soulPalace(c)
    const ok = hasAll(soul, ['太阳', '太阴'])
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['命宫日月同宫'] : [],
    }
  },
  石中隐玉格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok = hasAny(soul, ['巨门']) && (b === '子' || b === '午')
    return {
      ok,
      score: ok ? 86 : 0,
      reasons: ok ? [`巨门在${b}坐命（石中隐玉）`] : [],
    }
  },
  机月同梁格: (c) => {
    // 机月同梁会于命或三方
    const need = ['天机', '太阴', '天同', '天梁']
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const tri = triHarmony(soul.earthlyBranch)
    const opp = oppositeBranch(soul.earthlyBranch)
    const zone = [soul.earthlyBranch, ...tri, opp]
    const found = new Set<string>()
    for (const b of zone) {
      const p = palaceByBranch(c, b)
      for (const n of need) if (setOf(p).has(n)) found.add(n)
    }
    const ok = found.size === 4
    return {
      ok,
      score: ok ? 88 : 0,
      reasons: ok ? ['命宫三方四正会齐天机、太阴、天同、天梁'] : [],
    }
  },
  紫府朝垣格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const tri = triHarmony(soul.earthlyBranch).filter((b) => b !== soul.earthlyBranch)
    const hasZiwei = tri.some((b) => hasAny(palaceByBranch(c, b), ['紫微']))
    const hasTianfu = tri.some((b) => hasAny(palaceByBranch(c, b), ['天府']))
    // 或命宫紫微/天府朝垣
    const ok =
      (hasZiwei && hasTianfu) ||
      (hasAny(soul, ['紫微']) && tri.some((b) => hasAny(palaceByBranch(c, b), ['天府']))) ||
      (hasAny(soul, ['天府']) && tri.some((b) => hasAny(palaceByBranch(c, b), ['紫微'])))
    return {
      ok: !!ok,
      score: ok ? 85 : 0,
      reasons: ok ? ['紫微天府与命宫成朝垣之势'] : [],
    }
  },
  紫府夹命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const [a, b] = neighborBranches(soul.earthlyBranch)
    const ok =
      (hasAny(palaceByBranch(c, a), ['紫微']) && hasAny(palaceByBranch(c, b), ['天府'])) ||
      (hasAny(palaceByBranch(c, a), ['天府']) && hasAny(palaceByBranch(c, b), ['紫微']))
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? [`紫府夹命（邻宫 ${a}/${b}）`] : [],
    }
  },
  左右夹命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const [a, b] = neighborBranches(soul.earthlyBranch)
    const ok =
      (hasAny(palaceByBranch(c, a), ['左辅']) && hasAny(palaceByBranch(c, b), ['右弼'])) ||
      (hasAny(palaceByBranch(c, a), ['右弼']) && hasAny(palaceByBranch(c, b), ['左辅']))
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['左辅右弼夹命'] : [],
    }
  },
  昌曲夹命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const [a, b] = neighborBranches(soul.earthlyBranch)
    const ok =
      (hasAny(palaceByBranch(c, a), ['文昌']) && hasAny(palaceByBranch(c, b), ['文曲'])) ||
      (hasAny(palaceByBranch(c, a), ['文曲']) && hasAny(palaceByBranch(c, b), ['文昌']))
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['文昌文曲夹命'] : [],
    }
  },
  文星暗拱格: (c) => {
    // 昌曲在丑未拱照
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok =
      (b === '丑' || b === '未') &&
      c.palaces.some(
        (p) =>
          (p.earthlyBranch === '丑' || p.earthlyBranch === '未') &&
          p.index !== soul?.index &&
          hasAny(p, ['文昌']) &&
          hasAny(p, ['文曲']),
      )
    // 或对宫昌曲
    const opp = soul?.earthlyBranch ? palaceByBranch(c, oppositeBranch(soul.earthlyBranch)) : undefined
    const ok2 = hasAny(opp, ['文昌']) && hasAny(opp, ['文曲'])
    return {
      ok: !!(ok || ok2),
      score: ok || ok2 ? 82 : 0,
      reasons: ok || ok2 ? ['文昌文曲暗拱命宫'] : [],
    }
  },
  文星拱命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const tri = [soul.earthlyBranch, ...triHarmony(soul.earthlyBranch), oppositeBranch(soul.earthlyBranch)]
    let chang = false
    let qu = false
    for (const br of tri) {
      const p = palaceByBranch(c, br)
      if (hasAny(p, ['文昌'])) chang = true
      if (hasAny(p, ['文曲'])) qu = true
    }
    const ok = chang && qu
    return {
      ok,
      score: ok ? 84 : 0,
      reasons: ok ? ['三方四正文昌文曲拱命'] : [],
    }
  },
  辅弼同宫格: (c) => {
    const soul = soulPalace(c)
    const ok = hasAll(soul, ['左辅', '右弼'])
    return {
      ok,
      score: ok ? 88 : 0,
      reasons: ok ? ['命宫左辅右弼同宫'] : [],
    }
  },
  辅拱文星格: (c) => {
    const soul = soulPalace(c)
    const ok =
      (hasAny(soul, ['文昌']) || hasAny(soul, ['文曲'])) &&
      (hasAny(soul, ['左辅']) ||
        c.palaces.some(
          (p) =>
            soul?.earthlyBranch &&
            triHarmony(soul.earthlyBranch).includes(p.earthlyBranch || '') &&
            hasAny(p, ['左辅']),
        ))
    return {
      ok: !!ok,
      score: ok ? 80 : 0,
      reasons: ok ? ['文星得左辅拱照'] : [],
    }
  },
  火铃夹命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const [a, b] = neighborBranches(soul.earthlyBranch)
    const ok =
      (hasAny(palaceByBranch(c, a), ['火星']) && hasAny(palaceByBranch(c, b), ['铃星'])) ||
      (hasAny(palaceByBranch(c, a), ['铃星']) && hasAny(palaceByBranch(c, b), ['火星']))
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['火星铃星夹命'] : [],
    }
  },
  财荫夹印格: (c) => {
    // 天相被化禄/禄存与天梁所夹
    const xiang = findStarPalace(c, '天相')
    if (!xiang?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const [a, b] = neighborBranches(xiang.earthlyBranch)
    const pa = palaceByBranch(c, a)
    const pb = palaceByBranch(c, b)
    const hasLiang = hasAny(pa, ['天梁']) || hasAny(pb, ['天梁'])
    const hasLu =
      hasAny(pa, ['禄存']) ||
      hasAny(pb, ['禄存']) ||
      [...(pa?.majorStars || []), ...(pa?.minorStars || [])].some((s) => s.mutagen === '禄') ||
      [...(pb?.majorStars || []), ...(pb?.minorStars || [])].some((s) => s.mutagen === '禄')
    const ok = hasLiang && hasLu
    return {
      ok,
      score: ok ? 86 : 0,
      reasons: ok ? [`天相在${xiang.earthlyBranch}被禄与天梁夹（财荫夹印）`] : [],
    }
  },
  刑忌夹印格: (c) => {
    const xiang = findStarPalace(c, '天相')
    if (!xiang?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const [a, b] = neighborBranches(xiang.earthlyBranch)
    const pa = palaceByBranch(c, a)
    const pb = palaceByBranch(c, b)
    const hasJi =
      [...(pa?.majorStars || []), ...(pa?.minorStars || []), ...(pb?.majorStars || []), ...(pb?.minorStars || [])].some(
        (s) => s.mutagen === '忌',
      )
    const hasXing = hasAny(pa, ['擎羊']) || hasAny(pb, ['擎羊']) || hasAny(pa, ['陀罗']) || hasAny(pb, ['陀罗'])
    const ok = hasJi && hasXing
    return {
      ok,
      score: ok ? 86 : 0,
      reasons: ok ? ['天相被刑忌所夹'] : [],
    }
  },
  刑囚夹印格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok =
      (b === '子' || b === '午') &&
      hasAll(soul, ['廉贞', '天相']) &&
      hasAny(soul, ['擎羊'])
    return {
      ok,
      score: ok ? 92 : 0,
      reasons: ok ? [`${b}宫廉贞天相擎羊（刑囚夹印）`] : [],
    }
  },
  坐贵向贵格: (c) => {
    const soul = soulPalace(c)
    const hasKui = hasAny(soul, ['天魁']) || hasAny(soul, ['天钺'])
    const opp = soul?.earthlyBranch
      ? palaceByBranch(c, oppositeBranch(soul.earthlyBranch))
      : undefined
    const toward = hasAny(opp, ['天魁']) || hasAny(opp, ['天钺'])
    const both = chartHas(c, '天魁') && chartHas(c, '天钺')
    const ok = both && (hasKui || toward)
    return {
      ok: !!ok,
      score: ok ? 82 : 0,
      reasons: ok ? ['魁钺坐命或向贵'] : [],
    }
  },
  禄马交驰格: (c) => {
    const ma = findStarPalace(c, '天马')
    if (!ma) return { ok: false, score: 0, reasons: [] }
    const hasLu =
      hasAny(ma, ['禄存']) ||
      [...ma.majorStars, ...ma.minorStars].some((s) => s.mutagen === '禄') ||
      // 三方见禄
      (ma.earthlyBranch &&
        triHarmony(ma.earthlyBranch).some((b) => {
          const p = palaceByBranch(c, b)
          return (
            hasAny(p, ['禄存']) ||
            [...(p?.majorStars || []), ...(p?.minorStars || [])].some((s) => s.mutagen === '禄')
          )
        }))
    const ok = !!hasLu
    return {
      ok,
      score: ok ? 84 : 0,
      reasons: ok ? ['天马与禄会照/同宫（禄马交驰）'] : [],
    }
  },
  禄马佩印格: (c) => {
    const soul = soulPalace(c)
    const ok =
      hasAny(soul, ['天相']) &&
      hasAny(soul, ['天马']) &&
      (hasAny(soul, ['禄存']) ||
        [...(soul?.majorStars || []), ...(soul?.minorStars || [])].some((s) => s.mutagen === '禄'))
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['命宫禄、马、天相齐聚'] : [],
    }
  },
  三奇嘉会格: (c) => {
    const m = mutagensOnChart(c)
    const ok = m.has('禄') && m.has('权') && m.has('科')
    if (!ok) return { ok: false, score: 0, reasons: [] }
    // 严格：三奇落在命宫三方四正
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const zone = new Set([
      soul.earthlyBranch,
      ...triHarmony(soul.earthlyBranch),
      oppositeBranch(soul.earthlyBranch),
    ])
    const found = new Set<string>()
    for (const p of c.palaces) {
      if (!zone.has(p.earthlyBranch || '')) continue
      for (const s of [...p.majorStars, ...p.minorStars]) {
        if (s.mutagen === '禄' || s.mutagen === '权' || s.mutagen === '科') found.add(s.mutagen)
      }
    }
    const strict = found.size === 3
    return {
      ok: strict,
      score: strict ? 92 : 0,
      reasons: strict ? ['命宫三方四正会齐化禄、化权、化科'] : [],
    }
  },
  擎羊入庙格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok = hasAny(soul, ['擎羊']) && ['辰', '戌', '丑', '未'].includes(b)
    return {
      ok,
      score: ok ? 85 : 0,
      reasons: ok ? [`擎羊入四墓库(${b})坐命`] : [],
    }
  },
  擎羊火星格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok =
      hasAny(soul, ['擎羊']) &&
      hasAny(soul, ['火星']) &&
      ['辰', '戌', '丑', '未'].includes(b)
    return {
      ok,
      score: ok ? 88 : 0,
      reasons: ok ? ['四墓宫擎羊火星同宫'] : [],
    }
  },
  泛水桃花格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok =
      (b === '子' && hasAny(soul, ['贪狼'])) ||
      (b === '亥' && hasAll(soul, ['廉贞', '贪狼']) && hasAny(soul, ['陀罗']))
    return {
      ok: !!ok,
      score: ok ? 88 : 0,
      reasons: ok ? ['泛水桃花结构成立'] : [],
    }
  },
  风流彩杖格: (c) => {
    const soul = soulPalace(c)
    const ok = soul?.earthlyBranch === '寅' && hasAny(soul, ['贪狼']) && hasAny(soul, ['陀罗'])
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['寅宫贪狼陀罗（风流彩杖）'] : [],
    }
  },
  巨逢四煞格: (c) => {
    const soul = soulPalace(c)
    if (!hasAny(soul, ['巨门']) || !soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const zone = [
      soul.earthlyBranch,
      ...triHarmony(soul.earthlyBranch),
      oppositeBranch(soul.earthlyBranch),
    ]
    const sha = ['擎羊', '陀罗', '火星', '铃星']
    const hit = sha.filter((s) =>
      zone.some((b) => hasAny(palaceByBranch(c, b), [s])),
    )
    const ok = hit.length >= 3
    return {
      ok,
      score: ok ? 84 : 0,
      reasons: ok ? [`巨门坐命，三方四正会四煞：${hit.join('、')}`] : [],
    }
  },
  禄逢冲破格: (c) => {
    const soul = soulPalace(c)
    const hasLu =
      hasAny(soul, ['禄存']) ||
      [...(soul?.majorStars || []), ...(soul?.minorStars || [])].some((s) => s.mutagen === '禄')
    const hasKong = hasAny(soul, ['地空']) || hasAny(soul, ['地劫'])
    // 或三方冲破
    const ok = !!(hasLu && hasKong)
    return {
      ok,
      score: ok ? 86 : 0,
      reasons: ok ? ['禄与空劫同宫冲破'] : [],
    }
  },
  两重华盖格: (c) => {
    const soul = soulPalace(c)
    const doubleLu =
      hasAny(soul, ['禄存']) &&
      [...(soul?.majorStars || []), ...(soul?.minorStars || [])].some((s) => s.mutagen === '禄')
    const kong = hasAny(soul, ['地空']) || hasAny(soul, ['地劫'])
    const ok = doubleLu && kong
    return {
      ok: !!ok,
      score: ok ? 88 : 0,
      reasons: ok ? ['双禄逢空劫（两重华盖）'] : [],
    }
  },
  武贪同行格: (c) => {
    const soul = soulPalace(c)
    const ok = hasAll(soul, ['武曲', '贪狼'])
    return {
      ok,
      score: ok ? 88 : 0,
      reasons: ok ? ['命宫武曲贪狼同宫'] : [],
    }
  },
  紫微居午格: (c) => {
    const soul = soulPalace(c)
    const ok = soul?.earthlyBranch === '午' && hasAny(soul, ['紫微'])
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['紫微居午坐命'] : [],
    }
  },
  日丽中天格: (c) => {
    const soul = soulPalace(c)
    const ok = soul?.earthlyBranch === '午' && hasAny(soul, ['太阳'])
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['太阳居午（日丽中天）'] : [],
    }
  },
  水澄桂萼格: (c) => {
    const soul = soulPalace(c)
    const ok = soul?.earthlyBranch === '子' && hasAny(soul, ['太阴'])
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['太阴居子（水澄桂萼）'] : [],
    }
  },
  天梁居午格: (c) => {
    const soul = soulPalace(c)
    const ok = soul?.earthlyBranch === '午' && hasAny(soul, ['天梁'])
    return {
      ok,
      score: ok ? 88 : 0,
      reasons: ok ? ['天梁居午坐命'] : [],
    }
  },
  文星遇夹格: (c) => {
    const soul = soulPalace(c)
    if (!hasAny(soul, ['文昌']) && !hasAny(soul, ['文曲']))
      return { ok: false, score: 0, reasons: [] }
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const [a, b] = neighborBranches(soul.earthlyBranch)
    const sha = ['地空', '地劫', '火星', '铃星', '擎羊', '陀罗']
    const left = sha.some((s) => hasAny(palaceByBranch(c, a), [s]))
    const right = sha.some((s) => hasAny(palaceByBranch(c, b), [s]))
    // 对星夹：空劫一对或火铃一对或羊陀一对
    const pair =
      (hasAny(palaceByBranch(c, a), ['地空']) && hasAny(palaceByBranch(c, b), ['地劫'])) ||
      (hasAny(palaceByBranch(c, a), ['地劫']) && hasAny(palaceByBranch(c, b), ['地空'])) ||
      (hasAny(palaceByBranch(c, a), ['火星']) && hasAny(palaceByBranch(c, b), ['铃星'])) ||
      (hasAny(palaceByBranch(c, a), ['铃星']) && hasAny(palaceByBranch(c, b), ['火星'])) ||
      (hasAny(palaceByBranch(c, a), ['擎羊']) && hasAny(palaceByBranch(c, b), ['陀罗'])) ||
      (hasAny(palaceByBranch(c, a), ['陀罗']) && hasAny(palaceByBranch(c, b), ['擎羊']))
    const ok = pair || (left && right)
    return {
      ok: !!ok,
      score: ok ? 86 : 0,
      reasons: ok ? ['文星被空劫/火铃/羊陀夹'] : [],
    }
  },
  廉贞清白格: (c) => {
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok =
      hasAny(soul, ['廉贞']) &&
      (b === '申' || b === '未') &&
      ([...(soul?.majorStars || [])].some((s) => s.name === '廉贞' && s.mutagen === '禄') ||
        hasAny(soul, ['禄存']))
    return {
      ok: !!ok,
      score: ok ? 84 : 0,
      reasons: ok ? ['廉贞在申未得禄（清白）'] : [],
    }
  },
  杀破狼格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const zone = [
      soul.earthlyBranch,
      ...triHarmony(soul.earthlyBranch),
      oppositeBranch(soul.earthlyBranch),
    ]
    const need = ['七杀', '破军', '贪狼']
    const found = need.filter((n) => zone.some((b) => hasAny(palaceByBranch(c, b), [n])))
    const ok = found.length === 3
    return {
      ok,
      score: ok ? 85 : 0,
      reasons: ok ? ['命宫三方四正会齐杀破狼'] : [],
    }
  },
}

/** 名称别名映射到规则键 */
function resolveRuleKey(name: string): string | undefined {
  if (STRICT_RULES[name]) return name
  // 部分条目名略有出入
  const aliases: Record<string, string> = {
    三合火贪格: '火贪格',
    科权禄拱格: '三奇嘉会格',
    府相朝垣格: '紫府朝垣格',
    日月夹财格: '日月同临格',
  }
  return aliases[name]
}

export function matchGeju(chart: ChartLite): GejuHit[] {
  const hits: GejuHit[] = []
  const usedRules = new Set<string>()

  // 1) 先跑全部严格规则
  for (const [key, rule] of Object.entries(STRICT_RULES)) {
    const r = rule(chart)
    if (!r.ok || r.score < 80) continue
    usedRules.add(key)
    const entry =
      ENTRIES.find((e) => e.name === key) ||
      ({
        name: key,
        type: inferType(key),
        condition: r.reasons.join('；'),
        poem: '',
        classics: [],
        stars: [],
        full_text: r.reasons.join('；'),
      } satisfies GejuEntry)

    hits.push({
      ...entry,
      score: r.score,
      reasons: r.reasons,
    })
  }

  // 2) 库中条目：仅当有对应严格规则且已命中时附带文案增强（已在上面合并）
  // 补充：库条目名能 resolve 到已命中规则时，替换为库文案
  for (let i = 0; i < hits.length; i++) {
    const lib = ENTRIES.find((e) => e.name === hits[i].name || resolveRuleKey(e.name) === hits[i].name)
    if (lib) {
      hits[i] = {
        ...hits[i],
        condition: lib.condition || hits[i].condition,
        poem: lib.poem || hits[i].poem,
        classics: lib.classics?.length ? lib.classics : hits[i].classics,
        full_text: lib.full_text || hits[i].full_text,
        type: lib.type || hits[i].type,
        stars: lib.stars?.length ? lib.stars : hits[i].stars,
      }
    }
  }

  return hits.sort((a, b) => b.score - a.score)
}

function inferType(name: string): string {
  if (/煞|刑|忌|空|反背|冲破|桃花|风流|四煞|夹命|泛水/.test(name)) return '凶格'
  if (/嘉会|朝垣|隐玉|同宫|入庙|佩印|交驰|居午|居子|同梁|拱命/.test(name)) return '吉格'
  return 'unknown'
}

export function gejuStats() {
  return {
    total: ENTRIES.length,
    strictRules: Object.keys(STRICT_RULES).length,
  }
}
