import type { CSSProperties } from 'react'
import type { ChartView, HoroscopeView, PalaceView, StarView } from '../lib/chart'
import { BRANCH_GRID } from '../lib/time'
import type { SkinMode } from '../types'
import { FlyArrowOverlay } from './FlyArrowOverlay'
import { MUTAGEN_COLOR, type MutagenName } from '../lib/flyStar'

export type ChartMode = 'chart' | 'fly'

type Props = {
  chart: ChartView
  personName: string
  skin: SkinMode
  mode: ChartMode
  horoscope?: HoroscopeView | null
  showMinor: boolean
  showAdj: boolean
  showFlyNatal: boolean
  showFlySelf: boolean
}

/** 飞星精简：只保留主星 + 带生年四化/自化的辅星 */
function filterStarsForFlyCompact(stars: StarView[], type: StarView['type']): StarView[] {
  if (type === 'major') return stars
  return stars.filter((s) => s.mutagen || s.selfMutagen)
}

function StarLine({
  stars,
  skin,
  mode,
}: {
  stars: StarView[]
  skin: SkinMode
  mode: ChartMode
}) {
  return (
    <div className="stars">
      {stars.map((s) => {
        const showNatal = mode === 'fly' && !!s.mutagen
        const showSelf = mode === 'fly' && !!s.selfMutagen

        return (
          <span
            key={`${s.type}-${s.name}-${s.mutagen || ''}-${s.selfMutagen || ''}`}
            className={[
              'star',
              `star-${s.type}`,
              showNatal ? `mutagen-${s.mutagen}` : '',
              showSelf ? `self-${s.selfMutagen}` : '',
              showNatal || showSelf ? 'star-fly-hit' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title={[
              s.brightness,
              s.mutagen && `生年${s.mutagen}`,
              s.selfMutagen && `自化${s.selfMutagen}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          >
            {s.name}
            {/* 精简不显示亮度文案，字号仍与其它皮肤一致 */}
            {s.brightness && skin !== 'compact' ? <i className="bright">{s.brightness}</i> : null}
            {showNatal ? <b className="mut">{s.mutagen}</b> : null}
            {showSelf ? <b className="self-mut">自{s.selfMutagen}</b> : null}
          </span>
        )
      })}
    </div>
  )
}

function PalaceCell({
  p,
  skin,
  mode,
  showMinor,
  showAdj,
  highlight,
  flowBadges,
  flyTags,
  style,
}: {
  p: PalaceView
  skin: SkinMode
  mode: ChartMode
  showMinor: boolean
  showAdj: boolean
  highlight?: string
  flowBadges?: { key: string; label: string }[]
  flyTags: MutagenName[]
  style: CSSProperties
}) {
  const compactFly = mode === 'fly' && skin === 'compact'
  const fullFly = mode === 'fly' && skin !== 'compact'

  let majors = p.majorStars
  let minors = p.minorStars
  let adjs = p.adjectiveStars

  if (compactFly) {
    majors = filterStarsForFlyCompact(majors, 'major')
    minors = filterStarsForFlyCompact(minors, 'minor')
    adjs = []
  }

  // 飞星三合：可显辅星；命盘尊重开关
  const showMinors =
    mode === 'chart'
      ? showMinor
      : compactFly
        ? minors.length > 0
        : showMinor

  const showAdjs = mode === 'chart' && showAdj && skin !== 'compact'

  return (
    <div
      style={style}
      className={[
        'palace',
        p.isSoul ? 'is-soul' : '',
        p.isBodyPalace ? 'is-body' : '',
        highlight || '',
        mode === 'fly' && flyTags.length ? 'palace-has-fly' : '',
        compactFly ? 'palace-compact-fly' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="palace-hd">
        <span className="palace-name">
          {p.name}
          {p.isBodyPalace ? <em>身</em> : null}
          {p.isOriginalPalace && mode === 'chart' && skin !== 'compact' ? (
            <em className="lai">来</em>
          ) : null}
          {mode === 'chart' && flowBadges && flowBadges.length > 0
            ? flowBadges.map((b) => (
                <em key={b.key} className={`flow-badge flow-badge-${b.key}`}>
                  {b.label}
                </em>
              ))
            : null}
        </span>
        <span className="palace-gz">
          {p.heavenlyStem}
          {p.earthlyBranch}
        </span>
      </div>

      {/* 三合飞星：宫头四化角标；精简不放角标，靠星旁标记 */}
      {fullFly && flyTags.length > 0 ? (
        <div className="palace-fly-tags">
          {flyTags.map((t) => (
            <span key={t} className={`fly-tag fly-tag-${t}`} style={{ color: MUTAGEN_COLOR[t] }}>
              {t}
            </span>
          ))}
        </div>
      ) : null}

      <StarLine stars={majors} skin={skin} mode={mode} />
      {showMinors ? <StarLine stars={minors} skin={skin} mode={mode} /> : null}
      {showAdjs ? <StarLine stars={adjs} skin={skin} mode={mode} /> : null}

      <div className="palace-ft">
        {mode === 'chart' ? (
          <>
            <span>
              大限 {p.decadal.range[0]}–{p.decadal.range[1]}
            </span>
            {skin !== 'compact' ? <span>{p.changsheng12}</span> : null}
          </>
        ) : compactFly ? (
          flyTags.length ? (
            <span className="palace-ft-fly">{flyTags.join('')}</span>
          ) : (
            <span className="palace-ft-fly muted-ft">—</span>
          )
        ) : (
          <span className="palace-ft-fly">
            {flyTags.length ? `四化入本宫：${flyTags.join(' ')}` : '无生年四化'}
          </span>
        )}
      </div>
    </div>
  )
}

export function ChartBoard({
  chart,
  personName,
  skin,
  mode,
  horoscope,
  showMinor,
  showAdj,
  showFlyNatal,
  showFlySelf,
}: Props) {
  const compactFly = mode === 'fly' && skin === 'compact'

  /**
   * 运限高亮策略（清晰优先）：
   * - 流年：主高亮（整宫底色 + 实线边）——改日期时最该看的
   * - 大限：次高亮（虚线边）——十年一变
   * - 流月/流日/小限：只打角标，不画边框，避免叠色
   */
  const hl = (p: PalaceView) => {
    if (mode === 'fly' || !horoscope) return ''
    const cls: string[] = []
    if (p.index === horoscope.yearly.index) cls.push('hl-yearly')
    else if (p.index === horoscope.decadal.index) cls.push('hl-decadal')
    return cls.join(' ')
  }

  const flowBadges = (p: PalaceView): { key: string; label: string }[] => {
    if (mode === 'fly' || !horoscope) return []
    const b: { key: string; label: string }[] = []
    // 短标签，避免宫头挤爆换行
    if (p.index === horoscope.decadal.index) b.push({ key: 'decadal', label: '限' })
    if (p.index === horoscope.yearly.index) b.push({ key: 'yearly', label: '年' })
    if (p.index === horoscope.monthly.index) b.push({ key: 'monthly', label: '月' })
    if (p.index === horoscope.daily.index) b.push({ key: 'daily', label: '日' })
    return b
  }

  const tagsByIndex = new Map<number, MutagenName[]>()
  for (const n of chart.fly.natal) {
    const list = tagsByIndex.get(n.index) || []
    if (!list.includes(n.mutagen)) list.push(n.mutagen)
    tagsByIndex.set(n.index, list)
  }

  const bannerFly =
    skin === 'compact'
      ? '精简：仅主星+化曜星，无宫角标'
      : skin === 'sihua'
        ? '深色四化：完整辅星与飞入说明'
        : '三合：完整辅星 · 宫头四化角标 · 飞入说明'

  return (
    <div className={`chart-board skin-${skin} mode-${mode}`} id="chart-capture">
      <div className={`chart-mode-banner mode-${mode}`}>
        {mode === 'chart' ? (
          <>
            <strong>
              {skin === 'compact' ? '精简命盘' : skin === 'sihua' ? '四化命盘' : '三合命盘'}
            </strong>
            <span>
              {skin === 'compact'
                ? '主星为主 · 隐藏亮度/长生'
                : '主星亮度 · 大限流年 · 身宫来因'}
            </span>
          </>
        ) : (
          <>
            <strong>
              {skin === 'compact' ? '飞星·精简' : skin === 'sihua' ? '飞星·深色' : '飞星·三合'}
            </strong>
            <span>{bannerFly}</span>
          </>
        )}
      </div>

      <div className="chart-grid-wrap">
        <div className="chart-grid">
          <div className="palace center-palace">
            <div className="center-title">{personName || '命主'}</div>
            <div className="center-meta">
              <div>
                {chart.gender} · {chart.zodiac} · {chart.sign}
              </div>
              <div>公历 {chart.solarDate}</div>
              {!compactFly ? <div>农历 {chart.lunarDate}</div> : null}
              {!compactFly ? <div>{chart.chineseDate}</div> : null}
              <div>
                {chart.time}
                {!compactFly ? `（${chart.timeRange}）` : null}
              </div>
              <div>
                命主 {chart.soul} · 身主 {chart.body}
              </div>
              {chart.fiveElementsClass && !compactFly ? (
                <div>五行局 {chart.fiveElementsClass}</div>
              ) : null}

              {mode === 'chart' && chart.trueSolarSummary ? (
                <div className="center-true-solar">{chart.trueSolarSummary}</div>
              ) : null}

              {mode === 'chart' && horoscope ? (
                <div className="center-flow">
                  <div>
                    大限：{horoscope.decadal.heavenlyStem}
                    {horoscope.decadal.earthlyBranch}
                  </div>
                  <div>
                    流年：{horoscope.yearly.heavenlyStem}
                    {horoscope.yearly.earthlyBranch} · 虚岁{horoscope.age.nominalAge}
                  </div>
                  <div>
                    流月：{horoscope.monthly.heavenlyStem}
                    {horoscope.monthly.earthlyBranch}
                  </div>
                  <div>
                    流日：{horoscope.daily.heavenlyStem}
                    {horoscope.daily.earthlyBranch}
                  </div>
                </div>
              ) : null}

              {mode === 'fly' ? (
                <div className={`center-fly-summary${compactFly ? ' compact' : ''}`}>
                  <div className="fly-sum-row">
                    <span>生年四化</span>
                    <strong>{chart.fly.natal.length} 颗</strong>
                  </div>
                  {/* 三合/深色：列出星名；精简：只显示 禄权科忌 色点 */}
                  {compactFly ? (
                    <div className="fly-sum-chips fly-sum-compact">
                      {chart.fly.natal.map((n) => (
                        <span
                          key={`${n.mutagen}-${n.star}`}
                          className="fly-chip-sm"
                          style={{
                            color: MUTAGEN_COLOR[n.mutagen],
                            borderColor: MUTAGEN_COLOR[n.mutagen],
                          }}
                          title={`${n.star}${n.mutagen}→${n.palace}`}
                        >
                          {n.mutagen}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className="fly-sum-chips">
                      {chart.fly.natal.map((n) => (
                        <span
                          key={`${n.mutagen}-${n.star}`}
                          style={{ color: MUTAGEN_COLOR[n.mutagen] }}
                        >
                          {n.star}
                          {n.mutagen}→{n.palace}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="fly-sum-row">
                    <span>宫干自化</span>
                    <strong>{chart.fly.self.length} 处</strong>
                  </div>
                  {!compactFly && chart.fly.self.length ? (
                    <div className="fly-sum-chips">
                      {chart.fly.self.map((n) => (
                        <span
                          key={`s-${n.palace}-${n.star}-${n.mutagen}`}
                          style={{ color: MUTAGEN_COLOR[n.mutagen] }}
                        >
                          {n.palace}·{n.star}自{n.mutagen}
                        </span>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {chart.palaces.map((p) => {
            const pos = BRANCH_GRID[p.earthlyBranch]
            if (!pos) return null
            return (
              <PalaceCell
                key={p.index}
                p={p}
                skin={skin}
                mode={mode}
                showMinor={showMinor}
                showAdj={showAdj}
                highlight={hl(p)}
                flowBadges={flowBadges(p)}
                flyTags={tagsByIndex.get(p.index) || []}
                style={{
                  gridRow: pos.row + 1,
                  gridColumn: pos.col + 1,
                }}
              />
            )
          })}
        </div>

        {mode === 'fly' ? (
          <FlyArrowOverlay
            arrows={chart.fly.arrows}
            showNatal={showFlyNatal}
            /* 精简默认仍可画自化，由侧栏开关控制 */
            showSelf={showFlySelf}
          />
        ) : null}
      </div>
    </div>
  )
}
