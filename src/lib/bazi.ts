/** 八字排盘：四柱、藏干、十神、五行、纳音、空亡、神煞、刑冲合害、十二长生、大运等 */

export type Stem = '甲' | '乙' | '丙' | '丁' | '戊' | '己' | '庚' | '辛' | '壬' | '癸'
export type Branch =
  | '子'
  | '丑'
  | '寅'
  | '卯'
  | '辰'
  | '巳'
  | '午'
  | '未'
  | '申'
  | '酉'
  | '戌'
  | '亥'
export type WuXing = '木' | '火' | '土' | '金' | '水'
export type YinYang = '阳' | '阴'

export type HiddenStem = {
  stem: Stem
  wuxing: WuXing
  yinYang: YinYang
  shiShen: string
}

export type PillarView = {
  label: string
  stem: Stem
  branch: Branch
  stemWx: WuXing
  branchWx: WuXing
  stemYy: YinYang
  branchYy: YinYang
  nayin: string
  hidden: HiddenStem[]
  stemShiShen: string
  /** 日主在该地支的十二长生 */
  changSheng: string
  /** 是否日主禄/刃所在 */
  isLu: boolean
  isYangRen: boolean
}

export type ShenShaItem = {
  name: string
  /** 落在何支或何柱 */
  at: string
  note?: string
}

export type RelationItem = {
  type: string
  detail: string
}

export type DayunItem = {
  index: number
  stem: Stem
  branch: Branch
  stemWx: WuXing
  nayin: string
  /** 起运虚岁区间展示 */
  ageFrom: number
  ageTo: number
  label: string
}

export type BaziView = {
  gender: string
  solarDate: string
  lunarDate: string
  timeLabel: string
  dayMaster: Stem
  dayMasterWx: WuXing
  dayMasterYy: YinYang
  pillars: PillarView[]
  fullText: string
  kongWang: string[]
  wuxingCount: Record<WuXing, number>
  wuxingCountSimple: Record<WuXing, number>
  /** 十神统计（含藏干） */
  shiShenCount: Record<string, number>
  /** 日主禄、羊刃所在地支 */
  luBranch: Branch
  yangRenBranch: Branch
  /** 胎元、命宫、身宫 */
  taiYuan: string
  mingGong: string
  shenGong: string
  /** 神煞列表 */
  shenSha: ShenShaItem[]
  /** 刑冲合害等 */
  relations: RelationItem[]
  /** 大运（简化起运岁数） */
  dayunDir: '顺' | '逆'
  dayunNote: string
  dayun: DayunItem[]
  /** 日主得令简评 */
  deLing: string
  strengthHint: string
}

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

const STEM_YY: Record<Stem, YinYang> = {
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

const BRANCH_YY: Record<Branch, YinYang> = {
  子: '阳',
  丑: '阴',
  寅: '阳',
  卯: '阴',
  辰: '阳',
  巳: '阴',
  午: '阳',
  未: '阴',
  申: '阳',
  酉: '阴',
  戌: '阳',
  亥: '阴',
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
  甲午: '砂中金',
  乙未: '砂中金',
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

const KONG_WANG: [string[], string[]][] = [
  [['甲子', '乙丑', '丙寅', '丁卯', '戊辰', '己巳', '庚午', '辛未', '壬申', '癸酉'], ['戌', '亥']],
  [['甲戌', '乙亥', '丙子', '丁丑', '戊寅', '己卯', '庚辰', '辛巳', '壬午', '癸未'], ['申', '酉']],
  [['甲申', '乙酉', '丙戌', '丁亥', '戊子', '己丑', '庚寅', '辛卯', '壬辰', '癸巳'], ['午', '未']],
  [['甲午', '乙未', '丙申', '丁酉', '戊戌', '己亥', '庚子', '辛丑', '壬寅', '癸卯'], ['辰', '巳']],
  [['甲辰', '乙巳', '丙午', '丁未', '戊申', '己酉', '庚戌', '辛亥', '壬子', '癸丑'], ['寅', '卯']],
  [['甲寅', '乙卯', '丙辰', '丁巳', '戊午', '己未', '庚申', '辛酉', '壬戌', '癸亥'], ['子', '丑']],
]

const SHENG: Record<WuXing, WuXing> = {
  木: '火',
  火: '土',
  土: '金',
  金: '水',
  水: '木',
}
const KE: Record<WuXing, WuXing> = {
  木: '土',
  火: '金',
  土: '水',
  金: '木',
  水: '火',
}

/** 十二长生：日干在十二支的起点（长生位），阳干顺、阴干逆 */
const CHANG_SHENG_START: Record<Stem, Branch> = {
  甲: '亥',
  乙: '午',
  丙: '寅',
  丁: '酉',
  戊: '寅',
  己: '酉',
  庚: '巳',
  辛: '子',
  壬: '申',
  癸: '卯',
}

const CHANG_SHENG_NAMES = [
  '长生',
  '沐浴',
  '冠带',
  '临官',
  '帝旺',
  '衰',
  '病',
  '死',
  '墓',
  '绝',
  '胎',
  '养',
] as const

/** 日主建禄（临官） */
const LU: Record<Stem, Branch> = {
  甲: '寅',
  乙: '卯',
  丙: '巳',
  丁: '午',
  戊: '巳',
  己: '午',
  庚: '申',
  辛: '酉',
  壬: '亥',
  癸: '子',
}

/** 羊刃 */
const YANG_REN: Record<Stem, Branch> = {
  甲: '卯',
  乙: '寅',
  丙: '午',
  丁: '巳',
  戊: '午',
  己: '巳',
  庚: '酉',
  辛: '申',
  壬: '子',
  癸: '亥',
}

/** 天乙贵人（日干） */
const TIAN_YI: Record<Stem, Branch[]> = {
  甲: ['丑', '未'],
  戊: ['丑', '未'],
  乙: ['子', '申'],
  己: ['子', '申'],
  丙: ['亥', '酉'],
  丁: ['亥', '酉'],
  庚: ['午', '寅'],
  辛: ['午', '寅'],
  壬: ['卯', '巳'],
  癸: ['卯', '巳'],
}

/** 文昌 */
const WEN_CHANG: Record<Stem, Branch> = {
  甲: '巳',
  乙: '午',
  丙: '申',
  丁: '酉',
  戊: '申',
  己: '酉',
  庚: '亥',
  辛: '子',
  壬: '寅',
  癸: '卯',
}

/** 太极贵人 */
const TAI_JI: Record<Stem, Branch[]> = {
  甲: ['子', '午'],
  乙: ['子', '午'],
  丙: ['卯', '酉'],
  丁: ['卯', '酉'],
  戊: ['辰', '戌', '丑', '未'],
  己: ['辰', '戌', '丑', '未'],
  庚: ['寅', '亥'],
  辛: ['寅', '亥'],
  壬: ['巳', '申'],
  癸: ['巳', '申'],
}

/** 月德贵人：月支 -> 天干 */
const YUE_DE: Record<Branch, Stem> = {
  寅: '丙',
  午: '丙',
  戌: '丙',
  申: '壬',
  子: '壬',
  辰: '壬',
  亥: '甲',
  卯: '甲',
  未: '甲',
  巳: '庚',
  酉: '庚',
  丑: '庚',
}

/** 天德：月支 -> 天干或地支字 */
const TIAN_DE: Record<Branch, string> = {
  寅: '丁',
  卯: '申',
  辰: '壬',
  巳: '辛',
  午: '亥',
  未: '甲',
  申: '癸',
  酉: '寅',
  戌: '丙',
  亥: '乙',
  子: '巳',
  丑: '庚',
}

const SAN_HE: Branch[][] = [
  ['申', '子', '辰'],
  ['寅', '午', '戌'],
  ['巳', '酉', '丑'],
  ['亥', '卯', '未'],
]

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

export function getShiShen(dayMaster: Stem, other: Stem): string {
  if (dayMaster === other) return '比肩'
  const dmWx = STEM_WX[dayMaster]
  const oWx = STEM_WX[other]
  const sameYy = STEM_YY[dayMaster] === STEM_YY[other]

  if (dmWx === oWx) return sameYy ? '比肩' : '劫财'
  if (SHENG[dmWx] === oWx) return sameYy ? '食神' : '伤官'
  if (KE[dmWx] === oWx) return sameYy ? '偏财' : '正财'
  if (KE[oWx] === dmWx) return sameYy ? '七杀' : '正官'
  if (SHENG[oWx] === dmWx) return sameYy ? '偏印' : '正印'
  return '—'
}

function asStem(s: string): Stem {
  const t = s.match(/[甲乙丙丁戊己庚辛壬癸]/)?.[0] as Stem | undefined
  if (!t || !STEMS.includes(t)) throw new Error(`无效天干: ${s}`)
  return t
}

function asBranch(s: string): Branch {
  const t = s.match(/[子丑寅卯辰巳午未申酉戌亥]/)?.[0] as Branch | undefined
  if (!t || !BRANCHES.includes(t)) throw new Error(`无效地支: ${s}`)
  return t
}

function emptyCount(): Record<WuXing, number> {
  return { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 }
}

function bi(b: Branch): number {
  return BRANCHES.indexOf(b)
}

function si(s: Stem): number {
  return STEMS.indexOf(s)
}

function shiftStem(s: Stem, delta: number): Stem {
  return STEMS[(si(s) + delta + 100) % 10]
}

function shiftBranch(b: Branch, delta: number): Branch {
  return BRANCHES[(bi(b) + delta + 120) % 12]
}

/** 日干在支上的十二长生 */
export function getChangSheng(dayMaster: Stem, branch: Branch): string {
  const start = CHANG_SHENG_START[dayMaster]
  const startIdx = bi(start)
  const brIdx = bi(branch)
  const yang = STEM_YY[dayMaster] === '阳'
  const offset = yang ? (brIdx - startIdx + 12) % 12 : (startIdx - brIdx + 12) % 12
  return CHANG_SHENG_NAMES[offset]
}

function pairMatch(a: Branch, b: Branch, pairs: [Branch, Branch][]): boolean {
  return pairs.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  )
}

function findSanHe(branches: Branch[]): string[] {
  const set = new Set(branches)
  const out: string[] = []
  for (const g of SAN_HE) {
    const hit = g.filter((b) => set.has(b))
    if (hit.length >= 2) out.push(`${hit.join('')}${hit.length === 3 ? '三合' : '半合'}局`)
  }
  return out
}

function buildRelations(pillars: PillarView[]): RelationItem[] {
  const items: RelationItem[] = []
  const labels = pillars.map((p) => p.label)
  const stems = pillars.map((p) => p.stem)
  const branches = pillars.map((p) => p.branch)

  // 天干五合
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      for (const [a, b, name] of GAN_HE) {
        if (
          (stems[i] === a && stems[j] === b) ||
          (stems[i] === b && stems[j] === a)
        ) {
          items.push({
            type: '天干合',
            detail: `${labels[i]}${stems[i]}与${labels[j]}${stems[j]}${name}`,
          })
        }
      }
    }
  }

  // 地支关系
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 4; j++) {
      const A = branches[i]
      const B = branches[j]
      const lab = `${labels[i]}${A}与${labels[j]}${B}`
      if (pairMatch(A, B, LIU_HE)) items.push({ type: '六合', detail: `${lab}六合` })
      if (pairMatch(A, B, LIU_CHONG)) items.push({ type: '六冲', detail: `${lab}相冲` })
      if (pairMatch(A, B, LIU_HAI)) items.push({ type: '六害', detail: `${lab}相害` })
      if (pairMatch(A, B, LIU_PO)) items.push({ type: '相破', detail: `${lab}相破` })
    }
  }

  for (const g of SAN_XING) {
    const hitIdx = branches
      .map((b, i) => (g.includes(b) ? i : -1))
      .filter((i) => i >= 0)
    const uniq = [...new Set(hitIdx.map((i) => branches[i]))]
    if (g.length === 2 && uniq.length === 2 && g.every((x) => uniq.includes(x as Branch))) {
      items.push({
        type: '相刑',
        detail: `${uniq.join('')}相刑（无礼之刑）`,
      })
    } else if (uniq.length >= 2 && g.length === 3) {
      const names = hitIdx.map((i) => `${labels[i]}${branches[i]}`)
      items.push({
        type: '相刑',
        detail: `${names.join('、')}见${g.join('')}刑`,
      })
    }
  }

  // 自刑
  const ziXing: Branch[] = ['辰', '午', '酉', '亥']
  const cnt: Partial<Record<Branch, number>> = {}
  for (const b of branches) cnt[b] = (cnt[b] || 0) + 1
  for (const b of ziXing) {
    if ((cnt[b] || 0) >= 2) items.push({ type: '自刑', detail: `${b}${b}自刑` })
  }

  for (const s of findSanHe(branches)) {
    items.push({ type: '三合', detail: s })
  }

  // 地支相刑补：寅巳申等已在上面

  if (!items.length) items.push({ type: '—', detail: '四柱未见明显刑冲合害（仅列常见关系）' })
  return items
}

function buildShenSha(
  day: Stem,
  yearBr: Branch,
  monthBr: Branch,
  dayBr: Branch,
  hourBr: Branch,
  stems: Stem[],
  branches: Branch[],
): ShenShaItem[] {
  const list: ShenShaItem[] = []
  const allBr = [
    { lab: '年', b: yearBr },
    { lab: '月', b: monthBr },
    { lab: '日', b: dayBr },
    { lab: '时', b: hourBr },
  ]

  const pushIf = (name: string, targets: Branch[], note?: string) => {
    for (const { lab, b } of allBr) {
      if (targets.includes(b)) list.push({ name, at: `${lab}支${b}`, note })
    }
  }

  pushIf('天乙贵人', TIAN_YI[day])
  pushIf('文昌', [WEN_CHANG[day]])
  pushIf('太极贵人', TAI_JI[day])

  // 桃花：以年支或日支三合局
  const taoGroups: Record<string, Branch> = {
    申: '酉',
    子: '酉',
    辰: '酉',
    寅: '卯',
    午: '卯',
    戌: '卯',
    巳: '午',
    酉: '午',
    丑: '午',
    亥: '子',
    卯: '子',
    未: '子',
  }
  for (const base of [yearBr, dayBr]) {
    const tao = taoGroups[base]
    if (tao) pushIf('桃花', [tao], `以${base}支论`)
  }

  const maGroups: Record<string, Branch> = {
    申: '寅',
    子: '寅',
    辰: '寅',
    寅: '申',
    午: '申',
    戌: '申',
    巳: '亥',
    酉: '亥',
    丑: '亥',
    亥: '巳',
    卯: '巳',
    未: '巳',
  }
  for (const base of [yearBr, dayBr]) {
    const ma = maGroups[base]
    if (ma) pushIf('驿马', [ma], `以${base}支论`)
  }

  const huaGroups: Record<string, Branch> = {
    申: '辰',
    子: '辰',
    辰: '辰',
    寅: '戌',
    午: '戌',
    戌: '戌',
    巳: '丑',
    酉: '丑',
    丑: '丑',
    亥: '未',
    卯: '未',
    未: '未',
  }
  for (const base of [yearBr, dayBr]) {
    const hg = huaGroups[base]
    if (hg) pushIf('华盖', [hg], `以${base}支论`)
  }

  const jiang: Record<string, Branch> = {
    申: '子',
    子: '子',
    辰: '子',
    寅: '午',
    午: '午',
    戌: '午',
    巳: '酉',
    酉: '酉',
    丑: '酉',
    亥: '卯',
    卯: '卯',
    未: '卯',
  }
  pushIf('将星', [jiang[dayBr]], '以日支论')

  const jieSha: Record<string, Branch> = {
    申: '巳',
    子: '巳',
    辰: '巳',
    寅: '亥',
    午: '亥',
    戌: '亥',
    巳: '寅',
    酉: '寅',
    丑: '寅',
    亥: '申',
    卯: '申',
    未: '申',
  }
  pushIf('劫煞', [jieSha[dayBr]], '以日支论')

  // 月德：月支见对应天干
  const yd = YUE_DE[monthBr]
  stems.forEach((s, i) => {
    if (s === yd) {
      const lab = ['年', '月', '日', '时'][i]
      list.push({ name: '月德贵人', at: `${lab}干${s}` })
    }
  })

  // 天德
  const td = TIAN_DE[monthBr]
  if (STEMS.includes(td as Stem)) {
    stems.forEach((s, i) => {
      if (s === td) {
        list.push({ name: '天德贵人', at: `${['年', '月', '日', '时'][i]}干${s}` })
      }
    })
  } else if (BRANCHES.includes(td as Branch)) {
    branches.forEach((b, i) => {
      if (b === td) {
        list.push({ name: '天德贵人', at: `${['年', '月', '日', '时'][i]}支${b}` })
      }
    })
  }

  // 禄、羊刃
  if (branches.includes(LU[day])) {
    const i = branches.indexOf(LU[day])
    list.push({ name: '禄神', at: `${['年', '月', '日', '时'][i]}支${LU[day]}` })
  }
  if (branches.includes(YANG_REN[day])) {
    const i = branches.indexOf(YANG_REN[day])
    list.push({ name: '羊刃', at: `${['年', '月', '日', '时'][i]}支${YANG_REN[day]}` })
  }

  // 去重
  const seen = new Set<string>()
  return list.filter((x) => {
    const k = `${x.name}-${x.at}`
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

/** 五虎遁：年干起正月寅月天干 */
function wuHuDun(yearStem: Stem): Stem {
  // 甲己之年丙作首，乙庚之岁戊为头，丙辛之年寻庚起，丁壬壬位顺行流，若问戊癸何方发，甲寅之上好追求
  const map: Record<Stem, Stem> = {
    甲: '丙',
    己: '丙',
    乙: '戊',
    庚: '戊',
    丙: '庚',
    辛: '庚',
    丁: '壬',
    壬: '壬',
    戊: '甲',
    癸: '甲',
  }
  return map[yearStem]
}

function buildMingShenGong(
  yearStem: Stem,
  monthBr: Branch,
  hourBr: Branch,
): { mingGong: string; shenGong: string } {
  // 寅=1 … 丑=12
  const toNum = (b: Branch) => {
    const order: Branch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
    return order.indexOf(b) + 1
  }
  const fromNum = (n: number): Branch => {
    let x = n % 12
    if (x <= 0) x += 12
    const order: Branch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
    return order[x - 1]
  }

  const m = toNum(monthBr)
  const h = toNum(hourBr)
  let mingN = 14 - m - h
  while (mingN <= 0) mingN += 12
  while (mingN > 12) mingN -= 12
  let shenN = m + h - 2
  while (shenN <= 0) shenN += 12
  while (shenN > 12) shenN -= 12

  const mingBr = fromNum(mingN)
  const shenBr = fromNum(shenN)

  // 命宫天干：五虎遁 + 从寅起的偏移
  const yinStem = wuHuDun(yearStem)
  const order: Branch[] = ['寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥', '子', '丑']
  const mingStem = shiftStem(yinStem, order.indexOf(mingBr))
  const shenStem = shiftStem(yinStem, order.indexOf(shenBr))

  return {
    mingGong: `${mingStem}${mingBr}`,
    shenGong: `${shenStem}${shenBr}`,
  }
}

function buildDayun(
  gender: string,
  yearStem: Stem,
  monthStem: Stem,
  monthBranch: Branch,
): { dir: '顺' | '逆'; note: string; list: DayunItem[] } {
  const yearYang = STEM_YY[yearStem] === '阳'
  const male = gender.includes('男')
  // 阳男阴女顺，阴男阳女逆
  const forward = (yearYang && male) || (!yearYang && !male)
  const dir: '顺' | '逆' = forward ? '顺' : '逆'
  const note = forward
    ? '年干与性别为阳男/阴女，大运顺行（月柱之后）'
    : '年干与性别为阴男/阳女，大运逆行（月柱之前）'
  // 起运岁数简化：未排节气，按常见 3 岁起展示（仅作示意）
  const startAge = 3
  const list: DayunItem[] = []
  for (let i = 0; i < 8; i++) {
    const delta = forward ? i + 1 : -(i + 1)
    const st = shiftStem(monthStem, delta)
    const br = shiftBranch(monthBranch, delta)
    const ageFrom = startAge + i * 10
    const ageTo = ageFrom + 9
    list.push({
      index: i + 1,
      stem: st,
      branch: br,
      stemWx: STEM_WX[st],
      nayin: NAYIN[`${st}${br}`] || '—',
      ageFrom,
      ageTo,
      label: `${st}${br}`,
    })
  }
  return { dir, note: note + `；起运约${startAge}岁起（未按出生节气精算，仅供参考）`, list }
}

/** 月令当令五行：寅卯木、巳午火… */
function monthLingWx(monthBr: Branch): WuXing {
  return BRANCH_WX[monthBr]
}

export type RawPillars = {
  yearly: [string, string]
  monthly: [string, string]
  daily: [string, string]
  hourly: [string, string]
}

export function buildBaziFromRaw(
  raw: RawPillars,
  meta: { gender: string; solarDate: string; lunarDate: string; timeLabel: string },
): BaziView {
  const labels = ['年柱', '月柱', '日柱', '时柱'] as const
  const pairs: [string, string][] = [raw.yearly, raw.monthly, raw.daily, raw.hourly]

  const dayStem = asStem(raw.daily[0])
  const dayBranch = asBranch(raw.daily[1])
  const dayKey = `${dayStem}${dayBranch}`

  let kongWang: string[] = ['—', '—']
  for (const [list, kw] of KONG_WANG) {
    if (list.includes(dayKey)) {
      kongWang = kw
      break
    }
  }

  const luBranch = LU[dayStem]
  const yangRenBranch = YANG_REN[dayStem]

  const pillars: PillarView[] = pairs.map(([st, br], i) => {
    const stem = asStem(st)
    const branch = asBranch(br)
    const hidden = HIDDEN[branch].map((hs) => ({
      stem: hs,
      wuxing: STEM_WX[hs],
      yinYang: STEM_YY[hs],
      shiShen: getShiShen(dayStem, hs),
    }))
    return {
      label: labels[i],
      stem,
      branch,
      stemWx: STEM_WX[stem],
      branchWx: BRANCH_WX[branch],
      stemYy: STEM_YY[stem],
      branchYy: BRANCH_YY[branch],
      nayin: NAYIN[`${stem}${branch}`] || '—',
      hidden,
      stemShiShen: i === 2 ? '日主' : getShiShen(dayStem, stem),
      changSheng: getChangSheng(dayStem, branch),
      isLu: branch === luBranch,
      isYangRen: branch === yangRenBranch,
    }
  })

  const wuxingCount = emptyCount()
  const wuxingCountSimple = emptyCount()
  const shiShenCount: Record<string, number> = {}
  for (const p of pillars) {
    wuxingCountSimple[p.stemWx]++
    wuxingCountSimple[p.branchWx]++
    wuxingCount[p.stemWx]++
    for (const h of p.hidden) {
      wuxingCount[h.wuxing]++
      shiShenCount[h.shiShen] = (shiShenCount[h.shiShen] || 0) + 1
    }
    if (p.stemShiShen !== '日主') {
      shiShenCount[p.stemShiShen] = (shiShenCount[p.stemShiShen] || 0) + 1
    }
  }

  const yearStem = pillars[0].stem
  const yearBr = pillars[0].branch
  const monthStem = pillars[1].stem
  const monthBr = pillars[1].branch
  const hourBr = pillars[3].branch

  // 胎元：月干进一位，月支进三位
  const taiYuan = `${shiftStem(monthStem, 1)}${shiftBranch(monthBr, 3)}`
  const { mingGong, shenGong } = buildMingShenGong(yearStem, monthBr, hourBr)

  const shenSha = buildShenSha(
    dayStem,
    yearBr,
    monthBr,
    dayBranch,
    hourBr,
    pillars.map((p) => p.stem),
    pillars.map((p) => p.branch),
  )

  const relations = buildRelations(pillars)
  const dayun = buildDayun(meta.gender, yearStem, monthStem, monthBr)

  // 得令：日主五行是否与月支本气同类或得月令生
  const lingWx = monthLingWx(monthBr)
  const dmWx = STEM_WX[dayStem]
  let deLing = '不得令'
  if (dmWx === lingWx) deLing = '得令（月支同我）'
  else if (SHENG[lingWx] === dmWx) deLing = '得生（月令生我）'
  else if (SHENG[dmWx] === lingWx) deLing = '泄气（我生月令）'
  else if (KE[dmWx] === lingWx) deLing = '耗气（我克月令）'
  else if (KE[lingWx] === dmWx) deLing = '受克（月令克我）'

  const support =
    (shiShenCount['比肩'] || 0) +
    (shiShenCount['劫财'] || 0) +
    (shiShenCount['正印'] || 0) +
    (shiShenCount['偏印'] || 0)
  const drain =
    (shiShenCount['食神'] || 0) +
    (shiShenCount['伤官'] || 0) +
    (shiShenCount['正财'] || 0) +
    (shiShenCount['偏财'] || 0) +
    (shiShenCount['正官'] || 0) +
    (shiShenCount['七杀'] || 0)
  let strengthHint = '中和偏弱/偏强需综合看（示意）'
  if (deLing.startsWith('得令') || deLing.startsWith('得生')) {
    strengthHint = support >= drain ? '日主较有根气，偏强倾向' : '虽得令/得生，泄耗亦多，需综合'
  } else if (deLing.includes('受克')) {
    strengthHint = '月令受克，日主偏弱倾向'
  } else {
    strengthHint = support > drain + 1 ? '印比偏多，有帮扶' : '食伤财官偏多，泄耗较显'
  }

  return {
    gender: meta.gender,
    solarDate: meta.solarDate,
    lunarDate: meta.lunarDate,
    timeLabel: meta.timeLabel,
    dayMaster: dayStem,
    dayMasterWx: dmWx,
    dayMasterYy: STEM_YY[dayStem],
    pillars,
    fullText: pillars.map((p) => `${p.stem}${p.branch}`).join(' '),
    kongWang,
    wuxingCount,
    wuxingCountSimple,
    shiShenCount,
    luBranch,
    yangRenBranch,
    taiYuan,
    mingGong,
    shenGong,
    shenSha,
    relations,
    dayunDir: dayun.dir,
    dayunNote: dayun.note,
    dayun: dayun.list,
    deLing,
    strengthHint,
  }
}

export function buildBaziFromAstrolabe(raw: {
  gender: string
  solarDate: string
  lunarDate: string
  time: string
  timeRange: string
  chineseDate?: string
  rawDates: {
    chineseDate: {
      yearly: [string, string]
      monthly: [string, string]
      daily: [string, string]
      hourly: [string, string]
    }
  }
}): BaziView {
  const c = raw.rawDates.chineseDate
  return buildBaziFromRaw(
    {
      yearly: c.yearly,
      monthly: c.monthly,
      daily: c.daily,
      hourly: c.hourly,
    },
    {
      gender: raw.gender,
      solarDate: raw.solarDate,
      lunarDate: raw.lunarDate,
      timeLabel: `${raw.time}（${raw.timeRange}）`,
    },
  )
}

export const WUXING_COLOR: Record<WuXing, string> = {
  木: '#2e7d32',
  火: '#c62828',
  土: '#f9a825',
  金: '#f5f5f5',
  水: '#1565c0',
}

export const WUXING_BG: Record<WuXing, string> = {
  木: '#e8f5e9',
  火: '#ffebee',
  土: '#fff8e1',
  金: '#f5f5f5',
  水: '#e3f2fd',
}
