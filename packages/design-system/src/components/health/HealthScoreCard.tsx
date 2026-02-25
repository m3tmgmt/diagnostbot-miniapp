import React from 'react';
import { HEALTH_COLORS, TYPOGRAPHY, RADIUS, SPACING } from '../../styles/tokens';
import { useTheme } from '../../providers/ThemeProvider';
import { getScoreColor } from '../../utils/colors';

interface HealthScoreCardProps {
  score: number;        // 0-100
  label?: string;       // "Health Score"
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;  // +5, -3
  size?: 'sm' | 'md' | 'lg';
}

export const HealthScoreCard: React.FC<HealthScoreCardProps> = ({
  score,
  label = 'Health Score',
  trend,
  trendValue,
  size = 'md'
}) => {
  const theme = useTheme();
  const color = getScoreColor(score);
  const scoreSize = size === 'lg' ? 64 : size === 'md' ? 48 : 32;

  return (
    <div style={{
      background: theme.secondaryBgColor,
      borderRadius: RADIUS.lg,
      padding: SPACING.lg,
      textAlign: 'center',
    }}>
      <div style={{
        fontSize: scoreSize,
        fontWeight: 700,
        color,
        lineHeight: 1.1,
      }}>
        {Math.round(score)}
      </div>
      <div style={{
        fontSize: TYPOGRAPHY.caption.fontSize,
        color: theme.hintColor,
        marginTop: SPACING.xs,
      }}>
        {label}
      </div>
      {trend && trendValue !== undefined && (
        <div style={{
          fontSize: TYPOGRAPHY.caption.fontSize,
          color: trend === 'up' ? HEALTH_COLORS.excellent :
                 trend === 'down' ? HEALTH_COLORS.poor :
                 HEALTH_COLORS.neutral,
          marginTop: SPACING.xs,
        }}>
          {trend === 'up' ? '\u2191' : trend === 'down' ? '\u2193' : '\u2192'} {Math.abs(trendValue)}
        </div>
      )}
    </div>
  );
};
