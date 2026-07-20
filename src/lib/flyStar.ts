import type { ChartView, PalaceView, StarView } from './chart'
import { getMutagensByStem } from './sihua'
import { BRANCH_GRID } from './time'

export type MutagenName = '禄' | '权' | '科' | '忌'

export type FlyArrow = {
  id: string
  kind: 'natal' | 'self'
  mutagen: MutagenName
  star: string
  /** 飞出宫 index（自化时与 to 相同或邻宫逻辑简化为同源） */
  fromIndex: number
  toIndex: number
  fromBranch: string
  toBranch: string
  fromName: string
  toName: string
  /** 自化方向：入=星在本宫被本宫干所化 */
  selfDir?: 'in' | 'out'
}

export type FlyStarSummary = {
  natal: { mutagen: MutagenName; star: string; palace: string; branch: string; index: number }[]
  self: { mutagen: MutagenName; star: string; palace: string; branch: string; index: number }[]
  arrows: FlyArrow[]
}

const MUTAGENS: MutagenName[] = ['禄', '权', '科', '忌']

function allStarsInPalace(p: PalaceView): StarView[] {
  return [...p.majorStars, ...p.minorStars, ...p.adjectiveStars]
}

/** 解析生年四化 + 宫干自化，生成飞星箭头数据 */
export function analyzeFlyStars(chart: ChartView): FlyStarSummary {
  const natal: FlyStarSummary['natal'] = []
  const self: FlyStarSummary['self'] = []
  const arrows: FlyArrow[] = []

  // 命宫作为生年四化「飞出」视觉起点
  const soul = chart.palaces.find((p) => p.isSoul) || chart.palaces[0]

  for (const p of chart.palaces) {
    // 生年四化：星上已有 mutagen
    for (const s of allStarsInPalace(p)) {
      if (!s.mutagen || !MUTAGENS.includes(s.mutagen as MutagenName)) continue
      const mutagen = s.mutagen as MutagenName
      natal.push({
        mutagen,
        star: s.name,
        palace: p.name,
        branch: p.earthlyBranch,
        index: p.index,
      })
      arrows.push({
        id: `natal-${mutagen}-${s.name}-${p.index}`,
        kind: 'natal',
        mutagen,
        star: s.name,
        fromIndex: soul.index,
        toIndex: p.index,
        fromBranch: soul.earthlyBranch,
        toBranch: p.earthlyBranch,
        fromName: soul.name,
        toName: p.name,
      })
    }

    // 宫干自化：本宫天干四化落在本宫星上
    const stemMuts = getMutagensByStem(p.heavenlyStem)
    const names = new Set(allStarsInPalace(p).map((s) => s.name))
    stemMuts.forEach((starName, i) => {
      if (!names.has(starName)) return
      const mutagen = MUTAGENS[i]
      self.push({
        mutagen,
        star: starName,
        palace: p.name,
        branch: p.earthlyBranch,
        index: p.index,
      })
      arrows.push({
        id: `self-${mutagen}-${starName}-${p.index}`,
        kind: 'self',
        mutagen,
        star: starName,
        fromIndex: p.index,
        toIndex: p.index,
        fromBranch: p.earthlyBranch,
        toBranch: p.earthlyBranch,
        fromName: p.name,
        toName: p.name,
        selfDir: 'in',
      })
    })
  }

  return { natal, self, arrows }
}

/** 宫位中心点（相对 4x4 网格 0–100%） */
export function branchCenterPercent(branch: string): { x: number; y: number } | null {
  const pos = BRANCH_GRID[branch]
  if (!pos) return null
  // 每格 25%，中心 +12.5%
  return {
    x: pos.col * 25 + 12.5,
    y: pos.row * 25 + 12.5,
  }
}

export const MUTAGEN_COLOR: Record<MutagenName, string> = {
  禄: '#c0392b',
  权: '#8e44ad',
  科: '#2980b9',
  忌: '#16a085',
}
