import React from 'react';
import { getScoreColor } from '../../utils/colors';

interface HealthScoreRingProps {
  /** Значение 0-100 */
  value: number;
  /** Подпись под числом */
  label?: string;
  /** Размер SVG в px */
  size?: number;
  /** Толщина кольца */
  strokeWidth?: number;
  /** Цвет (auto по значению если не задан) */
  color?: string;
}

export const HealthScoreRing: React.FC<HealthScoreRingProps> = ({
  value,
  label,
  size = 120,
  strokeWidth = 8,
  color,
}) => {
  const clampedValue = Math.max(0, Math.min(100, value));
  const resolvedColor = color ?? getScoreColor(clampedValue);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clampedValue / 100);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-block' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Фон кольца */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--plm-border, #c6c6c8)"
          strokeWidth={strokeWidth}
          opacity={0.3}
        />
        {/* Прогресс */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease-out' }}
        />
      </svg>
      {/* Число в центре */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 700,
            color: resolvedColor,
            lineHeight: 1.1,
          }}
        >
          {Math.round(clampedValue)}
        </span>
        {label && (
          <span
            style={{
              fontSize: size * 0.1,
              color: 'var(--plm-text-hint, #8e8e93)',
              marginTop: 2,
            }}
          >
            {label}
          </span>
        )}
      </div>
    </div>
  );
};
