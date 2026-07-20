import { useCallback, useMemo, useState } from 'react'
import html2canvas from 'html2canvas'
import { BirthForm } from './components/BirthForm'
import { CaseLibrary } from './components/CaseLibrary'
import { ChartBoard } from './components/ChartBoard'
import { FlyStarPanel } from './components/FlyStarPanel'
import { GejuPanel } from './components/GejuPanel'
import { HoroscopePanel } from './components/HoroscopePanel'
import { BaziPanel } from './components/BaziPanel'
import {
  deleteCase,
  exportCasesJson,
  importCasesJson,
  loadCases,
  upsertCase,
} from './lib/cases'
import { buildChart, buildHoroscope, type ChartView, type HoroscopeView } from './lib/chart'
import { matchGeju } from './lib/geju'
import { solarToLunar } from './lib/lunar'
import type { BirthInput, CaseRecord, SkinMode } from './types'
import './App.css'

const today = () => new Date().toISOString().slice(0, 10)

function makeDefaultBirth(): BirthInput {
  let lunar = { year: 1989, month: 12, day: 5, isLeap: false }
  try {
    lunar = solarToLunar('1990-01-01')
  } catch {
    /* keep default */
  }
  return {
    name: '',
    gender: '男',
    calendarType: 'solar',
    solarDate: '1990-01-01',
    lunarYear: lunar.year,
    lunarMonth: lunar.month,
    lunarDay: lunar.day,
    isLeapMonth: lunar.isLeap,
    timeIndex: 1,
    clockHour: 1,
    clockMinute: 0,
    useTrueSolar: false,
    longitude: 116.41,
    cityName: '北京',
    note: '',
    category: '默认',
  }
}

export default function App() {
  const [birth, setBirth] = useState<BirthInput>(makeDefaultBirth)
  const [chart, setChart] = useState<ChartView | null>(null)
  const [horoscope, setHoroscope] = useState<HoroscopeView | null>(null)
  const [flowDate, setFlowDate] = useState(today())
  const [skin, setSkin] = useState<SkinMode>('sanhe')
  const [algorithm, setAlgorithm] = useState<'default' | 'zhongzhou'>('default')
  const [showMinor, setShowMinor] = useState(true)
  const [showAdj, setShowAdj] = useState(false)
  const [showFlyNatal, setShowFlyNatal] = useState(true)
  const [showFlySelf, setShowFlySelf] = useState(true)
  const [cases, setCases] = useState<CaseRecord[]>(() => loadCases())
  const [activeCaseId, setActiveCaseId] = useState<string>()
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'chart' | 'geju' | 'cases' | 'fly' | 'bazi' | 'liunian'>(
    'chart',
  )

  const refreshHoroscope = useCallback((c: ChartView, date: string) => {
    try {
      setHoroscope(buildHoroscope(c, date))
    } catch (e) {
      console.error(e)
      setHoroscope(null)
    }
  }, [])

  const doPaipan = useCallback(() => {
    setError('')
    try {
      const c = buildChart(birth, algorithm)
      setChart(c)
      refreshHoroscope(c, flowDate)
      setTab('chart')
    } catch (e) {
      setError(e instanceof Error ? e.message : '排盘失败')
      setChart(null)
      setHoroscope(null)
    }
  }, [birth, algorithm, flowDate, refreshHoroscope])

  const gejuHits = useMemo(() => {
    if (!chart) return []
    try {
      return matchGeju(chart)
    } catch (e) {
      console.error('格局分析失败', e)
      return []
    }
  }, [chart])

  const onFlowDate = (d: string) => {
    setFlowDate(d)
    if (chart) refreshHoroscope(chart, d)
  }

  const onSaveCase = () => {
    const rec = upsertCase(birth, activeCaseId)
    setActiveCaseId(rec.id)
    setCases(loadCases())
  }

  const onSelectCase = (c: CaseRecord) => {
    const next: BirthInput = {
      ...makeDefaultBirth(),
      ...c,
      calendarType: c.calendarType || 'solar',
      lunarYear: c.lunarYear || makeDefaultBirth().lunarYear,
      lunarMonth: c.lunarMonth || 1,
      lunarDay: c.lunarDay || 1,
      isLeapMonth: !!c.isLeapMonth,
      clockHour: c.clockHour ?? 12,
      clockMinute: c.clockMinute ?? 0,
      useTrueSolar: !!c.useTrueSolar,
      longitude: c.longitude ?? 120,
    }
    setBirth(next)
    setActiveCaseId(c.id)
    try {
      const ch = buildChart(next, algorithm)
      setChart(ch)
      refreshHoroscope(ch, flowDate)
      setTab('chart')
    } catch (e) {
      setError(e instanceof Error ? e.message : '排盘失败')
    }
  }

  const onScreenshot = async () => {
    const el = document.getElementById('chart-capture')
    if (!el) return
    const canvas = await html2canvas(el, {
      backgroundColor: skin === 'sihua' ? '#0f1419' : '#f7f1e5',
      scale: 2,
    })
    const a = document.createElement('a')
    a.download = `紫微命盘_${birth.name || '未命名'}_${chart?.solarDate || birth.solarDate}.png`
    a.href = canvas.toDataURL('image/png')
    a.click()
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <h1>紫垣天机</h1>
          <p>
            紫微斗数排盘 · 真太阳时 · 飞星四化 · 八字流年 ·{' '}
            <a
              className="brand-qq"
              href="mqqapi://card/show_pslcard?src_type=internal&version=1&uin=924998087&card_type=group&source=qrcode"
              title="QQ群：924998087 · 点击唤起QQ加群，失败可复制群号"
              onClick={(e) => {
                try {
                  void navigator.clipboard?.writeText('924998087')
                } catch {
                  /* ignore */
                }
                // 桌面端协议常无效：弹出群号便于复制
                if (!/Mobile|Android|iPhone|iPad/i.test(navigator.userAgent)) {
                  e.preventDefault()
                  window.prompt('QQ群号已尝试复制，可手动再复制：', '924998087')
                }
              }}
            >
              加QQ群一起交流 924998087
            </a>
          </p>
        </div>
        <div className="top-actions">
          <label className="inline">
            盘面
            <select value={skin} onChange={(e) => setSkin(e.target.value as SkinMode)}>
              <option value="sanhe">三合</option>
              <option value="sihua">四化（深色）</option>
              <option value="compact">精简</option>
            </select>
          </label>
          <label className="inline">
            安星
            <select
              value={algorithm}
              onChange={(e) => {
                const a = e.target.value as 'default' | 'zhongzhou'
                setAlgorithm(a)
                if (chart) {
                  try {
                    const c = buildChart(birth, a)
                    setChart(c)
                    refreshHoroscope(c, flowDate)
                  } catch {
                    /* ignore */
                  }
                }
              }}
            >
              <option value="default">默认（全书）</option>
              <option value="zhongzhou">中州</option>
            </select>
          </label>
          <label className="inline check">
            <input
              type="checkbox"
              checked={showMinor}
              onChange={(e) => setShowMinor(e.target.checked)}
            />
            辅星
          </label>
          <label className="inline check">
            <input
              type="checkbox"
              checked={showAdj}
              onChange={(e) => setShowAdj(e.target.checked)}
            />
            杂曜
          </label>
          <button type="button" className="btn" onClick={onScreenshot} disabled={!chart}>
            截图
          </button>
        </div>
      </header>

      <nav className="tabs">
        {(
          [
            ['bazi', '八字'],
            ['liunian', '流年'],
            ['chart', '命盘'],
            ['fly', '飞星'],
            ['geju', '格局'],
            ['cases', '命例'],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            className={tab === k ? 'active' : ''}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </nav>

      {error ? <div className="error-banner">{error}</div> : null}

      <main className="layout">
        <aside className="side">
          <BirthForm
            value={birth}
            onChange={setBirth}
            onSubmit={doPaipan}
            trueSolarHint={chart?.trueSolarSummary}
          />
          {tab === 'chart' ? (
            <HoroscopePanel date={flowDate} onDateChange={onFlowDate} horoscope={horoscope} />
          ) : null}
          {tab === 'fly' ? (
            <FlyStarPanel
              fly={chart?.fly ?? null}
              showNatal={showFlyNatal}
              showSelf={showFlySelf}
              onToggleNatal={setShowFlyNatal}
              onToggleSelf={setShowFlySelf}
            />
          ) : null}
        </aside>

        <section className="main">
          {(tab === 'chart' || tab === 'fly') && (
            <>
              {chart ? (
                <ChartBoard
                  chart={chart}
                  personName={birth.name}
                  skin={skin}
                  mode={tab === 'fly' ? 'fly' : 'chart'}
                  horoscope={horoscope}
                  showMinor={showMinor}
                  showAdj={showAdj}
                  showFlyNatal={showFlyNatal}
                  showFlySelf={showFlySelf}
                />
              ) : (
                <div className="empty-state panel">
                  <h2>尚未排盘</h2>
                  <p>
                    {tab === 'fly'
                      ? '先在「命盘」排好盘，再切换到「飞星」查看四化飞入与自化。'
                      : '支持公历/农历、真太阳时、飞星四化与严格格局。填写左侧生辰后点击「排盘」。'}
                  </p>
                </div>
              )}
            </>
          )}
          {tab === 'bazi' && (
            <BaziPanel bazi={chart?.bazi ?? null} personName={birth.name} mode="full" />
          )}
          {tab === 'liunian' && (
            <BaziPanel bazi={chart?.bazi ?? null} personName={birth.name} mode="liunian" />
          )}
          {tab === 'geju' && <GejuPanel hits={gejuHits} />}
          {tab === 'cases' && (
            <CaseLibrary
              cases={cases}
              activeId={activeCaseId}
              onSelect={onSelectCase}
              onDelete={(id) => {
                deleteCase(id)
                setCases(loadCases())
                if (activeCaseId === id) setActiveCaseId(undefined)
              }}
              onExport={() => {
                const blob = new Blob([exportCasesJson()], { type: 'application/json' })
                const a = document.createElement('a')
                a.href = URL.createObjectURL(blob)
                a.download = `命例库_${today()}.json`
                a.click()
              }}
              onImport={(text) => {
                try {
                  const n = importCasesJson(text)
                  setCases(loadCases())
                  alert(`已导入 ${n} 条命例`)
                } catch (e) {
                  alert(e instanceof Error ? e.message : '导入失败')
                }
              }}
              onSaveCurrent={onSaveCase}
            />
          )}
        </section>
      </main>

      <footer className="footer">
        <span>紫垣天机 · 紫微斗数 / 八字排盘</span>
        <span>仅供学习研究，请勿作为决策唯一依据</span>
      </footer>
    </div>
  )
}
