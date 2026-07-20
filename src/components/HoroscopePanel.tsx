import type { HoroscopeView } from '../lib/chart'

type Props = {
  date: string
  onDateChange: (d: string) => void
  horoscope: HoroscopeView | null
}

export function HoroscopePanel({ date, onDateChange, horoscope }: Props) {
  return (
    <div className="panel">
      <h2>大限 / 流年</h2>
      <label className="block-label">
        运限日期
        <input type="date" value={date} onChange={(e) => onDateChange(e.target.value)} />
      </label>
      {horoscope ? (
        <div className="flow-cards">
          <div className="flow-card flow-card-decadal">
            <span>大限</span>
            <strong>
              {horoscope.decadal.heavenlyStem}
              {horoscope.decadal.earthlyBranch}
            </strong>
            <em>{horoscope.decadal.name}</em>
          </div>
          <div className="flow-card flow-card-yearly">
            <span>流年 ★盘面主亮</span>
            <strong>
              {horoscope.yearly.heavenlyStem}
              {horoscope.yearly.earthlyBranch}
            </strong>
            <em>虚岁 {horoscope.age.nominalAge}</em>
          </div>
          <div className="flow-card flow-card-monthly">
            <span>流月</span>
            <strong>
              {horoscope.monthly.heavenlyStem}
              {horoscope.monthly.earthlyBranch}
            </strong>
            <em>{horoscope.monthly.name}</em>
          </div>
          <div className="flow-card flow-card-daily">
            <span>流日</span>
            <strong>
              {horoscope.daily.heavenlyStem}
              {horoscope.daily.earthlyBranch}
            </strong>
            <em>{horoscope.daily.name}</em>
          </div>
        </div>
      ) : (
        <p className="muted">排盘后显示运限</p>
      )}
      <p className="hint">
        盘面：青绿底=流年宫；金虚线=大限宫。宫名旁 限/年/月/日 为标签。改年份看流年跳格，改月日看月/日标签。
      </p>
    </div>
  )
}
