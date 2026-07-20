/**
 * 八字解析文案（规则引擎 + 模板）
 * 仅供学习参考，非人工命理师细批。
 */
import type { BaziView, Stem, WuXing } from './bazi'

export type AnalysisSection = {
  id: string
  title: string
  level?: 'info' | 'warn' | 'good'
  paragraphs: string[]
  bullets?: string[]
}

export type BaziAnalysis = {
  summary: string
  sections: AnalysisSection[]
  disclaimer: string
}

const DAY_MASTER_TRAIT: Record<Stem, string> = {
  甲: '甲木如参天大树，主见正直、有担当，进取心强，亦可能固执、好面子。',
  乙: '乙木如花草藤萝，主柔韧细腻、适应力强，善迂回达成目标，亦可能优柔寡断。',
  丙: '丙火如太阳，主热情开朗、表现欲强，光明磊落，亦可能急躁、好高骛远。',
  丁: '丁火如灯烛，主内敛细腻、心思缜密，重情义，亦可能敏感多虑。',
  戊: '戊土如山岳，主稳重厚道、信用为先，能承载，亦可能保守迟缓。',
  己: '己土如田园，主包容务实、善于经营细节，亦可能多疑、缺乏决断。',
  庚: '庚金如刀剑，主义气果断、执行力强，原则性高，亦可能刚愎、冲撞。',
  辛: '辛金如珠玉，主精致敏锐、审美与专业意识强，亦可能挑剔、患得患失。',
  壬: '壬水如江海，主聪明灵活、胸怀开阔，善变通，亦可能心性不定。',
  癸: '癸水如雨露，主细腻聪慧、洞察力强，重感受，亦可能消极、想太多。',
}

const WX_NAME: Record<WuXing, string> = {
  木: '木',
  火: '火',
  土: '土',
  金: '金',
  水: '水',
}

function cnt(bazi: BaziView, keys: string[]): number {
  return keys.reduce((s, k) => s + (bazi.shiShenCount[k] || 0), 0)
}

function topShiShen(bazi: BaziView, n = 3): string[] {
  return Object.entries(bazi.shiShenCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, v]) => `${k}×${v}`)
}

function dominantWx(bazi: BaziView): { wx: WuXing; n: number }[] {
  return (Object.entries(bazi.wuxingCountSimple) as [WuXing, number][])
    .sort((a, b) => b[1] - a[1])
    .map(([wx, n]) => ({ wx, n }))
}

function isWeak(bazi: BaziView): boolean {
  return (
    bazi.deLing.includes('受克') ||
    bazi.deLing.includes('泄气') ||
    bazi.deLing.includes('耗气') ||
    bazi.strengthHint.includes('偏弱')
  )
}

function isStrong(bazi: BaziView): boolean {
  return (
    bazi.deLing.startsWith('得令') ||
    bazi.deLing.startsWith('得生') ||
    bazi.strengthHint.includes('偏强')
  )
}

/** 用神喜忌（极简口诀，示意） */
function yongShenHint(bazi: BaziView): { yong: string; ji: string; text: string } {
  const dm = bazi.dayMasterWx
  // 生我：印，同我：比劫，我生：食伤，我克：财，克我：官杀
  const mapSheng: Record<WuXing, WuXing> = {
    木: '水',
    火: '木',
    土: '火',
    金: '土',
    水: '金',
  }
  const mapWoSheng: Record<WuXing, WuXing> = {
    木: '火',
    火: '土',
    土: '金',
    金: '水',
    水: '木',
  }
  const mapWoKe: Record<WuXing, WuXing> = {
    木: '土',
    火: '金',
    土: '水',
    金: '木',
    水: '火',
  }
  const mapKeWo: Record<WuXing, WuXing> = {
    木: '金',
    火: '水',
    土: '木',
    金: '火',
    水: '土',
  }

  if (isWeak(bazi) && !isStrong(bazi)) {
    return {
      yong: `${WX_NAME[mapSheng[dm]]}（印）、${WX_NAME[dm]}（比劫）`,
      ji: `${WX_NAME[mapWoSheng[dm]]}（食伤）、${WX_NAME[mapWoKe[dm]]}（财）、${WX_NAME[mapKeWo[dm]]}（官杀）过旺时不利`,
      text: '日主偏弱倾向时，一般喜生扶（印星、比劫），忌再被克泄耗太过。具体仍须看格局与流通。',
    }
  }
  if (isStrong(bazi)) {
    return {
      yong: `${WX_NAME[mapWoSheng[dm]]}（食伤）、${WX_NAME[mapWoKe[dm]]}（财）、${WX_NAME[mapKeWo[dm]]}（官杀）`,
      ji: `${WX_NAME[mapSheng[dm]]}（印）、${WX_NAME[dm]}（比劫）过旺易壅塞`,
      text: '日主偏强倾向时，一般喜克泄耗以流通（食伤、财、官杀），忌无制之印比成党。',
    }
  }
  return {
    yong: '中和之象，喜忌需看病药与调候',
    ji: '忌五行偏枯、流通受阻',
    text: '日主中和或喜忌混杂，宜以月令、通关、调候综合取用，不可单凭强弱断。',
  }
}

function analyzeDayMaster(bazi: BaziView): AnalysisSection {
  const trait = DAY_MASTER_TRAIT[bazi.dayMaster]
  const dayPillar = bazi.pillars.find((p) => p.label === '日柱')!
  const paragraphs = [
    `日主为${bazi.dayMaster}（${bazi.dayMasterYy}${bazi.dayMasterWx}），坐${dayPillar.branch}，十二长生为「${dayPillar.changSheng}」。`,
    trait,
    `月令关系：${bazi.deLing}。${bazi.strengthHint}`,
  ]
  if (dayPillar.isLu) {
    paragraphs.push('日支或四柱见禄，日主有根气，行事多有凭借。')
  }
  if (dayPillar.isYangRen || bazi.pillars.some((p) => p.isYangRen)) {
    paragraphs.push('局中见羊刃，性格刚烈果决，亦主是非口舌与起伏，宜导不宜激。')
  }
  return {
    id: 'day-master',
    title: '一、日主性情',
    level: 'info',
    paragraphs,
  }
}

function analyzeShiShen(bazi: BaziView): AnalysisSection {
  const bi = cnt(bazi, ['比肩', '劫财'])
  const yin = cnt(bazi, ['正印', '偏印'])
  const shi = cnt(bazi, ['食神', '伤官'])
  const cai = cnt(bazi, ['正财', '偏财'])
  const guan = cnt(bazi, ['正官', '七杀'])
  const bullets: string[] = []
  const paragraphs = [
    `十神出现频次（天干+藏干）：${topShiShen(bazi, 6).join('，') || '较均衡'}。`,
  ]

  if (bi >= 3) {
    bullets.push('比劫偏多：自立心强，重义气，也易争财、波动；适合合伙时需权责清晰。')
  }
  if (yin >= 2) {
    bullets.push('印星有气：学习力、贵人运与文书资质较好，亦可能依赖或想法偏多。')
  }
  if (shi >= 2) {
    bullets.push('食伤有力：表达、技艺、创意与执行输出较强，口才或专业表现突出。')
  }
  if (cai >= 2) {
    bullets.push('财星显透：理财与目标感强，重现实收益；过旺则劳心于名利。')
  }
  if (guan >= 2) {
    bullets.push('官杀较重：责任心、规则意识与压力并存，宜事业平台但需防压抑与是非。')
  }
  if (shi >= 1 && cai >= 1) {
    bullets.push('食伤生财之象：以才能换财的路径较顺，适合专业技术或内容变现。')
  }
  if (cai >= 1 && guan >= 1) {
    bullets.push('财官相生：有求财与求名的双重动力，体制或管理路径可参考。')
  }
  if (yin >= 1 && guan >= 1) {
    bullets.push('官印相生：利学业、考试、职称与稳定职场。')
  }
  if (!bullets.length) {
    bullets.push('十神分布尚可，无明显偏党，发展面较广，宜结合大运看阶段性主题。')
  }

  // 年干十神
  const year = bazi.pillars[0]
  const month = bazi.pillars[1]
  const hour = bazi.pillars[3]
  paragraphs.push(
    `年干为${year.stemShiShen}，主长辈缘与早年环境；月干为${month.stemShiShen}，关乎青年格局与社会角色；时干为${hour.stemShiShen}，多主晚年与子女部属。`,
  )

  return {
    id: 'shishen',
    title: '二、十神与格局倾向',
    level: 'info',
    paragraphs,
    bullets,
  }
}

function analyzeWuxing(bazi: BaziView): AnalysisSection {
  const dom = dominantWx(bazi)
  const top = dom[0]
  const low = [...dom].reverse()[0]
  const paragraphs = [
    `天干地支八字中，${top.wx}气最旺（约${top.n}个），${low.wx}相对偏弱（约${low.n}个）。`,
  ]
  const bullets: string[] = []

  if (top.n >= 4) {
    bullets.push(`${top.wx}偏旺：性格与机遇多带${top.wx}之象，过旺需流通，防偏枯。`)
  }
  if (low.n === 0) {
    bullets.push(`缺${low.wx}：对应六亲/事项可能需后天补足（行业、方位、合作等仅作文化参考）。`)
  }

  const yong = yongShenHint(bazi)
  paragraphs.push(yong.text)
  bullets.push(`喜用倾向：${yong.yong}`)
  bullets.push(`忌神倾向：${yong.ji}`)

  return {
    id: 'wuxing',
    title: '三、五行与喜用（示意）',
    level: 'good',
    paragraphs,
    bullets,
  }
}

function analyzeRelations(bazi: BaziView): AnalysisSection {
  const rel = bazi.relations.filter((r) => r.type !== '—')
  const paragraphs: string[] = []
  const bullets: string[] = []

  if (!rel.length) {
    return {
      id: 'relations',
      title: '四、刑冲合害',
      paragraphs: ['四柱组合相对平稳，未见强烈刑冲合害记录。'],
    }
  }

  paragraphs.push(`共检出 ${rel.length} 条干支关系，可能影响性格起伏与人事波折。`)

  for (const r of rel.slice(0, 12)) {
    if (r.type === '六冲') {
      bullets.push(`${r.detail}：主变动、冲突与迁移，事多波折亦利打破僵局。`)
    } else if (r.type === '六合' || r.type === '天干合') {
      bullets.push(`${r.detail}：主牵绊、合作与牵制，有助缘也易纠缠。`)
    } else if (r.type === '三合') {
      bullets.push(`${r.detail}：气势凝聚，成局则力量大，喜忌看是否对日主有情。`)
    } else if (r.type.includes('刑') || r.type === '自刑') {
      bullets.push(`${r.detail}：主不顺、内耗或文书官非，宜谨慎决策。`)
    } else if (r.type === '六害') {
      bullets.push(`${r.detail}：主暗损、小人或情面困扰。`)
    } else if (r.type === '相破') {
      bullets.push(`${r.detail}：主耗损、计划易变。`)
    } else {
      bullets.push(`${r.detail}`)
    }
  }

  return {
    id: 'relations',
    title: '四、刑冲合害简析',
    level: 'warn',
    paragraphs,
    bullets,
  }
}

function analyzeShenSha(bazi: BaziView): AnalysisSection {
  const names = [...new Set(bazi.shenSha.map((s) => s.name))]
  const paragraphs = [
    names.length
      ? `命局检出神煞：${names.join('、')}。神煞为辅助参考，吉凶以格局与日主喜忌为先。`
      : '未见列出的常见神煞，仍以十神与五行流通为主。',
  ]
  const bullets: string[] = []

  const has = (n: string) => names.includes(n)
  if (has('天乙贵人')) bullets.push('天乙贵人：逢难有人助，利文书、贵人缘。')
  if (has('文昌')) bullets.push('文昌：利学业、考试、技艺与文化工作。')
  if (has('文昌') && has('天乙贵人')) bullets.push('文昌+天乙：文贵之象较显，适合考试与专业资质。')
  if (has('桃花')) bullets.push('桃花：异性缘与人缘佳，亦主应酬；需防情感纠缠。')
  if (has('驿马')) bullets.push('驿马：好动、出差调动多，宜外向型发展。')
  if (has('华盖')) bullets.push('华盖：思想独特，利研究、艺术、宗教哲学。')
  if (has('将星')) bullets.push('将星：有管理与担当气质，利职位与权威。')
  if (has('劫煞')) bullets.push('劫煞：主波折、争夺，宜稳健理财与避免冲动。')
  if (has('羊刃')) bullets.push('羊刃：刚烈果决，成功与风险并存，宜修性情。')
  if (has('禄神')) bullets.push('禄神：衣禄有靠，财禄与本职收入较稳。')
  if (has('天德贵人') || has('月德贵人')) bullets.push('天德/月德：心地与口碑较好，遇事易化解。')

  if (!bullets.length && names.length) {
    bullets.push(...bazi.shenSha.slice(0, 8).map((s) => `${s.name}在${s.at}${s.note ? `（${s.note}）` : ''}`))
  }

  return {
    id: 'shensha',
    title: '五、神煞提示',
    paragraphs,
    bullets: bullets.length ? bullets : undefined,
  }
}

function analyzeCareerLife(bazi: BaziView): AnalysisSection {
  const yong = yongShenHint(bazi)
  const bullets: string[] = []
  const shi = cnt(bazi, ['食神', '伤官'])
  const cai = cnt(bazi, ['正财', '偏财'])
  const guan = cnt(bazi, ['正官', '七杀'])
  const yin = cnt(bazi, ['正印', '偏印'])

  if (shi >= cai && shi >= 1) {
    bullets.push('事业：偏才华技术、设计表达、自由职业或专业服务。')
  } else if (cai >= 2) {
    bullets.push('事业：偏经营贸易、销售、理财投资、实业求财。')
  } else if (guan >= 2) {
    bullets.push('事业：偏管理、公务、企事业单位、制度型平台。')
  } else if (yin >= 2) {
    bullets.push('事业：偏文教、研究、咨询、医疗、培训等。')
  } else {
    bullets.push('事业：路径较杂，宜结合大运与兴趣选择，先专精一门。')
  }

  bullets.push(`调候与行业五行可参考喜用：${yong.yong}。`)

  // 六亲极简
  if (bazi.gender.includes('男')) {
    bullets.push(
      cai >= 1
        ? '感情/配偶（男命看财）：财星有气，婚姻课题现实；留意财多身弱或比劫争财。'
        : '感情/配偶（男命看财）：财星不显，婚恋或较晚、或较淡，宜后天经营。',
    )
  } else {
    bullets.push(
      guan >= 1
        ? '感情/配偶（女命看官杀）：官杀有气，婚恋缘较显；官杀混杂则需防选择困难。'
        : '感情/配偶（女命看官杀）：官星不显，感情发展或较缓，宜主动扩展交际。',
    )
  }

  const hour = bazi.pillars[3]
  bullets.push(`子女宫（时柱）为${hour.stem}${hour.branch}，时干十神「${hour.stemShiShen}」，子女缘与晚年心态可参考此时柱气场。`)

  return {
    id: 'life',
    title: '六、事业与六亲（概说）',
    level: 'info',
    paragraphs: ['以下为十神象义层面的方向提示，不构成具体职业或婚恋建议。'],
    bullets,
  }
}

function analyzeDayun(bazi: BaziView): AnalysisSection {
  const first = bazi.dayun[0]
  const second = bazi.dayun[1]
  const paragraphs = [
    `大运${bazi.dayunDir}行。${bazi.dayunNote}`,
  ]
  const bullets: string[] = []
  if (first) {
    bullets.push(
      `第一步大运${first.label}（约${first.ageFrom}–${first.ageTo}岁，纳音${first.nayin}）：青年奠基阶段，宜观察该运干支对日主的生克。`,
    )
  }
  if (second) {
    bullets.push(
      `第二步大运${second.label}（约${second.ageFrom}–${second.ageTo}岁）：人生重要过渡期，事业家庭常有成型。`,
    )
  }
  bullets.push('大运与流年并看：运岁与日主喜忌相同则助力大，相战则多考。')

  return {
    id: 'dayun',
    title: '七、大运阶段',
    paragraphs,
    bullets,
  }
}

function analyzeExtra(bazi: BaziView): AnalysisSection {
  const bullets = [
    `命宫${bazi.mingGong}、身宫${bazi.shenGong}、胎元${bazi.taiYuan}：传统辅助宫职，可与性格、身体、出身环境对照。`,
    `空亡${bazi.kongWang.join('')}：落空亡之支气场虚，相关人事或有落空、宜实干补足。`,
  ]
  const day = bazi.pillars[2]
  bullets.push(`日支为配偶宫，日支${day.branch}十二长生「${day.changSheng}」，可参考相处模式与稳定性。`)

  return {
    id: 'extra',
    title: '八、命宫身宫与空亡',
    paragraphs: ['辅助信息，不宜单独定吉凶。'],
    bullets,
  }
}

export function analyzeBazi(bazi: BaziView): BaziAnalysis {
  const yong = yongShenHint(bazi)
  const summary = [
    `${bazi.fullText}，日主${bazi.dayMaster}（${bazi.dayMasterYy}${bazi.dayMasterWx}）。`,
    bazi.deLing + '。',
    bazi.strengthHint + '。',
    `喜用倾向：${yong.yong}。`,
  ].join('')

  return {
    summary,
    sections: [
      analyzeDayMaster(bazi),
      analyzeShiShen(bazi),
      analyzeWuxing(bazi),
      analyzeRelations(bazi),
      analyzeShenSha(bazi),
      analyzeCareerLife(bazi),
      analyzeDayun(bazi),
      analyzeExtra(bazi),
    ],
    disclaimer:
      '本解析由规则引擎根据排盘结果自动生成，侧重结构化提示与学习参考，不能替代人工命理师综合研判，亦非任何决策建议。',
  }
}
