import type { GejuHit } from '../types'

type Props = {
  hits: GejuHit[]
  loading?: boolean
}

export function GejuPanel({ hits }: Props) {
  return (
    <div className="panel geju-panel">
      <h2>格局分析</h2>
      <p className="hint">
        严格结构判定（同宫/夹宫/三方四正等）命中后，附格局库解说。仅供学习参考。
      </p>
      {!hits.length ? (
        <p className="muted">未命中严格入格条件（阈值已提高，避免误报）</p>
      ) : (
        <ul className="geju-list">
          {hits.map((h) => (
            <li key={h.name} className={`geju-item type-${h.type}`}>
              <div className="geju-hd">
                <strong>{h.name}</strong>
                <span className="tag">{h.type}</span>
                <span className="score">置信 {h.score}</span>
              </div>
              <div className="reasons">{h.reasons.join(' · ')}</div>
              {h.poem ? <div className="poem">诗曰：{h.poem}</div> : null}
              {h.condition ? (
                <details>
                  <summary>入格解说</summary>
                  <p>{h.condition}</p>
                  {h.classics?.length ? (
                    <ul>
                      {h.classics.slice(0, 4).map((c) => (
                        <li key={c}>{c}</li>
                      ))}
                    </ul>
                  ) : null}
                </details>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
