// Страница Health Score — главная метрика здоровья (Phase 4.7)
// Интеграция @plemya/design-system: HealthScoreCard, MetricCard, HEALTH_COLORS
import { useEffect, useState } from 'react';
import { Section } from '@telegram-apps/telegram-ui';
import { HealthScoreCard, MetricCard, HEALTH_COLORS, TgLoader, TgErrorView, TgEmptyState } from '@plemya/design-system';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useTelegram, useBackButton } from '../hooks/useTelegram';
import {
  getLatestHealthScore,
  getHealthScoreHistory,
  type HealthScoreRow,
} from '../api/supabase';

// Конфиг компонентов Health Score
const COMPONENT_CONFIG = [
  { key: 'activity_score' as const, emoji: '\u{1F4AA}', name: 'Активность' },
  { key: 'sleep_score' as const,    emoji: '\u{1F634}', name: 'Сон' },
  { key: 'nutrition_score' as const, emoji: '\u{1F957}', name: 'Питание' },
  { key: 'mental_score' as const,     emoji: '\u{1F9D8}', name: 'Ментальное здоровье' },
  { key: 'recovery_score' as const,  emoji: '\u{1F486}', name: 'Восстановление' },
  { key: 'biometrics_score' as const, emoji: '\u{1F4CB}', name: 'Биометрия' },
];

type ComponentKey = typeof COMPONENT_CONFIG[number]['key'];

/** Текстовая оценка по баллу */
function getScoreLabel(score: number): string {
  if (score >= 90) return 'Отлично';
  if (score >= 75) return 'Хорошо';
  if (score >= 60) return 'Нормально';
  if (score >= 40) return 'Требует внимания';
  return 'Критично';
}

/** Статус MetricCard по значению компонента */
function getComponentStatus(val: number): 'good' | 'warning' | 'danger' {
  if (val >= 60) return 'good';
  if (val >= 40) return 'warning';
  return 'danger';
}

/** Подготовка данных для графика тренда */
function toChartData(rows: HealthScoreRow[]) {
  return rows.map((r) => ({
    date: new Date(r.calculated_at).toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    }),
    score: r.score,
  }));
}

interface HealthScoreTabProps {
  onBack: () => void;
}

export function HealthScoreTab({ onBack }: HealthScoreTabProps) {
  useBackButton(onBack);
  const { userId } = useTelegram();
  const [latest, setLatest] = useState<HealthScoreRow | null>(null);
  const [history, setHistory] = useState<HealthScoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    Promise.all([
      getLatestHealthScore(userId),
      getHealthScoreHistory(userId, 30),
    ]).then(([latestData, historyData]) => {
      setLatest(latestData);
      setHistory(historyData);
    }).catch((err) => {
      console.error('[HealthScoreTab] Ошибка загрузки:', err);
      setError('Не удалось загрузить данные');
    }).finally(() => {
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <TgLoader text="Загрузка Health Score..." />;
  }

  if (error) {
    return <TgErrorView message={error} onRetry={() => window.location.reload()} />;
  }

  if (!latest) {
    return (
      <TgEmptyState
        icon="🩺"
        title="Нет данных"
        description="Используй /health в боте чтобы рассчитать Health Score"
      />
    );
  }

  const scoreLabel = getScoreLabel(latest.score);
  const chartData = toChartData(history);

  // Тренд: сравниваем с предыдущим значением из истории
  let trend: 'up' | 'down' | 'stable' | undefined;
  let trendValue: number | undefined;
  if (history.length >= 2) {
    const prevScore = history[history.length - 2]?.score;
    if (prevScore !== undefined) {
      trendValue = latest.score - prevScore;
      trend = trendValue > 0 ? 'up' : trendValue < 0 ? 'down' : 'stable';
    }
  }

  // Находим самый слабый компонент для рекомендации
  let weakest: { key: ComponentKey; name: string; value: number } | null = null;
  for (const comp of COMPONENT_CONFIG) {
    const val = latest[comp.key];
    if (val != null && (weakest === null || val < weakest.value)) {
      weakest = { key: comp.key, name: comp.name, value: val };
    }
  }

  const formattedDate = new Date(latest.calculated_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="pb-4">
      {/* Основной Score — HealthScoreCard из design-system */}
      <Section header={'\u{1FA7A} Health Score'}>
        <div className="px-4 py-4">
          <HealthScoreCard
            score={latest.score}
            label={scoreLabel}
            trend={trend}
            trendValue={trendValue}
            size="lg"
          />
          <div className="text-xs text-tg-hint mt-2 text-center">
            Обновлено: {formattedDate}
          </div>
        </div>
      </Section>

      {/* Компоненты — MetricCard из design-system */}
      <Section header={'\u{1F4CA} Компоненты'}>
        <div className="px-4 py-3 space-y-2">
          {COMPONENT_CONFIG.map((comp) => {
            const val = latest[comp.key];
            if (val == null) return null;

            return (
              <MetricCard
                key={comp.key}
                label={comp.name}
                value={val}
                unit="/100"
                icon={<span>{comp.emoji}</span>}
                status={getComponentStatus(val)}
              />
            );
          })}
        </div>
      </Section>

      {/* Тренд (30 дней) */}
      {chartData.length >= 2 && (
        <Section header={'\u{1F4C8} Тренд (30 дней)'}>
          <div className="px-2 py-3" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                  domain={[0, 100]}
                  ticks={[0, 25, 50, 75, 100]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    background: 'var(--tg-theme-bg-color, #fff)',
                    border: '1px solid var(--tg-theme-hint-color, #ccc)',
                  }}
                  formatter={(value: number) => [`${value}/100`, 'Health Score']}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke={HEALTH_COLORS.excellent}
                  strokeWidth={2}
                  dot={{ r: 3, fill: HEALTH_COLORS.excellent }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Section>
      )}

      {/* Рекомендация */}
      {weakest && weakest.value < 80 && (
        <Section header={'\u{1F4A1} Рекомендация'}>
          <div className="px-4 py-3">
            <div className="text-sm">
              Улучши <strong>{weakest.name.toLowerCase()}</strong> ({weakest.value}/100) — это даст +3-5 к общему Score
            </div>
          </div>
        </Section>
      )}
    </div>
  );
}
