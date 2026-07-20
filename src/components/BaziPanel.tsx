import { useMemo, useState } from 'react'
import type { BaziView, PillarView, WuXing } from '../lib/bazi'
import { WUXING_BG, WUXING_COLOR } from '../lib/bazi'
import { analyzeBazi } from '../lib/baziAnalysis'
import {
  buildLiunian,
  buildLiunianRange,
  parseBirthYear,
  type LiunianView,
} from '../lib/baziLiunian'

type Props = {
  bazi: BaziView | null
  personName?: string
  /** full=完整八字页；liunian=独立流年模块（顶栏 Tab） */
  mode?: 'full' | 'liunian'
}

function stemTextColor(wx: WuXing): string {
  if (wx === '金') return '#5c5c5c'
  if (wx === '土') return '#8d6e00'
  return WUXING_COLOR[wx]
}

function PillarCard({ p, isDay }: { p: PillarView; isDay?: boolean }) {
  return (
    <div className={`bazi-pillar${isDay ? ' is-day' : ''}`}>
      <div className="bazi-pillar-label">
        {p.label}
        {p.isLu ? <i className="tag-lu">禄</i> : null}
        {p.isYangRen ? <i className="tag-ren">刃</i> : null}
      </div>
      <div
        className="bazi-stem"
        style={{ background: WUXING_BG[p.stemWx], color: stemTextColor(p.stemWx) }}
        title={`${p.stemYy}${p.stemWx} · ${p.stemShiShen}`}
      >
        <span className="gz">{p.stem}</span>
        <span className="meta">
          {p.stemWx}·{p.stemShiShen}
        </span>
      </div>
      <div
        className="bazi-branch"
        style={{ background: WUXING_BG[p.branchWx], color: stemTextColor(p.branchWx) }}
        title={`${p.branchYy}${p.branchWx} · ${p.changSheng}`}
      >
        <span className="gz">{p.branch}</span>
        <span className="meta">
          {p.branchWx}·{p.changSheng}
        </span>
      </div>
      <div className="bazi-nayin">{p.nayin}</div>
      <div className="bazi-hidden">
        {p.hidden.map((h) => (
          <div key={h.stem} className="hidden-row">
            <span style={{ color: stemTextColor(h.wuxing), fontWeight: 700 }}>{h.stem}</span>
            <span className="muted">{h.wuxing}</span>
            <span className="ss">{h.shiShen}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function LiunianBlock({
  bazi,
  liunian,
  liunianYear,
  setLiunianYear,
  liunianStrip,
  thisYear,
}: {
  bazi: BaziView
  liunian: LiunianView
  liunianYear: number
  setLiunianYear: (y: number | ((prev: number) => number)) => void
  liunianStrip: LiunianView[]
  thisYear: number
}) {
  const birthYear = parseBirthYear(bazi.solarDate)

  return (
    <div className="panel bazi-liunian-panel" id="bazi-liunian">
      <div className="bazi-liunian-head">
        <h3 className="bazi-section-title" style={{ margin: 0 }}>
          流年运势
        </h3>
        <div className="bazi-liunian-controls">
          <button
            type="button"
            className="bazi-ln-btn"
            onClick={() => setLiunianYear((y) => y - 1)}
            aria-label="上一年"
          >
            ‹
          </button>
          <label className="bazi-ln-year-label">
            <span className="muted">年份</span>
            <input
              type="number"
              className="bazi-ln-year-input"
              value={liunianYear}
              min={birthYear ?? 1900}
              max={2100}
              onChange={(e) => {
                const v = Number(e.target.value)
                if (Number.isFinite(v)) setLiunianYear(Math.round(v))
              }}
            />
          </label>
          <button
            type="button"
            className="bazi-ln-btn"
            onClick={() => setLiunianYear((y) => y + 1)}
            aria-label="下一年"
          >
            ›
          </button>
          <button
            type="button"
            className="bazi-ln-btn bazi-ln-today"
            onClick={() => setLiunianYear(thisYear)}
          >
            今年
          </button>
        </div>
      </div>

      <div className="bazi-liunian-main">
        <div className="bazi-liunian-pillar">
          <div className="bazi-ln-year-tag">{liunian.year}年</div>
          <div
            className="bazi-stem"
            style={{
              background: WUXING_BG[liunian.stemWx],
              color: stemTextColor(liunian.stemWx),
            }}
          >
            <span className="gz">{liunian.stem}</span>
            <span className="meta">
              {liunian.stemWx}·{liunian.stemShiShen}
            </span>
          </div>
          <div
            className="bazi-branch"
            style={{
              background: WUXING_BG[liunian.branchWx],
              color: stemTextColor(liunian.branchWx),
            }}
          >
            <span className="gz">{liunian.branch}</span>
            <span className="meta">
              {liunian.branchWx}·{liunian.changSheng}
            </span>
          </div>
          <div className="bazi-nayin">{liunian.nayin}</div>
          <div className="bazi-ln-meta">
            {liunian.age > 0 ? <span>虚岁约 {liunian.age} 岁</span> : null}
            {liunian.dayun ? (
              <span>
                大运 {liunian.dayun.label}（第{liunian.dayun.index}步）
              </span>
            ) : (
              <span className="muted">未落入示意大运</span>
            )}
          </div>
          <div className="bazi-hidden">
            {liunian.hidden.map((h) => (
              <div key={h.stem} className="hidden-row">
                <span style={{ color: stemTextColor(h.wuxing), fontWeight: 700 }}>{h.stem}</span>
                <span className="muted">{h.wuxing}</span>
                <span className="ss">{h.shiShen}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bazi-liunian-detail">
          <div className="bazi-ln-summary">{liunian.analysis.summary}</div>
          {liunian.analysis.paragraphs.map((p, i) => (
            <p key={i} className="bazi-ln-p">
              {p}
            </p>
          ))}
          {liunian.relations.length > 0 ? (
            <>
              <h4 className="bazi-ln-sub">与原局刑冲合害</h4>
              <ul className="bazi-rel-list">
                {liunian.relations.map((r, i) => (
                  <li key={`${r.type}-${i}`}>
                    <span className="rel-type">{r.type}</span>
                    <span>{r.detail}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="muted" style={{ marginTop: 8 }}>
              与原局未见明显刑冲合害
            </p>
          )}
          {liunian.analysis.bullets.length > 0 ? (
            <>
              <h4 className="bazi-ln-sub">流年要点</h4>
              <ul className="bazi-ln-bullets">
                {liunian.analysis.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </>
          ) : null}
        </div>
      </div>

      <h4 className="bazi-ln-sub" style={{ marginTop: 14 }}>
        邻近流年
      </h4>
      <div className="bazi-liunian-strip">
        {liunianStrip.map((item) => (
          <button
            type="button"
            key={item.year}
            className={`liunian-card${item.year === liunianYear ? ' is-active' : ''}${item.year === thisYear ? ' is-now' : ''}`}
            onClick={() => setLiunianYear(item.year)}
          >
            <div className="ln-year">{item.year}</div>
            <div className="ln-gz" style={{ color: stemTextColor(item.stemWx) }}>
              {item.label}
            </div>
            <div className="ln-ss">{item.stemShiShen}</div>
            {item.age > 0 ? <div className="ln-age">{item.age}岁</div> : null}
          </button>
        ))}
      </div>
      <p className="hint">
        流年干支按公历年近似（甲子=公元4年），未精算立春交节；虚岁=公历年−出生年+1；与大运、原局关系供学习参考。
      </p>
    </div>
  )
}

export function BaziPanel({ bazi, personName, mode = 'full' }: Props) {
  const analysis = useMemo(() => (bazi ? analyzeBazi(bazi) : null), [bazi])
  const thisYear = new Date().getFullYear()
  const [liunianYear, setLiunianYear] = useState(thisYear)

  const liunian = useMemo(
    () => (bazi ? buildLiunian(bazi, liunianYear) : null),
    [bazi, liunianYear],
  )

  const liunianStrip = useMemo(() => {
    if (!bazi) return []
    return buildLiunianRange(bazi, liunianYear - 4, liunianYear + 5)
  }, [bazi, liunianYear])

  if (!bazi || !analysis || !liunian) {
    return (
      <div className="panel empty-state">
        <h2>{mode === 'liunian' ? '流年' : '八字排盘'}</h2>
        <p className="muted">请先填写生辰并排盘</p>
      </div>
    )
  }

  const wxOrder: WuXing[] = ['木', '火', '土', '金', '水']
  const maxSimple = Math.max(...wxOrder.map((w) => bazi.wuxingCountSimple[w]), 1)
  const ssKeys = Object.keys(bazi.shiShenCount).sort(
    (a, b) => (bazi.shiShenCount[b] || 0) - (bazi.shiShenCount[a] || 0),
  )

  const dayunActiveIndex = liunian.dayun?.index

  const liunianBlock = (
    <LiunianBlock
      bazi={bazi}
      liunian={liunian}
      liunianYear={liunianYear}
      setLiunianYear={setLiunianYear}
      liunianStrip={liunianStrip}
      thisYear={thisYear}
    />
  )

  const dayunBlock = (
    <div className="panel" id="bazi-dayun">
      <h3 className="bazi-section-title">大运（{bazi.dayunDir}行）</h3>
      <p className="hint" style={{ marginTop: 0 }}>
        {bazi.dayunNote}
      </p>
      <div className="bazi-dayun-row">
        {bazi.dayun.map((d) => (
          <div
            key={d.index}
            className={`dayun-card${dayunActiveIndex === d.index ? ' is-active' : ''}`}
          >
            <div className="dayun-age">
              {d.ageFrom}–{d.ageTo}岁
            </div>
            <div className="dayun-gz" style={{ color: stemTextColor(d.stemWx) }}>
              {d.label}
            </div>
            <div className="dayun-nayin">{d.nayin}</div>
          </div>
        ))}
      </div>
    </div>
  )

  /* 独立流年 Tab：精简头 + 四柱摘要 + 大运 + 流年 */
  if (mode === 'liunian') {
    return (
      <div className="bazi-page" id="bazi-capture">
        <div className="panel bazi-header-panel">
          <div className="bazi-title-row">
            <h2>流年</h2>
            <span className="bazi-person">{personName || '命主'}</span>
          </div>
          <div className="bazi-meta-line">
            <span>
              {bazi.gender} · 公历 {bazi.solarDate}
            </span>
            <span>农历 {bazi.lunarDate}</span>
            <span>{bazi.timeLabel}</span>
          </div>
          <div className="bazi-fulltext">{bazi.fullText}</div>
          <div className="bazi-dm-grid">
            <div>
              日主：
              <strong style={{ color: stemTextColor(bazi.dayMasterWx) }}>{bazi.dayMaster}</strong>
              <span className="muted">
                （{bazi.dayMasterYy}
                {bazi.dayMasterWx}）
              </span>
            </div>
            <div>
              月令：<strong>{bazi.deLing}</strong>
            </div>
            <div>
              当前查看：
              <strong>
                {liunian.year}年 {liunian.label}
              </strong>
              <span className="muted"> · {liunian.stemShiShen}</span>
            </div>
          </div>
        </div>
        {dayunBlock}
        {liunianBlock}
      </div>
    )
  }

  return (
    <div className="bazi-page" id="bazi-capture">
      <div className="panel bazi-header-panel">
        <div className="bazi-title-row">
          <h2>八字排盘</h2>
          <span className="bazi-person">{personName || '命主'}</span>
        </div>
        <div className="bazi-meta-line">
          <span>
            {bazi.gender} · 公历 {bazi.solarDate}
          </span>
          <span>农历 {bazi.lunarDate}</span>
          <span>{bazi.timeLabel}</span>
        </div>
        <div className="bazi-fulltext">{bazi.fullText}</div>
        <div className="bazi-dm-grid">
          <div>
            日主：
            <strong style={{ color: stemTextColor(bazi.dayMasterWx) }}>{bazi.dayMaster}</strong>
            <span className="muted">
              （{bazi.dayMasterYy}
              {bazi.dayMasterWx}）
            </span>
          </div>
          <div>
            空亡：<strong>{bazi.kongWang.join('')}</strong>
          </div>
          <div>
            禄神在：<strong>{bazi.luBranch}</strong>
          </div>
          <div>
            羊刃在：<strong>{bazi.yangRenBranch}</strong>
          </div>
          <div>
            胎元：<strong>{bazi.taiYuan}</strong>
          </div>
          <div>
            命宫：<strong>{bazi.mingGong}</strong>
          </div>
          <div>
            身宫：<strong>{bazi.shenGong}</strong>
          </div>
          <div>
            月令：<strong>{bazi.deLing}</strong>
          </div>
        </div>
        <p className="bazi-strength-hint">{bazi.strengthHint}</p>
        <p className="hint" style={{ marginBottom: 0 }}>
          今年流年 {liunian.label}（{liunian.stemShiShen}
          {liunian.age > 0 ? ` · 虚岁约${liunian.age}` : ''}）· 详见顶栏「流年」（位于八字与命盘之间）
        </p>
      </div>

      <div className="panel">
        <h3 className="bazi-section-title">四柱详盘</h3>
        <div className="bazi-pillars">
          {bazi.pillars.map((p) => (
            <PillarCard key={p.label} p={p} isDay={p.label === '日柱'} />
          ))}
        </div>
        <p className="hint bazi-legend">
          天干：五行·十神 · 地支：五行·日主十二长生 · 纳音 · 藏干及十神。角标「禄」「刃」为日主禄/羊刃落宫。
        </p>
      </div>

      <div className="panel">
        <h3 className="bazi-section-title">十二长生（日主）</h3>
        <div className="bazi-cs-grid">
          {bazi.pillars.map((p) => (
            <div key={p.label} className="bazi-cs-cell">
              <span className="muted">{p.label}</span>
              <strong>
                {p.stem}
                {p.branch}
              </strong>
              <span className="cs-name">{p.changSheng}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bazi-two-col">
        <div className="panel">
          <h3 className="bazi-section-title">五行（天干+地支）</h3>
          <div className="bazi-wx-bars">
            {wxOrder.map((w) => {
              const n = bazi.wuxingCountSimple[w]
              const pct = (n / maxSimple) * 100
              return (
                <div key={w} className="wx-bar-row">
                  <span className="wx-name" style={{ color: stemTextColor(w) }}>
                    {w}
                  </span>
                  <div className="wx-track">
                    <div
                      className="wx-fill"
                      style={{
                        width: `${pct}%`,
                        background: WUXING_COLOR[w] === '#f5f5f5' ? '#bdbdbd' : WUXING_COLOR[w],
                      }}
                    />
                  </div>
                  <span className="wx-num">{n}</span>
                </div>
              )
            })}
          </div>
          <p className="hint">
            藏干合计：木{bazi.wuxingCount['木']} 火{bazi.wuxingCount['火']} 土
            {bazi.wuxingCount['土']} 金{bazi.wuxingCount['金']} 水{bazi.wuxingCount['水']}
          </p>
        </div>

        <div className="panel">
          <h3 className="bazi-section-title">十神统计（干+藏干）</h3>
          <div className="bazi-ss-tags">
            {ssKeys.map((k) => (
              <span key={k} className="ss-tag">
                {k} <b>{bazi.shiShenCount[k]}</b>
              </span>
            ))}
          </div>
          <div className="bazi-ss-grid" style={{ marginTop: 12 }}>
            {bazi.pillars.map((p) => (
              <div key={p.label} className="bazi-ss-cell">
                <span className="muted">{p.label}</span>
                <strong>
                  {p.stem}
                  {p.branch}
                </strong>
                <span className={p.stemShiShen === '日主' ? 'ss-day' : ''}>{p.stemShiShen}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="panel">
        <h3 className="bazi-section-title">刑冲合害</h3>
        {bazi.relations.length === 0 ? (
          <p className="muted">无</p>
        ) : (
          <ul className="bazi-rel-list">
            {bazi.relations.map((r, i) => (
              <li key={`${r.type}-${i}`}>
                <span className="rel-type">{r.type}</span>
                <span>{r.detail}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="panel">
        <h3 className="bazi-section-title">神煞</h3>
        {bazi.shenSha.length === 0 ? (
          <p className="muted">未见常见神煞</p>
        ) : (
          <div className="bazi-shensha">
            {bazi.shenSha.map((s, i) => (
              <div key={`${s.name}-${s.at}-${i}`} className="shensha-chip">
                <strong>{s.name}</strong>
                <span>{s.at}</span>
                {s.note ? <em>{s.note}</em> : null}
              </div>
            ))}
          </div>
        )}
        <p className="hint">含天乙、文昌、太极、桃花、驿马、华盖、将星、劫煞、天德月德、禄刃等常见项。</p>
      </div>

      {dayunBlock}

      <div className="panel bazi-analysis-panel">
        <h3 className="bazi-section-title">八字解析</h3>
        <div className="bazi-analysis-summary">{analysis.summary}</div>
        {analysis.sections.map((sec) => (
          <section key={sec.id} className={`bazi-analysis-sec level-${sec.level || 'info'}`}>
            <h4>{sec.title}</h4>
            {sec.paragraphs.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
            {sec.bullets && sec.bullets.length > 0 ? (
              <ul>
                {sec.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
        <p className="bazi-analysis-disclaimer">{analysis.disclaimer}</p>
      </div>
    </div>
  )
}
