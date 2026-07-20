import type { FlyStarSummary } from '../lib/flyStar'
import { MUTAGEN_COLOR } from '../lib/flyStar'

type Props = {
  fly: FlyStarSummary | null
  showNatal: boolean
  showSelf: boolean
  onToggleNatal: (v: boolean) => void
  onToggleSelf: (v: boolean) => void
}

export function FlyStarPanel({
  fly,
  showNatal,
  showSelf,
  onToggleNatal,
  onToggleSelf,
}: Props) {
  return (
    <div className="panel fly-panel">
      <h2>飞星控制</h2>
      <p className="hint" style={{ marginTop: 0 }}>
        当前为「飞星」视图：盘面显示四化箭头与自化标记；「命盘」视图不显示箭头。
      </p>
      <div className="fly-toggles">
        <label>
          <input
            type="checkbox"
            checked={showNatal}
            onChange={(e) => onToggleNatal(e.target.checked)}
          />
          生年四化箭头
        </label>
        <label>
          <input
            type="checkbox"
            checked={showSelf}
            onChange={(e) => onToggleSelf(e.target.checked)}
          />
          宫干自化弧线
        </label>
      </div>
      <div className="fly-legend">
        {(['禄', '权', '科', '忌'] as const).map((m) => (
          <span key={m} style={{ color: MUTAGEN_COLOR[m] }}>
            ● {m}
          </span>
        ))}
      </div>
      {!fly ? (
        <p className="muted">排盘后显示四化飞星</p>
      ) : (
        <>
          <h3>生年四化</h3>
          <ul className="fly-list">
            {fly.natal.length === 0 ? (
              <li className="muted">无</li>
            ) : (
              fly.natal.map((n) => (
                <li key={`${n.mutagen}-${n.star}`}>
                  <b style={{ color: MUTAGEN_COLOR[n.mutagen] }}>{n.mutagen}</b>
                  <span>
                    {n.star} → {n.palace}（{n.branch}）
                  </span>
                </li>
              ))
            )}
          </ul>
          <h3>宫干自化</h3>
          <ul className="fly-list">
            {fly.self.length === 0 ? (
              <li className="muted">无</li>
            ) : (
              fly.self.map((n) => (
                <li key={`self-${n.mutagen}-${n.star}-${n.palace}`}>
                  <b style={{ color: MUTAGEN_COLOR[n.mutagen] }}>自{n.mutagen}</b>
                  <span>
                    {n.palace} · {n.star}
                  </span>
                </li>
              ))
            )}
          </ul>
        </>
      )}
    </div>
  )
}
