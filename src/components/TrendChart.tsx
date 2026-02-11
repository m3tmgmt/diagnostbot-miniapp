// Линейный график тренда баллов по времени (Recharts)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { DiagnosticResult } from '../types/diagnostics';

interface TrendChartProps {
  results: DiagnosticResult[];
}

export function TrendChart({ results }: TrendChartProps) {
  // От старого к новому (слева направо)
  const data = [...results].reverse().map((r) => ({
    score: r.score ?? 0,
    date: new Date(r.executed_at).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    }),
  }));

  if (data.length === 0) {
    return <div className="text-center text-tg-hint p-4">Нет данных для графика</div>;
  }

  return (
    <div className="w-full" style={{ height: 240 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--tg-theme-hint-color, #8e8e93)"
            opacity={0.3}
          />
          <XAxis
            dataKey="date"
            tick={{ fill: 'var(--tg-theme-hint-color, #8e8e93)', fontSize: 12 }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: 'var(--tg-theme-hint-color, #8e8e93)', fontSize: 12 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tg-theme-bg-color, #1c1c1e)',
              border: '1px solid var(--tg-theme-hint-color, #8e8e93)',
              borderRadius: '8px',
              color: 'var(--tg-theme-text-color, #fff)',
            }}
          />
          <Line
            type="monotone"
            dataKey="score"
            stroke="var(--tg-theme-link-color, #007aff)"
            strokeWidth={2}
            dot={{ fill: 'var(--tg-theme-link-color, #007aff)', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
