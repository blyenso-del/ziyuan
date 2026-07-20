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

function findStarPalace(chart: ChartLite, star: string): PalaceLite | undefined {
  return chart.palaces.find((p) => setOf(p).has(star))
}

/** 命宫三方四正地支（去重） */
function zoneBranches(branch: string): string[] {
  return [...new Set([branch, ...triHarmony(branch), oppositeBranch(branch)])]
}

function hasMutagen(p: PalaceLite | undefined, m: string): boolean {
  if (!p) return false
  return [...p.majorStars, ...p.minorStars, ...(p.adjectiveStars || [])].some(
    (s) => s.mutagen === m,
  )
}

function palaceHasLu(p: PalaceLite | undefined): boolean {
  return hasAny(p, ['禄存']) || hasMutagen(p, '禄')
}

function palaceHasKong(p: PalaceLite | undefined): boolean {
  return hasAny(p, ['地空', '地劫'])
}

/** 邻宫是否为 starA / starB 分居夹宫 */
function neighborsClamp(
  chart: ChartLite,
  branch: string,
  starA: string,
  starB: string,
): boolean {
  const [a, b] = neighborBranches(branch)
  const pa = palaceByBranch(chart, a)
  const pb = palaceByBranch(chart, b)
  return (
    (hasAny(pa, [starA]) && hasAny(pb, [starB])) ||
    (hasAny(pa, [starB]) && hasAny(pb, [starA]))
  )
}

/**
 * 真「夹」：左右邻宫分居，一侧满足 predLeft 条件、另一侧满足 predRight
 * （避免禄与梁同在一边仍被判夹的假阳性）
 */
function neighborsSplit(
  chart: ChartLite,
  branch: string,
  predA: (p: PalaceLite | undefined) => boolean,
  predB: (p: PalaceLite | undefined) => boolean,
): boolean {
  const [a, b] = neighborBranches(branch)
  const pa = palaceByBranch(chart, a)
  const pb = palaceByBranch(chart, b)
  return (predA(pa) && predB(pb)) || (predB(pa) && predA(pb))
}

/** 命/身 三方四正内是否同时具备两类星 */
function zoneHasBoth(
  chart: ChartLite,
  branch: string,
  pickA: (p: PalaceLite | undefined) => boolean,
  pickB: (p: PalaceLite | undefined) => boolean,
): boolean {
  const zone = zoneBranches(branch)
  let a = false
  let b = false
  for (const br of zone) {
    const p = palaceByBranch(chart, br)
    if (pickA(p)) a = true
    if (pickB(p)) b = true
  }
  return a && b
}

/** 命宫或身宫 */
function soulAndBody(chart: ChartLite): PalaceLite[] {
  const soul = soulPalace(chart)
  const body = chart.palaces.find((p) => p.isBodyPalace)
  const out: PalaceLite[] = []
  if (soul) out.push(soul)
  if (body && body.index !== soul?.index) out.push(body)
  return out
}

type RuleResult = { ok: boolean; reasons: string[]; score: number }

/** 严格入格规则：必须结构成立，不再用「星曜比例」放水 */
const STRICT_RULES: Record<string, (c: ChartLite) => RuleResult> = {
  火贪格: (c) => {
    // 同宫为上；命/身见贪或火之一，且三方四正会齐贪+火
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      if (hasAll(focus, ['贪狼']) && hasAny(focus, ['火星'])) {
        return { ok: true, score: 92, reasons: [`${focus.name}贪狼与火星同宫`] }
      }
      const onFocus = hasAny(focus, ['贪狼']) || hasAny(focus, ['火星'])
      if (
        onFocus &&
        zoneHasBoth(
          c,
          focus.earthlyBranch,
          (p) => hasAny(p, ['贪狼']),
          (p) => hasAny(p, ['火星']),
        )
      ) {
        return { ok: true, score: 86, reasons: [`${focus.name}三方四正贪狼会火星（火贪）`] }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  铃贪格: (c) => {
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      if (hasAll(focus, ['贪狼']) && hasAny(focus, ['铃星'])) {
        return { ok: true, score: 92, reasons: [`${focus.name}贪狼与铃星同宫`] }
      }
      const onFocus = hasAny(focus, ['贪狼']) || hasAny(focus, ['铃星'])
      if (
        onFocus &&
        zoneHasBoth(
          c,
          focus.earthlyBranch,
          (p) => hasAny(p, ['贪狼']),
          (p) => hasAny(p, ['铃星']),
        )
      ) {
        return { ok: true, score: 86, reasons: [`${focus.name}三方四正贪狼会铃星（铃贪）`] }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  马头带箭格: (c) => {
    // 经典以午宫贪狼擎羊为主；子午卯酉四正亦可论，午为上格
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok =
      hasAll(soul, ['贪狼']) &&
      hasAny(soul, ['擎羊']) &&
      (b === '午' || b === '子' || b === '卯' || b === '酉')
    return {
      ok,
      score: ok ? (b === '午' ? 92 : 86) : 0,
      reasons: ok ? [`命宫(${b})贪狼擎羊同宫（马头带箭）`] : [],
    }
  },
  巨机同宫格: (c) => {
    // 库文：巨机在卯为吉格；酉宫不为本格（酉见化忌另论巨机化酉）
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok = hasAll(soul, ['巨门', '天机']) && b === '卯'
    return {
      ok,
      score: ok ? 92 : 0,
      reasons: ok ? ['卯宫巨门天机同宫'] : [],
    }
  },
  巨机化酉格: (c) => {
    const soul = soulPalace(c)
    const ok =
      soul?.earthlyBranch === '酉' && hasAll(soul, ['巨门', '天机']) && hasMutagen(soul, '忌')
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
    // 严格：日戌月辰，或月卯日亥（日月皆处失辉之地）
    const sun = findStarPalace(c, '太阳')
    const moon = findStarPalace(c, '太阴')
    const pair1 = sun?.earthlyBranch === '戌' && moon?.earthlyBranch === '辰'
    const pair2 = sun?.earthlyBranch === '亥' && moon?.earthlyBranch === '卯'
    // 命坐反背位且见对应失辉星
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const soulBack =
      (b === '戌' && hasAny(soul, ['太阳'])) ||
      (b === '辰' && hasAny(soul, ['太阴'])) ||
      (b === '亥' && hasAny(soul, ['太阳'])) ||
      (b === '卯' && hasAny(soul, ['太阴']))
    const ok = !!(pair1 || pair2 || soulBack)
    return {
      ok,
      score: ok ? 88 : 0,
      reasons: ok
        ? [
            pair1 || pair2
              ? `太阳在${sun?.earthlyBranch}、太阴在${moon?.earthlyBranch}，日月反背`
              : `命坐${b}见失辉日月（反背）`,
          ]
        : [],
    }
  },
  日月照壁格: (c) => {
    // 日月同临田宅宫（照壁）
    const tian = palaceByName(c, '田宅')
    const ok = hasAll(tian, ['太阳', '太阴'])
    return {
      ok,
      score: ok ? 84 : 0,
      reasons: ok ? ['田宅宫日月同临（照壁）'] : [],
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
  日月夹财格: (c) => {
    // 日月夹命且命为财星（天府/武曲，或武曲贪狼）；或日月夹财帛宫
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const clampSoul = neighborsClamp(c, soul.earthlyBranch, '太阳', '太阴')
    const soulIsCai =
      hasAny(soul, ['天府']) ||
      hasAny(soul, ['武曲']) ||
      hasAll(soul, ['武曲', '贪狼'])
    const wealth = palaceByName(c, '财帛')
    const clampWealth =
      !!wealth?.earthlyBranch && neighborsClamp(c, wealth.earthlyBranch, '太阳', '太阴')
    const ok = (clampSoul && soulIsCai) || clampWealth
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok
        ? [
            clampSoul && soulIsCai
              ? '日月夹命且命宫为财星（日月夹财）'
              : '日月夹财帛宫（日月夹财）',
          ]
        : [],
    }
  },
  石中隐玉格: (c) => {
    // 巨门在子午坐命
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
    const need = ['天机', '太阴', '天同', '天梁']
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      const zone = zoneBranches(focus.earthlyBranch)
      const found = new Set<string>()
      for (const b of zone) {
        const p = palaceByBranch(c, b)
        for (const n of need) if (setOf(p).has(n)) found.add(n)
      }
      if (found.size === 4) {
        return {
          ok: true,
          score: 88,
          reasons: [`${focus.name}三方四正会齐天机、太阴、天同、天梁`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  紫府朝垣格: (c) => {
    // 朝垣：紫微、天府在命之三合方拱照；或一在命一在三合（不含对宫对照）
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      const tri = triHarmony(focus.earthlyBranch).filter((b) => b !== focus.earthlyBranch)
      const hasZiweiTri = tri.some((b) => hasAny(palaceByBranch(c, b), ['紫微']))
      const hasTianfuTri = tri.some((b) => hasAny(palaceByBranch(c, b), ['天府']))
      const ok =
        (hasZiweiTri && hasTianfuTri) ||
        (hasAny(focus, ['紫微']) && hasTianfuTri) ||
        (hasAny(focus, ['天府']) && hasZiweiTri)
      if (ok) {
        return {
          ok: true,
          score: 85,
          reasons: [`紫微天府与${focus.name}成朝垣之势`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  紫府夹命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const ok = neighborsClamp(c, soul.earthlyBranch, '紫微', '天府')
    const [a, b] = neighborBranches(soul.earthlyBranch)
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? [`紫府夹命（邻宫 ${a}/${b}）`] : [],
    }
  },
  左右夹命格: (c) => {
    // 左辅右弼邻宫夹命（不限丑未；丑未加吉尤贵）
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const ok = neighborsClamp(c, soul.earthlyBranch, '左辅', '右弼')
    const [a, b] = neighborBranches(soul.earthlyBranch)
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? [`左辅右弼夹命（邻宫 ${a}/${b}）`] : [],
    }
  },
  魁钺夹命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const ok = neighborsClamp(c, soul.earthlyBranch, '天魁', '天钺')
    const [a, b] = neighborBranches(soul.earthlyBranch)
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? [`天魁天钺夹命（邻宫 ${a}/${b}）`] : [],
    }
  },
  昌曲夹命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const ok = neighborsClamp(c, soul.earthlyBranch, '文昌', '文曲')
    const [a, b] = neighborBranches(soul.earthlyBranch)
    const chouWei = soul.earthlyBranch === '丑' || soul.earthlyBranch === '未'
    return {
      ok,
      score: ok ? (chouWei ? 92 : 90) : 0,
      reasons: ok
        ? chouWei
          ? [`文昌文曲夹命（命在${soul.earthlyBranch}，亦称文星暗拱）`, `邻宫 ${a}/${b}`]
          : [`文昌文曲夹命（邻宫 ${a}/${b}）`]
        : [],
    }
  },
  文星暗拱格: (c) => {
    // 命宫丑/未 + 昌曲邻宫夹（昌曲夹命特称）
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const b = soul.earthlyBranch
    if (b !== '丑' && b !== '未') return { ok: false, score: 0, reasons: [] }
    const ok = neighborsClamp(c, b, '文昌', '文曲')
    const [a, cbr] = neighborBranches(b)
    return {
      ok,
      score: ok ? 92 : 0,
      reasons: ok ? [`命宫在${b}，文昌文曲邻宫来夹（文星暗拱）`, `邻宫 ${a}/${cbr}`] : [],
    }
  },
  文星拱命格: (c) => {
    // 三方四正见昌见曲（拱）；若已成昌曲邻夹则归昌曲夹命/暗拱，此处不重复
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      if (neighborsClamp(c, focus.earthlyBranch, '文昌', '文曲')) continue
      if (
        zoneHasBoth(
          c,
          focus.earthlyBranch,
          (p) => hasAny(p, ['文昌']),
          (p) => hasAny(p, ['文曲']),
        )
      ) {
        return {
          ok: true,
          score: 84,
          reasons: [`${focus.name}三方四正文昌文曲拱照`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
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
    // 文昌/文曲在命或身，左辅或右弼同宫或三方拱照
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      if (!hasAny(focus, ['文昌']) && !hasAny(focus, ['文曲'])) continue
      const ok = zoneBranches(focus.earthlyBranch).some(
        (b) => hasAny(palaceByBranch(c, b), ['左辅']) || hasAny(palaceByBranch(c, b), ['右弼']),
      )
      if (ok) {
        return { ok: true, score: 82, reasons: [`${focus.name}文星得左辅/右弼拱照`] }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  火铃夹命格: (c) => {
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const ok = neighborsClamp(c, soul.earthlyBranch, '火星', '铃星')
    return {
      ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['火星铃星夹命'] : [],
    }
  },
  财荫夹印格: (c) => {
    // 天相左右：一侧禄、一侧天梁（必须分居两边，同边不算夹）
    const xiang = findStarPalace(c, '天相')
    if (!xiang?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const ok = neighborsSplit(
      c,
      xiang.earthlyBranch,
      (p) => palaceHasLu(p),
      (p) => hasAny(p, ['天梁']),
    )
    return {
      ok,
      score: ok ? 86 : 0,
      reasons: ok ? [`天相在${xiang.earthlyBranch}被禄与天梁左右分夹（财荫夹印）`] : [],
    }
  },
  刑忌夹印格: (c) => {
    // 一侧化忌、另一侧天梁或擎羊（真夹，同边不算）
    const xiang = findStarPalace(c, '天相')
    if (!xiang?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const withLiang = neighborsSplit(
      c,
      xiang.earthlyBranch,
      (p) => hasMutagen(p, '忌'),
      (p) => hasAny(p, ['天梁']),
    )
    const withYang = neighborsSplit(
      c,
      xiang.earthlyBranch,
      (p) => hasMutagen(p, '忌'),
      (p) => hasAny(p, ['擎羊']),
    )
    const ok = withLiang || withYang
    return {
      ok,
      score: ok ? 86 : 0,
      reasons: ok
        ? [
            withLiang
              ? '天相被化忌与天梁左右分夹（刑忌夹印）'
              : '天相被化忌与擎羊左右分夹（刑忌夹印）',
          ]
        : [],
    }
  },
  刑囚夹印格: (c) => {
    // 廉贞（囚）天相（印）在子午，擎羊（刑）同宫
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok =
      (b === '子' || b === '午') && hasAll(soul, ['廉贞', '天相']) && hasAny(soul, ['擎羊'])
    return {
      ok,
      score: ok ? 92 : 0,
      reasons: ok ? [`${b}宫廉贞天相擎羊（刑囚夹印）`] : [],
    }
  },
  坐贵向贵格: (c) => {
    // 魁/钺坐命，另一颗在对宫或三方四正（向贵）；或魁钺同坐命
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const sitKui = hasAny(soul, ['天魁'])
    const sitYue = hasAny(soul, ['天钺'])
    if (sitKui && sitYue) {
      return { ok: true, score: 90, reasons: ['天魁天钺同坐命宫（坐贵）'] }
    }
    const zone = zoneBranches(soul.earthlyBranch).filter((b) => b !== soul.earthlyBranch)
    const zoneHasKui = zone.some((b) => hasAny(palaceByBranch(c, b), ['天魁']))
    const zoneHasYue = zone.some((b) => hasAny(palaceByBranch(c, b), ['天钺']))
    const ok = (sitKui && zoneHasYue) || (sitYue && zoneHasKui)
    return {
      ok: !!ok,
      score: ok ? 86 : 0,
      reasons: ok ? ['天魁天钺坐贵向贵（命坐其一、三方四正见另一）'] : [],
    }
  },
  禄马交驰格: (c) => {
    /**
     * 禄马交驰：
     * 1) 主：命宫三方四正内既有天马，又有禄存或化禄（用户常说的「三方四正有禄有马」）
     * 2) 次：天马与禄存/化禄同宫（任意宫）
     * 3) 备：天马三方四正见禄
     * 旧逻辑只按「天马宫」三方找禄，命上有禄、马在他宫不交会时会漏判。
     */
    const soul = soulPalace(c)
    const ma = findStarPalace(c, '天马')
    if (!ma) return { ok: false, score: 0, reasons: [] }

    // 天马与禄同宫
    if (palaceHasLu(ma)) {
      return {
        ok: true,
        score: 90,
        reasons: [`天马与禄同在${ma.earthlyBranch || '—'}宫（禄马交驰）`],
      }
    }

    // 命宫 / 身宫 三方四正内同时见禄与马
    // 注意：禄与马可分别在命的三合与对宫，二者未必落在「彼此」的三方四正内，
    // 旧逻辑只查天马宫三方见禄，会漏掉「命上会禄马」之格。
    const foci = [soul, c.palaces.find((p) => p.isBodyPalace)].filter(Boolean) as PalaceLite[]
    for (const focus of foci) {
      if (!focus.earthlyBranch) continue
      const zone = zoneBranches(focus.earthlyBranch)
      const maIn = zone.some((b) => hasAny(palaceByBranch(c, b), ['天马']))
      const luIn = zone.some((b) => palaceHasLu(palaceByBranch(c, b)))
      if (maIn && luIn) {
        const label = focus.isSoul || focus.name === '命宫' ? '命宫' : '身宫'
        return {
          ok: true,
          score: 88,
          reasons: [
            `${label}三方四正会天马与禄（马在${ma.earthlyBranch || '—'}，禄马交驰）`,
          ],
        }
      }
    }

    // 天马三方四正见禄
    if (ma.earthlyBranch) {
      const maZone = zoneBranches(ma.earthlyBranch)
      const luNearMa = maZone.some((b) => palaceHasLu(palaceByBranch(c, b)))
      if (luNearMa) {
        return {
          ok: true,
          score: 84,
          reasons: [`天马在${ma.earthlyBranch}，三方四正会禄（禄马交驰）`],
        }
      }
    }

    return { ok: false, score: 0, reasons: [] }
  },
  禄马佩印格: (c) => {
    for (const focus of soulAndBody(c)) {
      const ok =
        hasAny(focus, ['天相']) && hasAny(focus, ['天马']) && palaceHasLu(focus)
      if (ok) {
        return {
          ok: true,
          score: 90,
          reasons: [`${focus.name}禄、马、天相齐聚（禄马佩印）`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  双禄重逢格: (c) => {
    // 禄存与化禄同宫（命或身）；见空劫则破，改论两重华盖
    for (const focus of soulAndBody(c)) {
      const ok =
        hasAny(focus, ['禄存']) &&
        hasMutagen(focus, '禄') &&
        !palaceHasKong(focus)
      if (ok) {
        return {
          ok: true,
          score: 88,
          reasons: [`${focus.name}禄存与化禄同宫（双禄重逢）`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  马落空亡格: (c) => {
    // 天马与空劫同宫；或天马三方四正逢空劫（劳而无获象）
    const ma = findStarPalace(c, '天马')
    if (!ma?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    if (palaceHasKong(ma)) {
      return {
        ok: true,
        score: 88,
        reasons: [`天马在${ma.earthlyBranch}与空劫同宫（马落空亡）`],
      }
    }
    const near = zoneBranches(ma.earthlyBranch).some((b) =>
      palaceHasKong(palaceByBranch(c, b)),
    )
    return {
      ok: near,
      score: near ? 82 : 0,
      reasons: near ? [`天马在${ma.earthlyBranch}，三方四正逢空劫（马落空亡）`] : [],
    }
  },
  日照雷门格: (c) => {
    // 太阳在卯坐命
    const soul = soulPalace(c)
    const ok = soul?.earthlyBranch === '卯' && hasAny(soul, ['太阳'])
    return {
      ok: !!ok,
      score: ok ? 90 : 0,
      reasons: ok ? ['太阳居卯（日照雷门）'] : [],
    }
  },
  武曲入庙格: (c) => {
    // 武曲入庙：多取辰戌丑未坐命
    const soul = soulPalace(c)
    const b = soul?.earthlyBranch || ''
    const ok = hasAny(soul, ['武曲']) && ['辰', '戌', '丑', '未'].includes(b)
    return {
      ok,
      score: ok ? 84 : 0,
      reasons: ok ? [`武曲在${b}入庙坐命`] : [],
    }
  },
  三奇嘉会格: (c) => {
    // 命/身三方四正会齐化禄、化权、化科
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      const zone = new Set(zoneBranches(focus.earthlyBranch))
      const found = new Set<string>()
      for (const p of c.palaces) {
        if (!zone.has(p.earthlyBranch || '')) continue
        for (const s of [...p.majorStars, ...p.minorStars, ...(p.adjectiveStars || [])]) {
          if (s.mutagen === '禄' || s.mutagen === '权' || s.mutagen === '科') found.add(s.mutagen)
        }
      }
      if (found.size === 3) {
        return {
          ok: true,
          score: 92,
          reasons: [`${focus.name}三方四正会齐化禄、化权、化科（三奇嘉会）`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
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
    // 巨门守命或身，三方四正会齐羊陀火铃
    for (const focus of soulAndBody(c)) {
      if (!hasAny(focus, ['巨门']) || !focus.earthlyBranch) continue
      const zone = zoneBranches(focus.earthlyBranch)
      const sha = ['擎羊', '陀罗', '火星', '铃星']
      const hit = sha.filter((s) => zone.some((b) => hasAny(palaceByBranch(c, b), [s])))
      if (hit.length === 4) {
        return {
          ok: true,
          score: 88,
          reasons: [`巨门在${focus.name}，三方四正会齐四煞：${hit.join('、')}`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  禄逢冲破格: (c) => {
    // 命/身三方四正内：某宫有禄且同宫见空劫；或命/身有禄且三方四正见空劫
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      const zone = zoneBranches(focus.earthlyBranch)
      // 禄与空劫同宫（在命/身力范围内）
      for (const b of zone) {
        const p = palaceByBranch(c, b)
        if (palaceHasLu(p) && palaceHasKong(p)) {
          return {
            ok: true,
            score: 88,
            reasons: [`${b}宫禄与空劫同宫（禄逢冲破）`],
          }
        }
      }
      if (palaceHasLu(focus) && zone.some((b) => palaceHasKong(palaceByBranch(c, b)))) {
        return {
          ok: true,
          score: 84,
          reasons: [`${focus.name}有禄，三方四正逢空劫冲破`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  两重华盖格: (c) => {
    // 禄存+化禄同宫，又见空劫（命或身）
    for (const focus of soulAndBody(c)) {
      const doubleLu = hasAny(focus, ['禄存']) && hasMutagen(focus, '禄')
      const kong = palaceHasKong(focus)
      if (doubleLu && kong) {
        return {
          ok: true,
          score: 88,
          reasons: [`${focus.name}双禄逢空劫（两重华盖）`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  武贪同行格: (c) => {
    // 同宫为上；命/身见武或贪，三方四正会齐武曲贪狼
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      if (hasAll(focus, ['武曲', '贪狼'])) {
        return { ok: true, score: 90, reasons: [`${focus.name}武曲贪狼同宫`] }
      }
      const onFocus = hasAny(focus, ['武曲']) || hasAny(focus, ['贪狼'])
      if (
        onFocus &&
        zoneHasBoth(
          c,
          focus.earthlyBranch,
          (p) => hasAny(p, ['武曲']),
          (p) => hasAny(p, ['贪狼']),
        )
      ) {
        return { ok: true, score: 84, reasons: [`${focus.name}三方四正武曲会贪狼（武贪同行）`] }
      }
    }
    return { ok: false, score: 0, reasons: [] }
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
    // 文昌或文曲守命，遇空劫/火铃/羊陀对星来夹
    const soul = soulPalace(c)
    if (!hasAny(soul, ['文昌']) && !hasAny(soul, ['文曲']))
      return { ok: false, score: 0, reasons: [] }
    if (!soul?.earthlyBranch) return { ok: false, score: 0, reasons: [] }
    const pair =
      neighborsClamp(c, soul.earthlyBranch, '地空', '地劫') ||
      neighborsClamp(c, soul.earthlyBranch, '火星', '铃星') ||
      neighborsClamp(c, soul.earthlyBranch, '擎羊', '陀罗')
    return {
      ok: pair,
      score: pair ? 86 : 0,
      reasons: pair ? ['文星被空劫/火铃/羊陀对星所夹'] : [],
    }
  },
  廉贞清白格: (c) => {
    // 廉贞在未化禄，或在寅/申与禄存同宫（命或身）
    for (const focus of soulAndBody(c)) {
      const b = focus.earthlyBranch || ''
      if (!hasAny(focus, ['廉贞'])) continue
      const weiLu = b === '未' && hasMutagen(focus, '禄')
      const yinShenLu = (b === '寅' || b === '申') && hasAny(focus, ['禄存'])
      if (weiLu || yinShenLu) {
        return {
          ok: true,
          score: 86,
          reasons: [
            weiLu
              ? `${focus.name}廉贞在未化禄（清白）`
              : `${focus.name}廉贞在${b}与禄存同宫（清白）`,
          ],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  杀破狼格: (c) => {
    // 命或身三方四正会齐七杀、破军、贪狼
    for (const focus of soulAndBody(c)) {
      if (!focus.earthlyBranch) continue
      const zone = zoneBranches(focus.earthlyBranch)
      const need = ['七杀', '破军', '贪狼']
      const found = need.filter((n) => zone.some((b) => hasAny(palaceByBranch(c, b), [n])))
      if (found.length === 3) {
        return {
          ok: true,
          score: 85,
          reasons: [`${focus.name}三方四正会齐杀破狼`],
        }
      }
    }
    return { ok: false, score: 0, reasons: [] }
  },
  明珠出海格: (c) => {
    /**
     * 明珠出海（蟾宫折桂同构）：
     * 安命在未、无正曜；
     * 卯宫太阳+天梁、亥宫太阴合照（亥卯未三合）；
     * 三方四正见禄存 / 科权禄 / 左右 / 昌曲 / 魁钺等加会。
     * 命身无四煞空劫冲破为成格上格。
     */
    const soul = soulPalace(c)
    if (!soul?.earthlyBranch || soul.earthlyBranch !== '未') {
      return { ok: false, score: 0, reasons: [] }
    }
    if ((soul.majorStars?.length ?? 0) > 0) {
      return { ok: false, score: 0, reasons: [] }
    }
    const mao = palaceByBranch(c, '卯')
    const hai = palaceByBranch(c, '亥')
    if (!hasAll(mao, ['太阳', '天梁'])) {
      return { ok: false, score: 0, reasons: [] }
    }
    if (!hasAny(hai, ['太阴'])) {
      return { ok: false, score: 0, reasons: [] }
    }

    const zone = zoneBranches('未')
    const zonePalaces = zone.map((b) => palaceByBranch(c, b))

    // 吉加会分类（命未之三方四正）
    const hasLuCun = zonePalaces.some((p) => hasAny(p, ['禄存']))
    const hasKeQuanLu = zonePalaces.some(
      (p) => hasMutagen(p, '禄') || hasMutagen(p, '权') || hasMutagen(p, '科'),
    )
    const hasZuoYou = zonePalaces.some((p) => hasAny(p, ['左辅']) || hasAny(p, ['右弼']))
    const hasChangQu = zonePalaces.some((p) => hasAny(p, ['文昌']) || hasAny(p, ['文曲']))
    const hasKuiYue = zonePalaces.some((p) => hasAny(p, ['天魁']) || hasAny(p, ['天钺']))
    const jiGroups = [
      hasLuCun && '禄存',
      hasKeQuanLu && '科权禄',
      hasZuoYou && '左右',
      hasChangQu && '昌曲',
      hasKuiYue && '魁钺',
    ].filter(Boolean) as string[]

    // 至少两类吉加会才论入格（仅日梁月合照而无辅吉过宽）
    if (jiGroups.length < 2) {
      return { ok: false, score: 0, reasons: [] }
    }

    // 四煞空劫冲破：命身三方见羊陀火铃空劫则降格/不取上格
    const sha = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫']
    const foci = soulAndBody(c)
    let hasSha = false
    for (const f of foci) {
      if (!f.earthlyBranch) continue
      for (const b of zoneBranches(f.earthlyBranch)) {
        const p = palaceByBranch(c, b)
        if (sha.some((s) => hasAny(p, [s]))) {
          hasSha = true
          break
        }
      }
      if (hasSha) break
    }

    const score = !hasSha && jiGroups.length >= 3 ? 94 : !hasSha ? 90 : 84
    const reasons = [
      '命未无正曜，卯宫太阳天梁、亥宫太阴合照（明珠出海）',
      `三方四正吉加会：${jiGroups.join('、')}`,
    ]
    if (hasSha) reasons.push('见煞曜/空劫，格局减等')
    else reasons.push('未见四煞空劫冲破')

    return { ok: true, score, reasons }
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
    禄合鸳鸯格: '双禄重逢格',
    蟾宫折桂格: '明珠出海格',
    // 日月夹财格自有规则，勿再映射到日月同临
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
    const lib =
      ENTRIES.find((e) => e.name === hits[i].name) ||
      ENTRIES.find((e) => resolveRuleKey(e.name) === hits[i].name)
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
  if (
    /火铃夹命|羊陀夹|空劫|刑忌夹|刑囚|反背|冲破|桃花|风流|四煞|泛水|马落空|文星遇夹|巨逢四煞|巨机化酉|两重华盖/.test(
      name,
    )
  )
    return '凶格'
  if (
    /嘉会|朝垣|隐玉|同宫|入庙|佩印|交驰|居午|居子|同梁|拱命|暗拱|昌曲夹|左右夹|紫府夹|魁钺夹|权禄夹|日月夹财|双禄|禄合|日照雷门|日丽|水澄|清白|石中|武曲入庙|辅弼|辅拱|坐贵|禄马|明珠|蟾宫|折桂/.test(
      name,
    )
  )
    return '吉格'
  if (/煞|刑|忌|空|反背|冲破|桃花|风流|四煞|泛水/.test(name)) return '凶格'
  return 'unknown'
}

export function gejuStats() {
  return {
    total: ENTRIES.length,
    strictRules: Object.keys(STRICT_RULES).length,
  }
}
