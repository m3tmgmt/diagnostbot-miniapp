// Страница замеров — последние значения + графики трендов (Phase 4.0.1)
// Интеграция @plemya/design-system: HEALTH_COLORS для цветовой палитры замеров
import { useEffect, useState } from 'react';
import { Section } from '@telegram-apps/telegram-ui';
import { HEALTH_COLORS, TgLoader, TgErrorView, TgEmptyState } from '@plemya/design-system';
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
  getMeasurements,
  getLatestMeasurements,
  type MeasurementRow,
} from '../api/supabase';

// Конфиг типов замеров — цвета из @plemya/design-system
const MEASUREMENT_CONFIG = {
  weight: { emoji: '⚖️', name: 'Вес', unit: 'кг', color: HEALTH_COLORS.nutrition, valueKey: 'kg' },
  blood_pressure: { emoji: '💓', name: 'Давление', unit: 'мм рт.ст.', color: HEALTH_COLORS.poor, valueKey: 'systolic' },
  pulse: { emoji: '💗', name: 'Пульс', unit: 'уд/мин', color: HEALTH_COLORS.moderate, valueKey: 'bpm' },
  temperature: { emoji: '🌡️', name: 'Температура', unit: '°C', color: HEALTH_COLORS.biometrics, valueKey: 'celsius' },
} as const;

type MeasurementType = keyof typeof MEASUREMENT_CONFIG;
const ALL_TYPES: MeasurementType[] = ['weight', 'blood_pressure', 'pulse', 'temperature'];

// Оценка нормы (упрощённая версия из бота) — цвета из design-system
function assessNorm(type: MeasurementType, value: Record<string, number>): { label: string; color: string } {
  switch (type) {
    case 'blood_pressure': {
      const sys = value.systolic;
      const dia = value.diastolic;
      if (sys < 120 && dia < 80) return { label: 'Норма', color: HEALTH_COLORS.excellent };
      if (sys < 140 && dia < 90) return { label: 'Повышенное', color: HEALTH_COLORS.moderate };
      return { label: 'Высокое', color: HEALTH_COLORS.poor };
    }
    case 'pulse': {
      const bpm = value.bpm;
      if (bpm >= 60 && bpm <= 100) return { label: 'Норма', color: HEALTH_COLORS.excellent };
      return { label: bpm < 60 ? 'Брадикардия' : 'Тахикардия', color: HEALTH_COLORS.moderate };
    }
    case 'temperature': {
      const c = value.celsius;
      if (c >= 36.1 && c <= 37.2) return { label: 'Норма', color: HEALTH_COLORS.excellent };
      if (c > 37.2 && c <= 38) return { label: 'Субфебрильная', color: HEALTH_COLORS.moderate };
      return { label: c > 38 ? 'Повышенная' : 'Пониженная', color: HEALTH_COLORS.poor };
    }
    default:
      return { label: 'Записано', color: HEALTH_COLORS.excellent };
  }
}

// Форматирование значения для отображения
function formatValue(type: MeasurementType, value: Record<string, number>): string {
  switch (type) {
    case 'weight': return `${value.kg} кг`;
    case 'blood_pressure': return `${value.systolic}/${value.diastolic}`;
    case 'pulse': return `${value.bpm} уд/мин`;
    case 'temperature': return `${value.celsius} °C`;
  }
}

// Подготовка данных для Recharts (хронологический порядок)
function toChartData(rows: MeasurementRow[]) {
  return rows
    .slice()
    .reverse()
    .map((r) => ({
      date: new Date(r.measured_at).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
      ...r.value,
    }));
}

interface MeasurementsTabProps {
  onBack: () => void;
}

export function MeasurementsTab({ onBack }: MeasurementsTabProps) {
  useBackButton(onBack);
  const { userId } = useTelegram();
  const [latest, setLatest] = useState<Record<string, MeasurementRow>>({});
  const [history, setHistory] = useState<Record<string, MeasurementRow[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    Promise.all([
      getLatestMeasurements(userId),
      // Загружаем историю для всех типов
      ...ALL_TYPES.map((t) => getMeasurements(userId, t, 20)),
    ]).then(([latestData, ...historyArrays]) => {
      setLatest(latestData);
      const hist: Record<string, MeasurementRow[]> = {};
      ALL_TYPES.forEach((t, i) => {
        hist[t] = historyArrays[i];
      });
      setHistory(hist);
    }).catch((err) => {
      console.error('[MeasurementsTab] Ошибка загрузки:', err);
      setError('Не удалось загрузить замеры');
    }).finally(() => {
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return <TgLoader text="Загрузка замеров..." />;
  }

  if (error) {
    return <TgErrorView message={error} onRetry={() => window.location.reload()} />;
  }

  const hasAny = ALL_TYPES.some((t) => latest[t]);

  if (!hasAny) {
    return (
      <TgEmptyState
        icon="📏"
        title="Нет замеров"
        description="Запиши первый замер в боте — напиши «мой вес 80 кг» или «давление 120/80»"
      />
    );
  }

  return (
    <div className="pb-4">
      {/* Последние значения */}
      <Section header="📊 Мои замеры">
        <div className="px-4 py-2 space-y-2">
          {ALL_TYPES.map((type) => {
            const row = latest[type];
            if (!row) return null;
            const config = MEASUREMENT_CONFIG[type];
            const norm = assessNorm(type, row.value);
            const dateStr = new Date(row.measured_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'short',
            });

            return (
              <div
                key={type}
                className="flex items-center justify-between py-2 border-b border-tg-separator last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{config.emoji}</span>
                  <div>
                    <div className="font-medium">{config.name}</div>
                    <div className="text-xs text-tg-hint">{dateStr}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatValue(type, row.value)}</div>
                  <div className="text-xs" style={{ color: norm.color }}>
                    {norm.label}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      {/* Графики трендов */}
      {ALL_TYPES.map((type) => {
        const rows = history[type];
        if (!rows || rows.length < 2) return null;

        const config = MEASUREMENT_CONFIG[type];
        const chartData = toChartData(rows);

        return (
          <Section key={type} header={`${config.emoji} Тренд: ${config.name}`}>
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
                    width={40}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      background: 'var(--tg-theme-bg-color, #fff)',
                      border: '1px solid var(--tg-theme-hint-color, #ccc)',
                    }}
                  />
                  {type === 'blood_pressure' ? (
                    <>
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        stroke={HEALTH_COLORS.poor}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Систолическое"
                      />
                      <Line
                        type="monotone"
                        dataKey="diastolic"
                        stroke={HEALTH_COLORS.biometrics}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        name="Диастолическое"
                      />
                    </>
                  ) : (
                    <Line
                      type="monotone"
                      dataKey={config.valueKey}
                      stroke={config.color}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      name={config.name}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Section>
        );
      })}
    </div>
  );
}
