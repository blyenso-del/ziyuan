export type Gender = '男' | '女'

export type SkinMode = 'sanhe' | 'sihua' | 'compact'

export type CalendarType = 'solar' | 'lunar'

export type BirthInput = {
  name: string
  gender: Gender
  /** 历法输入 */
  calendarType: CalendarType
  solarDate: string // YYYY-MM-DD 或 YYYY-M-D
  lunarYear: number
  lunarMonth: number
  lunarDay: number
  isLeapMonth: boolean
  /** 时辰索引（未用真太阳时或校正后） */
  timeIndex: number
  /** 钟表时间（真太阳时用） */
  clockHour: number
  clockMinute: number
  useTrueSolar: boolean
  longitude: number
  cityName?: string
  note?: string
  category?: string
}

export type CaseRecord = BirthInput & {
  id: string
  createdAt: string
  updatedAt: string
}

export type GejuEntry = {
  name: string
  type: string
  condition: string
  poem: string
  classics: string[]
  stars: string[]
  full_text: string
}

export type GejuHit = GejuEntry & {
  score: number
  reasons: string[]
}
