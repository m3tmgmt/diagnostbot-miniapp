// Страница Health Score — главная метрика здоровья (Phase 4.7)
import { useEffect, useState } from 'react';
import { Section, Spinner, Placeholder } from '@telegram-apps/telegram-ui';
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
  { key: 'stress_score' as const,   emoji: '\u{1F9D8}', name: 'Стресс' },
  { key: 'recovery_score' as const, emoji: '\u{1F486}', name: 'Восстановление' },
  { key: 'habits_score' as const,   emoji: '\u{1F4CB}', name: 'Привычки' },
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

/** Цвет прогресс-бара по значению */
function getBarColor(value: number): string {
  if (value >= 80) return '#34c759';
  if (value >= 60) return '#ff9500';
  if (value >= 40) return '#ff6b35';
  return '#ff3b30';
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
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="l" />
      </div>
    );
  }

  if (!latest) {
    return (
      <Placeholder
        header="Нет данных"
        description="Используй /health в боте чтобы рассчитать Health Score"
      />
    );
  }

  const scoreLabel = getScoreLabel(latest.score);
  const scoreColor = getBarColor(latest.score);
  const chartData = toChartData(history);

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
      {/* Основной Score */}
      <Section header={'\u{1FA7A} Health Score'}>
        <div className="px-4 py-4">
          <div className="text-center">
            <div className="text-5xl font-bold" style={{ color: scoreColor }}>
              {latest.score}
            </div>
            <div className="text-lg mt-1" style={{ color: scoreColor }}>
              {scoreLabel}
            </div>
            <div className="text-xs text-tg-hint mt-1">
              Обновлено: {formattedDate}
            </div>
          </div>
          {/* Полоса прогресса */}
          <div className="mt-4">
            <div
              className="w-full rounded-full h-3"
              style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #e5e7eb)' }}
            >
              <div
                className="h-3 rounded-full transition-all"
                style={{
                  width: `${latest.score}%`,
                  backgroundColor: scoreColor,
                }}
              />
            </div>
            <div className="flex justify-between text-xs text-tg-hint mt-1">
              <span>0</span>
              <span>100</span>
            </div>
          </div>
        </div>
      </Section>

      {/* Компоненты */}
      <Section header={'\u{1F4CA} Компоненты'}>
        <div className="px-4 py-3 space-y-3">
          {COMPONENT_CONFIG.map((comp) => {
            const val = latest[comp.key];
            if (val == null) return null;
            const color = getBarColor(val);

            return (
              <div key={comp.key}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span>{comp.emoji}</span>
                    <span className="text-sm font-medium">{comp.name}</span>
                  </div>
                  <span className="text-sm font-bold" style={{ color }}>
                    {val}
                  </span>
                </div>
                <div
                  className="w-full rounded-full h-2"
                  style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #e5e7eb)' }}
                >
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${val}%`,
                      backgroundColor: color,
                    }}
                  />
                </div>
              </div>
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
                  stroke="#34c759"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#34c759' }}
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
