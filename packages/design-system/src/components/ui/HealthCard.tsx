import React from 'react';
import { HEALTH_COLORS } from '../../styles/tokens';
import { Sparkline } from './Sparkline';

type CardStatus = 'good' | 'warning' | 'bad' | 'neutral';

interface HealthCardProps {
  /** Заголовок (uppercase, мелкий) */
  title: string;
  /** Основное значение */
  value: string | number;
  /** Единица измерения */
  unit?: string;
  /** Статус для цветной полоски слева */
  status?: CardStatus;
  /** Подзаголовок */
  subtitle?: string;
  /** Иконка/эмоджи */
  icon?: React.ReactNode;
  /** Данные для мини-графика */
  sparklineData?: number[];
  /** Обработчик клика */
  onClick?: () => void;
}

const STATUS_COLORS: Record<CardStatus, string> = {
  good: HEALTH_COLORS.excellent,
  warning: HEALTH_COLORS.moderate,
  bad: HEALTH_COLORS.poor,
  neutral: HEALTH_COLORS.neutral,
};

export const HealthCard: React.FC<HealthCardProps> = ({
  title,
  value,
  unit,
  status = 'neutral',
  subtitle,
  icon,
  sparklineData,
  onClick,
}) => {
  const borderColor = STATUS_COLORS[status];

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--plm-bg-secondary, #f2f2f7)',
        borderRadius: 12,
        padding: 12,
        borderLeft: `3px solid ${borderColor}`,
        cursor: onClick ? 'pointer' : 'default',
        minHeight: 44,
        position: 'relative',
      }}
    >
      {/* Sparkline в правом верхнем углу */}
      {sparklineData && sparklineData.length >= 2 && (
        <div style={{ position: 'absolute', top: 8, right: 8 }}>
          <Sparkline data={sparklineData} color={borderColor} />
        </div>
      )}

      {/* Заголовок */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 500,
          color: 'var(--plm-text-hint, #8e8e93)',
          textTransform: 'uppercase',
          letterSpacing: 0.5,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {icon && <span>{icon}</span>}
        {title}
      </div>

      {/* Значение */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--plm-text, #000000)',
          marginTop: 4,
        }}
      >
        {value}
        {unit && (
          <span
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: 'var(--plm-text-hint, #8e8e93)',
              marginLeft: 2,
            }}
          >
            {unit}
          </span>
        )}
      </div>

      {/* Подзаголовок */}
      {subtitle && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--plm-text-hint, #8e8e93)',
            marginTop: 2,
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
