import React from 'react';

interface SparklineProps {
  /** Массив числовых значений */
  data: number[];
  /** Ширина SVG */
  width?: number;
  /** Высота SVG */
  height?: number;
  /** Цвет линии */
  color?: string;
}

export const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 60,
  height = 24,
  color = 'var(--plm-text-link, #007aff)',
}) => {
  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
      const y = height - padding - ((val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
};
