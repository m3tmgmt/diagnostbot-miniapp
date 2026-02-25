import { HEALTH_COLORS } from '../styles/tokens';

/** Определяет цвет по score (0-100): зелёный ≥80, good ≥60, жёлтый ≥40, красный ≥20, критичный <20 */
export const getScoreColor = (score: number): string => {
  if (score >= 80) return HEALTH_COLORS.excellent;
  if (score >= 60) return HEALTH_COLORS.good;
  if (score >= 40) return HEALTH_COLORS.moderate;
  if (score >= 20) return HEALTH_COLORS.poor;
  return HEALTH_COLORS.critical;
};

/** Определяет статус по score: good ≥60, warning ≥40, bad <40 */
export const getScoreStatus = (score: number): 'good' | 'warning' | 'bad' => {
  if (score >= 60) return 'good';
  if (score >= 40) return 'warning';
  return 'bad';
};
