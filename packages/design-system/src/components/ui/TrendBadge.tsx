import React from 'react';

interface TrendBadgeProps {
  /** Числовое значение тренда (положительное = рост, отрицательное = падение) */
  value: number;
  /** Единица измерения */
  unit?: string;
}

export const TrendBadge: React.FC<TrendBadgeProps> = ({ value, unit = '' }) => {
  const isPositive = value > 0;
  const isNegative = value < 0;
  const arrow = isPositive ? '↑' : isNegative ? '↓' : '→';
  const color = isPositive
    ? 'var(--plm-health-good, #34c759)'
    : isNegative
      ? 'var(--plm-health-bad, #ff3b30)'
      : 'var(--plm-text-hint, #8e8e93)';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        fontSize: 13,
        fontWeight: 500,
        color,
      }}
    >
      {arrow} {isPositive ? '+' : ''}{value}{unit}
    </span>
  );
};
