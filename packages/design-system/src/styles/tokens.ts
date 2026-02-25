// Размеры и отступы
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Touch targets (Apple HIG + наши health-specific)
export const TOUCH = {
  minTarget: 44,    // Минимальный тач-таргет
  recommended: 48,  // Рекомендованный
  large: 56,        // Для health виджетов
  gap: 8,           // Минимальный зазор между targets
} as const;

// Border radius
export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

// Health-specific цвета (дополнение к Telegram theme)
export const HEALTH_COLORS = {
  excellent: '#34C759',  // 80-100
  good: '#30D158',       // 60-79
  moderate: '#FF9500',   // 40-59
  poor: '#FF3B30',       // 20-39
  critical: '#FF2D55',   // 0-19
  neutral: '#8E8E93',

  // Score ring colors
  activity: '#FF6B35',
  nutrition: '#34C759',
  sleep: '#5856D6',
  mental: '#FF9500',
  recovery: '#30D158',
  biometrics: '#007AFF',
} as const;

// Типография (относительно Telegram theme)
export const TYPOGRAPHY = {
  h1: { fontSize: 28, fontWeight: 700, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: 600, lineHeight: 28 },
  h3: { fontSize: 17, fontWeight: 600, lineHeight: 22 },
  body: { fontSize: 17, fontWeight: 400, lineHeight: 22 },
  bodySmall: { fontSize: 15, fontWeight: 400, lineHeight: 20 },
  caption: { fontSize: 13, fontWeight: 400, lineHeight: 18 },
  score: { fontSize: 48, fontWeight: 700, lineHeight: 56 },
} as const;

// Animation durations
export const ANIMATION = {
  fast: 150,
  normal: 300,
  slow: 500,
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;
