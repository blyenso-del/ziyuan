/**
 * 八字流年：公历年干支、十神、与原局刑冲合害、落大运、简析
 * 年柱按「立春换年」的简化：以公历年近似（未精算立春时刻，仅供参考）
 */
import type {
  BaziView,
  Branch,
  DayunItem,
  HiddenStem,
  RelationItem,
  Stem,
  WuXing,
} from './bazi'
import { getChangSheng, getShiShen } from './bazi'

const STEMS: Stem[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸']
const BRANCHES: Branch[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥']

const STEM_WX: Record<Stem, WuXing> = {
  甲: '木',
  乙: '木',
  丙: '火',
  丁: '火',
  戊: '土',
  己: '土',
  庚: '金',
  辛: '金',
  壬: '水',
  癸: '水',
}

const STEM_YY: Record<Stem, '阳' | '阴'> = {
  甲: '阳',
  乙: '阴',
  丙: '阳',
  丁: '阴',
  戊: '阳',
  己: '阴',
  庚: '阳',
  辛: '阴',
  壬: '阳',
  癸: '阴',
}

const BRANCH_WX: Record<Branch, WuXing> = {
  子: '水',
  丑: '土',
  寅: '木',
  卯: '木',
  辰: '土',
  巳: '火',
  午: '火',
  未: '土',
  申: '金',
  酉: '金',
  戌: '土',
  亥: '水',
}

const HIDDEN: Record<Branch, Stem[]> = {
  子: ['癸'],
  丑: ['己', '癸', '辛'],
  寅: ['甲', '丙', '戊'],
  卯: ['乙'],
  辰: ['戊', '乙', '癸'],
  巳: ['丙', '庚', '戊'],
  午: ['丁', '己'],
  未: ['己', '丁', '乙'],
  申: ['庚', '壬', '戊'],
  酉: ['辛'],
  戌: ['戊', '辛', '丁'],
  亥: ['壬', '甲'],
}

const NAYIN: Record<string, string> = {
  甲子: '海中金',
  乙丑: '海中金',
  丙寅: '炉中火',
  丁卯: '炉中火',
  戊辰: '大林木',
  己巳: '大林木',
  庚午: '路旁土',
  辛未: '路旁土',
  壬申: '剑锋金',
  癸酉: '剑锋金',
  甲戌: '山头火',
  乙亥: '山头火',
  丙子: '涧下水',
  丁丑: '涧下水',
  戊寅: '城头土',
  己卯: '城头土',
  庚辰: '白蜡金',
  辛巳: '白蜡金',
  壬午: '杨柳木',
  癸未: '杨柳木',
  甲申: '泉中水',
  乙酉: '泉中水',
  丙戌: '屋上土',
  丁亥: '屋上土',
  戊子: '霹雳火',
  己丑: '霹雳火',
  庚寅: '松柏木',
  辛卯: '松柏木',
  壬辰: '长流水',
  癸巳: '长流水',
  甲午: '沙中金',
  乙未: '沙中金',
  丙申: '山下火',
  丁酉: '山下火',
  戊戌: '平地木',
  己亥: '平地木',
  庚子: '壁上土',
  辛丑: '壁上土',
  壬寅: '金箔金',
  癸卯: '金箔金',
  甲辰: '覆灯火',
  乙巳: '覆灯火',
  丙午: '天河水',
  丁未: '天河水',
  戊申: '大驿土',
  己酉: '大驿土',
  庚戌: '钗钏金',
  辛亥: '钗钏金',
  壬子: '桑柘木',
  癸丑: '桑柘木',
  甲寅: '大溪水',
  乙卯: '大溪水',
  丙辰: '沙中土',
  丁巳: '沙中土',
  戊午: '天上火',
  己未: '天上火',
  庚申: '石榴木',
  辛酉: '石榴木',
  壬戌: '大海水',
  癸亥: '大海水',
}

const LIU_HE: [Branch, Branch][] = [
  ['子', '丑'],
  ['寅', '亥'],
  ['卯', '戌'],
  ['辰', '酉'],
  ['巳', '申'],
  ['午', '未'],
]

const LIU_CHONG: [Branch, Branch][] = [
  ['子', '午'],
  ['丑', '未'],
  ['寅', '申'],
  ['卯', '酉'],
  ['辰', '戌'],
  ['巳', '亥'],
]

const LIU_HAI: [Branch, Branch][] = [
  ['子', '未'],
  ['丑', '午'],
  ['寅', '巳'],
  ['卯', '辰'],
  ['申', '亥'],
  ['酉', '戌'],
]

const LIU_PO: [Branch, Branch][] = [
  ['子', '酉'],
  ['丑', '辰'],
  ['寅', '亥'],
  ['卯', '午'],
  ['巳', '申'],
  ['未', '戌'],
]

const SAN_HE: Branch[][] = [
  ['申', '子', '辰'],
  ['寅', '午', '戌'],
  ['巳', '酉', '丑'],
  ['亥', '卯', '未'],
]

const SAN_XING: string[][] = [
  ['寅', '巳', '申'],
  ['丑', '戌', '未'],
  ['子', '卯'],
]

const GAN_HE: [Stem, Stem, string][] = [
  ['甲', '己', '合土'],
  ['乙', '庚', '合金'],
  ['丙', '辛', '合水'],
  ['丁', '壬', '合木'],
  ['戊', '癸', '合火'],
]

const SHI_SHEN_HINT: Record<string, string> = {
  比肩: '比肩流年，自立、竞争与同辈互动增多，宜守正业、防争财。',
  劫财: '劫财流年，变动与争夺感较强，理财宜稳健，合作先定权责。',
  食神: '食神流年，表达、技艺与口福较顺，利创作输出与享受生活。',
  伤官: '伤官流年，才华外露、求变心强，亦主口舌是非，宜慎言。',
  偏财: '偏财流年，偏财机遇与应酬增多，宜把握机会也防投机。',
  正财: '正财流年，正财与务实收益较显，宜守本职、稳理财。',
  七杀: '七杀流年，压力、挑战与权威议题突出，宜迎难而上亦防过刚。',
  正官: '正官流年，责任、职场与规矩感增强，利升迁考试，忌犯官非。',
  偏印: '偏印流年，思路独特、偏门学问或精神压力，宜专注不宜多疑。',
  正印: '正印流年，贵人、学习与文书运较好，利进修考试与靠山。',
}

export type LiunianView = {
  year: number
  stem: Stem
  branch: Branch
  stemWx: WuXing
  branchWx: WuXing
  stemYy: '阳' | '阴'
  nayin: string
  stemShiShen: string
  changSheng: string
  hidden: HiddenStem[]
  label: string
  /** 虚岁（公历年 − 出生年 + 1） */
  age: number
  dayun: DayunItem | null
  relations: RelationItem[]
  analysis: {
    summary: string
    paragraphs: string[]
    bullets: string[]
  }
}

function pairMatch(a: Branch, b: Branch, pairs: [Branch, Branch][]): boolean {
  return pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))
}

/** 公历年 → 年柱干支（甲子 = 公元 4 年） */
export function yearToGanZhi(year: number): { stem: Stem; branch: Branch } {
  const n = ((year - 4) % 60 + 60) % 60
  return {
    stem: STEMS[n % 10],
    branch: BRANCHES[n % 12],
  }
}

export function parseBirthYear(solarDate: string): number | null {
  const m = solarDate.match(/(\d{4})/)
  return m ? Number(m[1]) : null
}

/** 流年干支相对原局的刑冲合害 */
export function relationsVsNatal(
  stem: Stem,
  branch: Branch,
  bazi: BaziView,
): RelationItem[] {
  const items: RelationItem[] = []
  const lab0 = `流年${stem}`

  for (const p of bazi.pillars) {
    for (const [a, b, name] of GAN_HE) {
      if ((stem === a && p.stem === b) || (stem === b && p.stem === a)) {
        items.push({
          type: '天干合',
          detail: `${lab0}与${p.label}${p.stem}${name}`,
        })
      }
    }
  }

  for (const p of bazi.pillars) {
    const lab = `流年${branch}与${p.label}${p.branch}`
    if (pairMatch(branch, p.branch, LIU_HE)) {
      items.push({ type: '六合', detail: `${lab}六合` })
    }
    if (pairMatch(branch, p.branch, LIU_CHONG)) {
      items.push({ type: '六冲', detail: `${lab}相冲` })
    }
    if (pairMatch(branch, p.branch, LIU_HAI)) {
      items.push({ type: '六害', detail: `${lab}相害` })
    }
    if (pairMatch(branch, p.branch, LIU_PO)) {
      items.push({ type: '相破', detail: `${lab}相破` })
    }
    if (branch === p.branch && (['辰', '午', '酉', '亥'] as Branch[]).includes(branch)) {
      items.push({ type: '自刑', detail: `流年${branch}与${p.label}自刑` })
    }
  }

  // 三刑：流年支 + 原局是否凑刑组
  const natalBr = bazi.pillars.map((p) => p.branch)
  for (const g of SAN_XING) {
    if (!g.includes(branch)) continue
    const others = g.filter((x) => x !== branch) as Branch[]
    const hits = others.filter((b) => natalBr.includes(b))
    if (g.length === 2 && hits.length >= 1) {
      items.push({
        type: '相刑',
        detail: `流年${branch}与原局见${g.join('')}相刑`,
      })
    } else if (g.length === 3 && hits.length >= 1) {
      const names = bazi.pillars
        .filter((p) => g.includes(p.branch))
        .map((p) => `${p.label}${p.branch}`)
      items.push({
        type: '相刑',
        detail: `流年${branch}与${names.join('、')}见${g.join('')}刑`,
      })
    }
  }

  // 三合/半合：流年支 + 原局
  const all = [branch, ...natalBr]
  const set = new Set(all)
  for (const g of SAN_HE) {
    if (!g.includes(branch)) continue
    const hit = g.filter((b) => set.has(b))
    if (hit.length >= 2) {
      items.push({
        type: '三合',
        detail: `流年${branch}与原局成${hit.join('')}${hit.length === 3 ? '三合' : '半合'}`,
      })
    }
  }

  // 流年冲日支特别标一下（已在循环中，此处不重复）
  return items
}

function matchDayun(bazi: BaziView, age: number): DayunItem | null {
  return bazi.dayun.find((d) => age >= d.ageFrom && age <= d.ageTo) ?? null
}

function buildAnalysis(
  bazi: BaziView,
  year: number,
  stem: Stem,
  branch: Branch,
  stemShiShen: string,
  changSheng: string,
  nayin: string,
  age: number,
  dayun: DayunItem | null,
  relations: RelationItem[],
): LiunianView['analysis'] {
  const paragraphs: string[] = []
  const bullets: string[] = []

  paragraphs.push(
    `${year}年流年${stem}${branch}（纳音${nayin}），虚岁约${age}岁。流年干对日主${bazi.dayMaster}为「${stemShiShen}」，日主坐流年支十二长生「${changSheng}」。`,
  )

  if (SHI_SHEN_HINT[stemShiShen]) {
    paragraphs.push(SHI_SHEN_HINT[stemShiShen])
  }

  if (dayun) {
    paragraphs.push(
      `当前落在第${dayun.index}步大运${dayun.label}（约${dayun.ageFrom}–${dayun.ageTo}岁，纳音${dayun.nayin}），宜运岁并看。`,
    )
    // 流年与大运干支关系
    if (stem === dayun.stem) {
      bullets.push(`流年干与大运干同为${stem}，该十神主题被强化。`)
    }
    if (branch === dayun.branch) {
      bullets.push(`流年支与大运支同为${branch}，地支气场叠加强调。`)
    }
    if (pairMatch(branch, dayun.branch, LIU_CHONG)) {
      bullets.push(`流年${branch}冲大运${dayun.branch}：运岁相冲，变动幅度常较大。`)
    }
    if (pairMatch(branch, dayun.branch, LIU_HE)) {
      bullets.push(`流年${branch}合大运${dayun.branch}：运岁相合，人事牵绊与合作议题增多。`)
    }
  } else {
    paragraphs.push('当前虚岁尚未进入列出的大运区间（或已超出示意八步），以流年与原局为主。')
  }

  const chong = relations.filter((r) => r.type === '六冲')
  const he = relations.filter((r) => r.type === '六合' || r.type === '天干合')
  const xing = relations.filter((r) => r.type.includes('刑'))
  const hai = relations.filter((r) => r.type === '六害' || r.type === '相破')

  if (chong.length) {
    bullets.push(...chong.map((r) => `${r.detail}：主迁移、冲突、破旧立新。`))
  }
  if (he.length) {
    bullets.push(...he.slice(0, 4).map((r) => `${r.detail}：主牵绊、合作与牵制。`))
  }
  if (xing.length) {
    bullets.push(...xing.slice(0, 3).map((r) => `${r.detail}：主不顺、内耗，宜谨慎决策。`))
  }
  if (hai.length) {
    bullets.push(...hai.slice(0, 3).map((r) => `${r.detail}：主暗损或计划易变。`))
  }

  // 流年冲年/月/日/时
  const dayBr = bazi.pillars[2]?.branch
  const yearBr = bazi.pillars[0]?.branch
  if (dayBr && pairMatch(branch, dayBr, LIU_CHONG)) {
    bullets.push('流年冲日支（配偶宫/内心）：感情、居住或身心节奏易有波动。')
  }
  if (yearBr && pairMatch(branch, yearBr, LIU_CHONG)) {
    bullets.push('流年冲年支：长辈缘或外部环境变动较显。')
  }

  // 喜忌极简：看十神是否偏生扶/克泄
  const weak =
    bazi.deLing.includes('受克') ||
    bazi.deLing.includes('泄气') ||
    bazi.strengthHint.includes('偏弱')
  const strong = bazi.strengthHint.includes('偏强') || bazi.deLing.startsWith('得令')
  const supportSs = ['比肩', '劫财', '正印', '偏印']
  const drainSs = ['食神', '伤官', '正财', '偏财', '正官', '七杀']
  if (weak && supportSs.includes(stemShiShen)) {
    bullets.push('流年十神偏生扶，对偏弱日主相对有情（示意）。')
  } else if (weak && drainSs.includes(stemShiShen)) {
    bullets.push('流年十神偏克泄耗，身弱者宜稳守、少开新局（示意）。')
  } else if (strong && drainSs.includes(stemShiShen)) {
    bullets.push('流年十神偏克泄耗，对偏强日主有流通之象（示意）。')
  } else if (strong && supportSs.includes(stemShiShen)) {
    bullets.push('流年十神再生扶，身旺者防过刚、宜疏导（示意）。')
  }

  if (!bullets.length) {
    bullets.push('流年与原局未见强烈刑冲，整体以十神主题平稳推进为主。')
  }

  const summary = `${year} · ${stem}${branch} · ${stemShiShen}${dayun ? ` · 大运${dayun.label}` : ''}`

  return { summary, paragraphs, bullets }
}

export function buildLiunian(bazi: BaziView, year: number): LiunianView {
  const { stem, branch } = yearToGanZhi(year)
  const birthYear = parseBirthYear(bazi.solarDate)
  const age = birthYear ? year - birthYear + 1 : 0
  const stemShiShen = getShiShen(bazi.dayMaster, stem)
  const changSheng = getChangSheng(bazi.dayMaster, branch)
  const hidden: HiddenStem[] = HIDDEN[branch].map((hs) => ({
    stem: hs,
    wuxing: STEM_WX[hs],
    yinYang: STEM_YY[hs],
    shiShen: getShiShen(bazi.dayMaster, hs),
  }))
  const nayin = NAYIN[`${stem}${branch}`] || '—'
  const dayun = age > 0 ? matchDayun(bazi, age) : null
  const relations = relationsVsNatal(stem, branch, bazi)
  const analysis = buildAnalysis(
    bazi,
    year,
    stem,
    branch,
    stemShiShen,
    changSheng,
    nayin,
    age,
    dayun,
    relations,
  )

  return {
    year,
    stem,
    branch,
    stemWx: STEM_WX[stem],
    branchWx: BRANCH_WX[branch],
    stemYy: STEM_YY[stem],
    nayin,
    stemShiShen,
    changSheng,
    hidden,
    label: `${stem}${branch}`,
    age,
    dayun,
    relations,
    analysis,
  }
}

/** 连续多年流年简表（不含完整 analysis 可仍调用 buildLiunian） */
export function buildLiunianRange(
  bazi: BaziView,
  yearFrom: number,
  yearTo: number,
): LiunianView[] {
  const from = Math.min(yearFrom, yearTo)
  const to = Math.max(yearFrom, yearTo)
  const list: LiunianView[] = []
  for (let y = from; y <= to; y++) {
    list.push(buildLiunian(bazi, y))
  }
  return list
}
