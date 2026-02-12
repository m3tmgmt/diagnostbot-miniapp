// Страница дневника — check-in история: streak + сегодня + тренды + список (Phase 4.1.1)
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
import { getCheckins, calculateStreakFromRows, type CheckinRow } from '../api/supabase';

// Конфиг метрик check-in
const CHECKIN_CONFIG = {
  mood:          { emoji: '\u{1F60A}', name: 'Настроение', color: '#4CAF50', key: 'mood' as const },
  energy_level:  { emoji: '\u26A1',    name: 'Энергия',    color: '#FF9800', key: 'energy_level' as const },
  sleep_quality: { emoji: '\u{1F634}', name: 'Сон',        color: '#2196F3', key: 'sleep_quality' as const },
  stress_level:  { emoji: '\u{1F9D8}', name: 'Стресс',     color: '#9C27B0', key: 'stress_level' as const },
} as const;

type MetricKey = keyof typeof CHECKIN_CONFIG;
const ALL_METRICS: MetricKey[] = ['mood', 'energy_level', 'sleep_quality', 'stress_level'];

// Emoji-лейблы для значений 1-5
const METRIC_LABELS: Record<MetricKey, Record<number, string>> = {
  mood:          { 1: '\u{1F61E}', 2: '\u{1F614}', 3: '\u{1F610}', 4: '\u{1F642}', 5: '\u{1F604}' },
  energy_level:  { 1: '\u{1FAAB}', 2: '\u{1F634}', 3: '\u{1F50B}', 4: '\u26A1',    5: '\u{1F525}' },
  sleep_quality: { 1: '\u{1F635}', 2: '\u{1F629}', 3: '\u{1F610}', 4: '\u{1F60C}', 5: '\u{1F607}' },
  stress_level:  { 1: '\u{1F60C}', 2: '\u{1F642}', 3: '\u{1F610}', 4: '\u{1F630}', 5: '\u{1F92F}' },
};

// Текстовые лейблы для значений 1-5
const METRIC_TEXT: Record<MetricKey, Record<number, string>> = {
  mood:          { 1: 'Ужасное', 2: 'Плохое', 3: 'Нормальное', 4: 'Хорошее', 5: 'Отличное' },
  energy_level:  { 1: 'Нет сил', 2: 'Вялый', 3: 'Средне', 4: 'Бодрый', 5: 'Энергия!' },
  sleep_quality: { 1: 'Кошмар', 2: 'Плохо', 3: 'Нормально', 4: 'Хорошо', 5: 'Прекрасно' },
  stress_level:  { 1: 'Спокоен', 2: 'Немного', 3: 'Умеренный', 4: 'Сильный', 5: 'Критический' },
};

// Подготовка данных для Recharts (хронологический порядок, последние 14 дней)
function toChartData(rows: CheckinRow[]) {
  return rows
    .slice(0, 14)
    .reverse()
    .map((r) => ({
      date: new Date(r.checked_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      mood: r.mood,
      energy_level: r.energy_level,
      sleep_quality: r.sleep_quality,
      stress_level: r.stress_level,
    }));
}

// Форматирование даты для списка
function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });
}

interface DiaryTabProps {
  onBack: () => void;
}

export function DiaryTab({ onBack }: DiaryTabProps) {
  useBackButton(onBack);
  const { userId } = useTelegram();
  const [checkins, setCheckins] = useState<CheckinRow[]>([]);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getCheckins(userId, 30).then((data) => {
      setCheckins(data);
      setStreak(calculateStreakFromRows(data));
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

  if (checkins.length === 0) {
    return (
      <Placeholder
        header="Нет check-ins"
        description={'Напиши \u00AB\u0447\u0435\u043A\u0438\u043D\u00BB в боте, чтобы записать самочувствие'}
      />
    );
  }

  const today = new Date().toISOString().slice(0, 10);
  const todayCheckin = checkins.find(
    (c) => new Date(c.checked_at).toISOString().slice(0, 10) === today,
  );
  const chartData = toChartData(checkins);
  const lastDate = new Date(checkins[0].checked_at).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <div className="pb-4">
      {/* Streak Card */}
      <Section header={'\u{1F525} Streak'}>
        <div className="px-4 py-3">
          <div className="text-center">
            <div className="text-3xl font-bold">
              {streak > 0 ? `\u{1F525} ${streak}` : '\u{1F331} 0'}
            </div>
            <div className="text-sm text-tg-hint mt-1">
              {streak > 0
                ? `${streak} ${streak === 1 ? 'день' : streak < 5 ? 'дня' : 'дней'} подряд!`
                : 'Начни серию check-ins!'}
            </div>
            <div className="text-xs text-tg-hint mt-1">
              Последний check-in: {lastDate}
            </div>
          </div>
        </div>
      </Section>

      {/* Сегодняшний check-in */}
      {todayCheckin && (
        <Section header={'\u{1F4CB} Сегодня'}>
          <div className="px-4 py-2 space-y-2">
            {ALL_METRICS.map((metric) => {
              const val = todayCheckin[metric];
              if (val == null) return null;
              const config = CHECKIN_CONFIG[metric];
              const emojiLabel = METRIC_LABELS[metric][val] ?? '';
              const textLabel = METRIC_TEXT[metric][val] ?? '';

              return (
                <div
                  key={metric}
                  className="flex items-center justify-between py-1 border-b border-tg-separator last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{config.emoji}</span>
                    <span className="font-medium">{config.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-lg mr-1">{emojiLabel}</span>
                    <span className="text-sm text-tg-hint">{textLabel} ({val})</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Section>
      )}

      {/* Тренд-график (4 метрики) */}
      {chartData.length >= 2 && (
        <Section header={'\u{1F4C8} Тренды (14 дней)'}>
          <div className="px-2 py-3" style={{ height: 220 }}>
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
                  width={25}
                  domain={[1, 5]}
                  ticks={[1, 2, 3, 4, 5]}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    background: 'var(--tg-theme-bg-color, #fff)',
                    border: '1px solid var(--tg-theme-hint-color, #ccc)',
                  }}
                  formatter={(value: number, name: string) => {
                    const metric = name as MetricKey;
                    const config = CHECKIN_CONFIG[metric];
                    if (!config) return [value, name];
                    const emojiLabel = METRIC_LABELS[metric]?.[value] ?? '';
                    return [`${emojiLabel} ${value}`, config.name];
                  }}
                />
                {ALL_METRICS.map((metric) => (
                  <Line
                    key={metric}
                    type="monotone"
                    dataKey={metric}
                    stroke={CHECKIN_CONFIG[metric].color}
                    strokeWidth={2}
                    dot={{ r: 2 }}
                    name={metric}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
          {/* Легенда */}
          <div className="flex justify-center gap-3 pb-2 text-xs">
            {ALL_METRICS.map((metric) => (
              <div key={metric} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: CHECKIN_CONFIG[metric].color }}
                />
                <span className="text-tg-hint">{CHECKIN_CONFIG[metric].name}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* История (последние записи) */}
      <Section header={'\u{1F4C5} История'}>
        <div className="px-4 py-2 space-y-1">
          {checkins.slice(0, 14).map((row) => (
            <div
              key={row.id}
              className="flex items-center justify-between py-2 border-b border-tg-separator last:border-b-0"
            >
              <div className="text-sm font-medium text-tg-hint">
                {formatDate(row.checked_at)}
              </div>
              <div className="flex gap-2 text-sm">
                {ALL_METRICS.map((metric) => {
                  const val = row[metric];
                  if (val == null) return null;
                  const emojiLabel = METRIC_LABELS[metric][val] ?? '';
                  return (
                    <span key={metric} title={CHECKIN_CONFIG[metric].name}>
                      {emojiLabel}{val}
                    </span>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Section>
    </div>
  );
}
