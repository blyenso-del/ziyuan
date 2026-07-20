import type { BirthInput, CaseRecord } from '../types'

const KEY = 'ziyuan_cases_v1'
/** 兼容旧版本地键 */
const LEGACY_KEY = 'wenmo_tianji_cases_v1'

function uid() {
  return `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function loadCases(): CaseRecord[] {
  try {
    let raw = localStorage.getItem(KEY)
    if (!raw) {
      raw = localStorage.getItem(LEGACY_KEY)
      if (raw) {
        localStorage.setItem(KEY, raw)
      }
    }
    if (!raw) return []
    const list = JSON.parse(raw) as CaseRecord[]
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

export function saveCases(list: CaseRecord[]) {
  localStorage.setItem(KEY, JSON.stringify(list))
}

export function upsertCase(input: BirthInput, id?: string): CaseRecord {
  const list = loadCases()
  const now = new Date().toISOString()
  if (id) {
    const idx = list.findIndex((c) => c.id === id)
    if (idx >= 0) {
      const next: CaseRecord = { ...list[idx], ...input, updatedAt: now }
      list[idx] = next
      saveCases(list)
      return next
    }
  }
  const rec: CaseRecord = {
    ...input,
    id: uid(),
    createdAt: now,
    updatedAt: now,
  }
  list.unshift(rec)
  saveCases(list)
  return rec
}

export function deleteCase(id: string) {
  saveCases(loadCases().filter((c) => c.id !== id))
}

export function exportCasesJson(): string {
  return JSON.stringify(
    {
      app: '紫垣天机',
      version: 1,
      exportedAt: new Date().toISOString(),
      cases: loadCases(),
    },
    null,
    2,
  )
}

export function importCasesJson(text: string): number {
  const data = JSON.parse(text)
  const incoming = (data.cases ?? data) as CaseRecord[]
  if (!Array.isArray(incoming)) throw new Error('无效命例文件')
  const map = new Map(loadCases().map((c) => [c.id, c]))
  let n = 0
  for (const c of incoming) {
    if ((!c?.solarDate && !c?.lunarYear) || !c?.gender) continue
    const id = c.id || uid()
    map.set(id, {
      id,
      name: c.name || '未命名',
      gender: c.gender,
      calendarType: c.calendarType || 'solar',
      solarDate: c.solarDate || '1990-01-01',
      lunarYear: c.lunarYear || 1990,
      lunarMonth: c.lunarMonth || 1,
      lunarDay: c.lunarDay || 1,
      isLeapMonth: !!c.isLeapMonth,
      timeIndex: Number(c.timeIndex) || 0,
      clockHour: c.clockHour ?? 12,
      clockMinute: c.clockMinute ?? 0,
      useTrueSolar: !!c.useTrueSolar,
      longitude: c.longitude ?? 120,
      cityName: c.cityName,
      note: c.note || '',
      category: c.category || '默认',
      createdAt: c.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    n++
  }
  saveCases([...map.values()].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)))
  return n
}
