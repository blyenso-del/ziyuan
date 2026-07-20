import { TIME_OPTIONS } from '../lib/time'
import { CITY_LONGITUDES } from '../lib/solarTime'
import {
  LUNAR_DAYS,
  LUNAR_MONTHS,
  LUNAR_YEAR_MAX,
  LUNAR_YEAR_MIN,
  solarToLunar,
} from '../lib/lunar'
import type { BirthInput, CalendarType, Gender } from '../types'

type Props = {
  value: BirthInput
  onChange: (v: BirthInput) => void
  onSubmit: () => void
  trueSolarHint?: string
}

export function BirthForm({ value, onChange, onSubmit, trueSolarHint }: Props) {
  const set = <K extends keyof BirthInput>(k: K, v: BirthInput[K]) =>
    onChange({ ...value, [k]: v })

  const switchCalendar = (t: CalendarType) => {
    if (t === value.calendarType) return
    if (t === 'lunar') {
      try {
        const L = solarToLunar(value.solarDate)
        onChange({
          ...value,
          calendarType: 'lunar',
          lunarYear: L.year,
          lunarMonth: L.month,
          lunarDay: L.day,
          isLeapMonth: L.isLeap,
        })
      } catch {
        onChange({ ...value, calendarType: 'lunar' })
      }
    } else {
      onChange({ ...value, calendarType: 'solar' })
    }
  }

  return (
    <form
      className="panel birth-form"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit()
      }}
    >
      <h2>生辰排盘</h2>

      <div className="form-grid">
        <label className="field">
          <span className="field-label">姓名</span>
          <input
            value={value.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="可选"
          />
        </label>
        <label className="field">
          <span className="field-label">性别</span>
          <select
            value={value.gender}
            onChange={(e) => set('gender', e.target.value as Gender)}
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </label>

        <div className="field span-2">
          <span className="field-label">历法</span>
          <div className="seg">
            <button
              type="button"
              className={value.calendarType === 'solar' ? 'active' : ''}
              onClick={() => switchCalendar('solar')}
            >
              公历
            </button>
            <button
              type="button"
              className={value.calendarType === 'lunar' ? 'active' : ''}
              onClick={() => switchCalendar('lunar')}
            >
              农历
            </button>
          </div>
        </div>

        {value.calendarType === 'solar' ? (
          <label className="field span-2">
            <span className="field-label">公历日期</span>
            <input
              type="date"
              value={normalizeDateInput(value.solarDate)}
              onChange={(e) => set('solarDate', e.target.value)}
              required
            />
          </label>
        ) : (
          <>
            <label className="field">
              <span className="field-label">农历年</span>
              <input
                type="number"
                min={LUNAR_YEAR_MIN}
                max={LUNAR_YEAR_MAX}
                value={value.lunarYear}
                onChange={(e) => set('lunarYear', Number(e.target.value))}
              />
            </label>
            <label className="field">
              <span className="field-label">农历月</span>
              <select
                value={value.lunarMonth}
                onChange={(e) => set('lunarMonth', Number(e.target.value))}
              >
                {LUNAR_MONTHS.map((m) => (
                  <option key={m} value={m}>
                    {m}月
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">农历日</span>
              <select
                value={value.lunarDay}
                onChange={(e) => set('lunarDay', Number(e.target.value))}
              >
                {LUNAR_DAYS.map((d) => (
                  <option key={d} value={d}>
                    {d}日
                  </option>
                ))}
              </select>
            </label>
            <label className="field field-inline">
              <span className="field-label">闰月</span>
              <input
                type="checkbox"
                checked={value.isLeapMonth}
                onChange={(e) => set('isLeapMonth', e.target.checked)}
              />
            </label>
          </>
        )}
      </div>

      {/* 时间区：与上方网格分离，避免勾选后错位 */}
      <div className="form-section">
        <label className="switch-row">
          <input
            type="checkbox"
            checked={value.useTrueSolar}
            onChange={(e) => set('useTrueSolar', e.target.checked)}
          />
          <span>
            <strong>真太阳时</strong>
            <em>经度差 + 均时差校正</em>
          </span>
        </label>

        {value.useTrueSolar ? (
          <div className="form-grid true-solar-block">
            <label className="field span-2">
              <span className="field-label">出生地</span>
              <select
                value={value.cityName || ''}
                onChange={(e) => {
                  const city = CITY_LONGITUDES.find((c) => c.name === e.target.value)
                  if (city) {
                    onChange({
                      ...value,
                      cityName: city.name,
                      longitude: city.lon,
                    })
                  } else {
                    onChange({ ...value, cityName: undefined })
                  }
                }}
              >
                <option value="">自定义经度…</option>
                {CITY_LONGITUDES.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}（E{c.lon}°）
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span className="field-label">东经 (°)</span>
              <input
                type="number"
                step="0.01"
                min={70}
                max={140}
                value={value.longitude}
                onChange={(e) =>
                  onChange({
                    ...value,
                    longitude: Number(e.target.value),
                    cityName: undefined,
                  })
                }
              />
            </label>
            <label className="field">
              <span className="field-label">钟表时间</span>
              <div className="time-hm">
                <input
                  type="number"
                  min={0}
                  max={23}
                  value={value.clockHour}
                  onChange={(e) => set('clockHour', clamp(Number(e.target.value), 0, 23))}
                  aria-label="时"
                />
                <span className="time-sep">:</span>
                <input
                  type="number"
                  min={0}
                  max={59}
                  value={value.clockMinute}
                  onChange={(e) => set('clockMinute', clamp(Number(e.target.value), 0, 59))}
                  aria-label="分"
                />
              </div>
            </label>
          </div>
        ) : (
          <div className="form-grid">
            <label className="field span-2">
              <span className="field-label">时辰</span>
              <select
                value={value.timeIndex}
                onChange={(e) => {
                  const timeIndex = Number(e.target.value)
                  const hour =
                    timeIndex === 0 ? 0 : timeIndex === 12 ? 23 : timeIndex * 2 - 1
                  onChange({
                    ...value,
                    timeIndex,
                    clockHour: hour,
                    clockMinute: timeIndex === 0 || timeIndex === 12 ? 30 : 0,
                  })
                }}
              >
                {TIME_OPTIONS.map((t) => (
                  <option key={t.index} value={t.index}>
                    {t.label}（{t.range}）
                  </option>
                ))}
              </select>
            </label>
          </div>
        )}
      </div>

      <div className="form-grid">
        <label className="field span-2">
          <span className="field-label">备注</span>
          <input
            value={value.note || ''}
            onChange={(e) => set('note', e.target.value)}
            placeholder="限 50 字"
            maxLength={50}
          />
        </label>
        <label className="field span-2">
          <span className="field-label">分类</span>
          <input
            value={value.category || '默认'}
            onChange={(e) => set('category', e.target.value)}
          />
        </label>
      </div>

      {trueSolarHint ? <p className="true-solar-hint">{trueSolarHint}</p> : null}

      <div className="form-actions">
        <button type="submit" className="btn primary">
          排 盘
        </button>
      </div>
    </form>
  )
}

function normalizeDateInput(d: string): string {
  const m = d.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (!m) return d
  return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
}

function clamp(n: number, min: number, max: number) {
  if (Number.isNaN(n)) return min
  return Math.min(max, Math.max(min, n))
}
