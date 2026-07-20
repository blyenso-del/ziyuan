/** 天干四化：禄、权、科、忌（中文星名，与 iztro zh-CN 一致） */
export const STEM_SIHUA: Record<string, [string, string, string, string]> = {
  甲: ['廉贞', '破军', '武曲', '太阳'],
  乙: ['天机', '天梁', '紫微', '太阴'],
  丙: ['天同', '天机', '文昌', '廉贞'],
  丁: ['太阴', '天同', '天机', '巨门'],
  戊: ['贪狼', '太阴', '右弼', '天机'],
  己: ['武曲', '贪狼', '天梁', '文曲'],
  庚: ['太阳', '武曲', '太阴', '天同'],
  辛: ['巨门', '太阳', '文曲', '文昌'],
  壬: ['天梁', '紫微', '左辅', '武曲'],
  癸: ['破军', '巨门', '太阴', '贪狼'],
}

export type SihuaLabel = '禄' | '权' | '科' | '忌'
export const SIHUA_LABELS: SihuaLabel[] = ['禄', '权', '科', '忌']

/** 取某天干对应的四化星名列表 */
export function getMutagensByStem(stem: string): string[] {
  // 兼容带后缀的 stem，如「甲」
  const key = stem.match(/[甲乙丙丁戊己庚辛壬癸]/)?.[0] ?? stem
  return STEM_SIHUA[key] ? [...STEM_SIHUA[key]] : []
}
