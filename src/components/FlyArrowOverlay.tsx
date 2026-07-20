import type { FlyArrow } from '../lib/flyStar'
import { branchCenterPercent, MUTAGEN_COLOR } from '../lib/flyStar'

type Props = {
  arrows: FlyArrow[]
  showNatal: boolean
  showSelf: boolean
}

/** SVG 飞星箭头层：叠在 4×4 盘面上 */
export function FlyArrowOverlay({ arrows, showNatal, showSelf }: Props) {
  const list = arrows.filter(
    (a) => (a.kind === 'natal' && showNatal) || (a.kind === 'self' && showSelf),
  )

  return (
    <svg className="fly-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
      <defs>
        {(['禄', '权', '科', '忌'] as const).map((m) => (
          <marker
            key={m}
            id={`arrow-${m}`}
            markerWidth="4"
            markerHeight="4"
            refX="3"
            refY="2"
            orient="auto"
          >
            <path d="M0,0 L4,2 L0,4 Z" fill={MUTAGEN_COLOR[m]} />
          </marker>
        ))}
      </defs>

      {list.map((a) => {
        const to = branchCenterPercent(a.toBranch)
        if (!to) return null
        const color = MUTAGEN_COLOR[a.mutagen]

        if (a.kind === 'self') {
          // 自化：宫内小弧箭头
          const x = to.x
          const y = to.y
          return (
            <g key={a.id} className="fly-self">
              <path
                d={`M ${x - 4} ${y + 3} Q ${x} ${y - 5} ${x + 4} ${y + 3}`}
                fill="none"
                stroke={color}
                strokeWidth="0.7"
                markerEnd={`url(#arrow-${a.mutagen})`}
                opacity={0.9}
              />
              <text
                x={x}
                y={y - 5.5}
                textAnchor="middle"
                fontSize="2.4"
                fill={color}
                fontWeight="700"
              >
                自{a.mutagen}
              </text>
            </g>
          )
        }

        // 生年四化：从命宫飞向落宫
        const from = branchCenterPercent(a.fromBranch)
        if (!from) return null
        if (from.x === to.x && from.y === to.y) {
          // 同宫：画短折线
          return (
            <g key={a.id}>
              <circle cx={to.x} cy={to.y - 6} r="1.2" fill={color} />
              <text
                x={to.x}
                y={to.y - 8}
                textAnchor="middle"
                fontSize="2.2"
                fill={color}
                fontWeight="700"
              >
                {a.mutagen}
              </text>
            </g>
          )
        }

        const mx = (from.x + to.x) / 2
        const my = (from.y + to.y) / 2
        // 控制点略作垂直偏移，避免重叠
        const dx = to.x - from.x
        const dy = to.y - from.y
        const len = Math.hypot(dx, dy) || 1
        const ox = (-dy / len) * 6
        const oy = (dx / len) * 6
        const c1x = mx + ox
        const c1y = my + oy

        return (
          <g key={a.id} className="fly-natal">
            <path
              d={`M ${from.x} ${from.y} Q ${c1x} ${c1y} ${to.x} ${to.y}`}
              fill="none"
              stroke={color}
              strokeWidth="0.55"
              strokeDasharray={a.mutagen === '忌' ? '1.2 0.8' : undefined}
              markerEnd={`url(#arrow-${a.mutagen})`}
              opacity={0.75}
            />
            <text
              x={c1x}
              y={c1y}
              textAnchor="middle"
              fontSize="2.1"
              fill={color}
              fontWeight="700"
              opacity={0.95}
            >
              {a.star}
              {a.mutagen}
            </text>
          </g>
        )
      })}
    </svg>
  )
}
