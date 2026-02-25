// Визуальный gauge для отображения балла (SVG полукруг)
// Используется: DiagnostBot Mini App (результаты тестов)
// Forward-compatible: можно использовать для любых score (0-N)

import { HEALTH_COLORS } from '../../styles/tokens';

interface ScoreGaugeProps {
  /** Текущий балл */
  score: number;
  /** Максимальный балл */
  maxScore: number;
  /** Цвет дуги (авто-выбор по проценту если не задан) */
  color?: string;
  /** Размер SVG в пикселях */
  size?: number;
  /** Подпись под баллом (по умолчанию "из {maxScore}") */
  subtitle?: string;
}

/** Генерирует SVG path для дуги */
function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number,
): string {
  const x1 = cx + r * Math.cos(startAngle);
  const y1 = cy - r * Math.sin(startAngle);
  const x2 = cx + r * Math.cos(endAngle);
  const y2 = cy - r * Math.sin(endAngle);
  const sweep = endAngle - startAngle;
  const largeArc = Math.abs(sweep) > Math.PI ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`;
}

export function ScoreGauge({ score, maxScore, color, size = 160, subtitle }: ScoreGaugeProps) {
  const ratio = Math.min(Math.max(score / maxScore, 0), 1);
  const radius = (size - 24) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Цвет по проценту (если не задан явно)
  const defaultColor = ratio >= 0.8 ? HEALTH_COLORS.excellent
    : ratio >= 0.6 ? HEALTH_COLORS.good
    : ratio >= 0.4 ? HEALTH_COLORS.moderate
    : HEALTH_COLORS.poor;
  const gaugeColor = color ?? defaultColor;

  // Углы полукруга: от π (слева) до 0 (справа)
  const startAngle = Math.PI;
  const endAngle = 0;
  const filledEndAngle = startAngle - ratio * Math.PI;

  const bgPath = describeArc(cx, cy, radius, endAngle, startAngle);
  const filledPath = ratio > 0
    ? describeArc(cx, cy, radius, filledEndAngle, startAngle)
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg
        width={size}
        height={size / 2 + 30}
        viewBox={`0 0 ${size} ${size / 2 + 30}`}
      >
        {/* Фоновая дуга */}
        <path
          d={bgPath}
          fill="none"
          stroke="var(--plm-text-hint, #8e8e93)"
          strokeWidth={12}
          strokeLinecap="round"
          opacity={0.2}
        />
        {/* Заполненная дуга */}
        {filledPath && (
          <path
            d={filledPath}
            fill="none"
            stroke={gaugeColor}
            strokeWidth={12}
            strokeLinecap="round"
          />
        )}
        {/* Балл */}
        <text
          x={cx} y={cy - 10}
          textAnchor="middle"
          fill="var(--plm-text, #fff)"
          fontSize={32}
          fontWeight="bold"
        >
          {score}
        </text>
        {/* Из максимума */}
        <text
          x={cx} y={cy + 14}
          textAnchor="middle"
          fill="var(--plm-text-hint, #8e8e93)"
          fontSize={14}
        >
          {subtitle ?? `из ${maxScore}`}
        </text>
      </svg>
    </div>
  );
}
