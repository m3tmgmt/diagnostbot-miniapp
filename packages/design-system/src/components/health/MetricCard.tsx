import React from 'react';
import { HEALTH_COLORS, TYPOGRAPHY, RADIUS, SPACING, TOUCH } from '../../styles/tokens';
import { useTheme } from '../../providers/ThemeProvider';

interface MetricCardProps {
  label: string;           // "Вес", "Давление"
  value: string | number;  // "82.5", "120/80"
  unit?: string;           // "кг", "мм рт.ст."
  icon?: React.ReactNode;
  status?: 'good' | 'warning' | 'danger' | 'neutral';
  onPress?: () => void;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  label,
  value,
  unit,
  icon,
  status = 'neutral',
  onPress,
}) => {
  const theme = useTheme();
  const statusColor = {
    good: HEALTH_COLORS.excellent,
    warning: HEALTH_COLORS.moderate,
    danger: HEALTH_COLORS.poor,
    neutral: theme.hintColor,
  }[status];

  return (
    <div
      onClick={onPress}
      style={{
        background: theme.secondaryBgColor,
        borderRadius: RADIUS.md,
        padding: SPACING.md,
        minHeight: TOUCH.minTarget,
        cursor: onPress ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
        gap: SPACING.sm,
        borderLeft: `3px solid ${statusColor}`,
      }}
    >
      {icon && <div style={{ flexShrink: 0 }}>{icon}</div>}
      <div style={{ flex: 1 }}>
        <div style={{
          fontSize: TYPOGRAPHY.caption.fontSize,
          color: theme.hintColor,
        }}>
          {label}
        </div>
        <div style={{
          fontSize: TYPOGRAPHY.h3.fontSize,
          fontWeight: TYPOGRAPHY.h3.fontWeight,
          color: theme.textColor,
        }}>
          {value} {unit && <span style={{ fontSize: TYPOGRAPHY.bodySmall.fontSize, color: theme.hintColor }}>{unit}</span>}
        </div>
      </div>
    </div>
  );
};
