import { useRef } from 'react'
import type { CaseRecord } from '../types'
import { TIME_OPTIONS } from '../lib/time'

type Props = {
  cases: CaseRecord[]
  activeId?: string
  onSelect: (c: CaseRecord) => void
  onDelete: (id: string) => void
  onExport: () => void
  onImport: (text: string) => void
  onSaveCurrent: () => void
}

export function CaseLibrary({
  cases,
  activeId,
  onSelect,
  onDelete,
  onExport,
  onImport,
  onSaveCurrent,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null)

  return (
    <div className="panel">
      <div className="panel-hd">
        <h2>命例库</h2>
        <div className="row-actions">
          <button type="button" className="btn" onClick={onSaveCurrent}>
            保存当前
          </button>
          <button type="button" className="btn" onClick={onExport}>
            导出
          </button>
          <button type="button" className="btn" onClick={() => fileRef.current?.click()}>
            导入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={async (e) => {
              const f = e.target.files?.[0]
              if (!f) return
              onImport(await f.text())
              e.target.value = ''
            }}
          />
        </div>
      </div>
      {!cases.length ? (
        <p className="muted">尚无命例，排盘后可保存</p>
      ) : (
        <ul className="case-list">
          {cases.map((c) => {
            const t = TIME_OPTIONS.find((x) => x.index === c.timeIndex)
            return (
              <li key={c.id} className={c.id === activeId ? 'active' : ''}>
                <button type="button" className="case-main" onClick={() => onSelect(c)}>
                  <strong>{c.name || '未命名'}</strong>
                  <span>
                    {c.gender} · {c.solarDate} · {t?.label || c.timeIndex}
                  </span>
                  {c.note ? <em>{c.note}</em> : null}
                </button>
                <button
                  type="button"
                  className="btn danger ghost"
                  onClick={() => onDelete(c.id)}
                  title="删除"
                >
                  ✕
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
