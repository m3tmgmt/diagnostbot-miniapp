// Визуальный gauge для отображения балла (SVG полукруг)

interface ScoreGaugeProps {
  score: number;
  maxScore: number;
  color?: string;
  size?: number;
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
  // Дуга идёт по часовой (sweep-flag = 0 для нашей ориентации)
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 0 ${x2} ${y2}`;
}

export function ScoreGauge({ score, maxScore, color, size = 160 }: ScoreGaugeProps) {
  const ratio = Math.min(Math.max(score / maxScore, 0), 1);
  const radius = (size - 24) / 2;
  const cx = size / 2;
  const cy = size / 2 + 10;

  // Цвет по проценту (если не задан явно)
  const defaultColor = ratio >= 0.85 ? '#34c759'
    : ratio >= 0.7 ? '#a8d44a'
    : ratio >= 0.55 ? '#ff9500'
    : '#ff3b30';
  const gaugeColor = color ?? defaultColor;

  // Углы полукруга: от π (слева) до 0 (справа)
  const startAngle = Math.PI;
  const endAngle = 0;
  // Заполненная часть: от startAngle до (startAngle - ratio * π)
  const filledEndAngle = startAngle - ratio * Math.PI;

  const bgPath = describeArc(cx, cy, radius, endAngle, startAngle);
  const filledPath = ratio > 0
    ? describeArc(cx, cy, radius, filledEndAngle, startAngle)
    : '';

  return (
    <div className="flex flex-col items-center">
      <svg
        width={size}
        height={size / 2 + 30}
        viewBox={`0 0 ${size} ${size / 2 + 30}`}
      >
        {/* Фоновая дуга */}
        <path
          d={bgPath}
          fill="none"
          stroke="var(--tg-theme-hint-color, #8e8e93)"
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
          fill="var(--tg-theme-text-color, #fff)"
          fontSize={32}
          fontWeight="bold"
        >
          {score}
        </text>
        {/* Из максимума */}
        <text
          x={cx} y={cy + 14}
          textAnchor="middle"
          fill="var(--tg-theme-hint-color, #8e8e93)"
          fontSize={14}
        >
          из {maxScore}
        </text>
      </svg>
    </div>
  );
}
