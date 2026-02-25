import React from 'react';
import { HEALTH_COLORS } from '../../styles/tokens';

type BadgeVariant = 'good' | 'warning' | 'bad' | 'neutral';

interface StatusBadgeProps {
  /** Вариант: good/warning/bad/neutral */
  variant: BadgeVariant;
  /** Текст бейджа */
  children: React.ReactNode;
}

const VARIANT_COLORS: Record<BadgeVariant, string> = {
  good: HEALTH_COLORS.excellent,
  warning: HEALTH_COLORS.moderate,
  bad: HEALTH_COLORS.poor,
  neutral: HEALTH_COLORS.neutral,
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ variant, children }) => {
  const color = VARIANT_COLORS[variant];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 9999,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: '16px',
        color,
        backgroundColor: `${color}26`,
      }}
    >
      {children}
    </span>
  );
};
