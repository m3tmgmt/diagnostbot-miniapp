// Горизонтальный bar chart метрик осанки (цвет по статусу)
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell as RechartsCell } from 'recharts';
import type { PostureMetric } from '../types/diagnostics';

interface MetricBarProps {
  metrics: Record<string, PostureMetric>;
}

const METRIC_NAMES: Record<string, string> = {
  head_level: 'Голова',
  spine_angle: 'Позвоночник',
  shoulder_height: 'Плечи',
  anterior_pelvic_tilt: 'Таз (наклон)',
  pelvic_rotation: 'Таз (ротация)',
  lateral_spinal_drift: 'Боков. смещ.',
  hip_level: 'Бёдра',
  knee_bend: 'Колени',
};

const STATUS_COLORS: Record<string, string> = {
  good: '#34c759',
  warning: '#ff9500',
  critical: '#ff3b30',
};

export function MetricBar({ metrics }: MetricBarProps) {
  const data = Object.entries(metrics).map(([key, m]) => ({
    name: METRIC_NAMES[key] ?? key,
    score: m.score,
    status: m.status,
  }));

  if (data.length === 0) return null;

  return (
    <div className="w-full" style={{ height: data.length * 40 + 20 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 70, bottom: 5 }}>
          <XAxis
            type="number"
            domain={[0, 100]}
            tick={{ fill: 'var(--tg-theme-hint-color, #8e8e93)', fontSize: 10 }}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: 'var(--tg-theme-text-color, #fff)', fontSize: 11 }}
            width={65}
          />
          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
            {data.map((entry, index) => (
              <RechartsCell
                key={index}
                fill={STATUS_COLORS[entry.status] ?? '#8e8e93'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
