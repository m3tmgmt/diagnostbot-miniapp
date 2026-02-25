// График тренда лабораторного показателя с зоной нормы (Recharts)
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from 'recharts';

interface LabTrendChartProps {
  /** Точки данных [{date, value}] отсортированные по дате ASC */
  data: Array<{ date: string; value: number }>;
  /** Нижняя граница нормы */
  refMin?: number;
  /** Верхняя граница нормы */
  refMax?: number;
  /** Единица измерения */
  unit: string;
  /** Русское название биомаркера */
  nameRu: string;
}

/** Цвет точки по отношению к норме */
function getDotColor(value: number, refMin?: number, refMax?: number): string {
  if (refMin === undefined || refMax === undefined) return 'var(--tg-theme-link-color, #007aff)';
  const range = refMax - refMin;
  const critMargin = range * 0.3;
  if (value < refMin - critMargin || value > refMax + critMargin) return '#ff3b30';
  if (value < refMin || value > refMax) return '#ff9500';
  return '#34c759';
}

export function LabTrendChart({ data, refMin, refMax, unit, nameRu }: LabTrendChartProps) {
  if (data.length === 0) {
    return <div className="text-center text-tg-hint p-4">Нет данных для графика</div>;
  }

  // Форматируем даты для отображения
  const chartData = data.map(d => ({
    ...d,
    dateLabel: new Date(d.date).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    }),
  }));

  // Автодиапазон Y с учётом reference lines
  const values = data.map(d => d.value);
  const allValues = [...values];
  if (refMin !== undefined) allValues.push(refMin);
  if (refMax !== undefined) allValues.push(refMax);
  const yMin = Math.floor(Math.min(...allValues) * 0.9);
  const yMax = Math.ceil(Math.max(...allValues) * 1.1);

  return (
    <div className="w-full" style={{ height: 260 }}>
      <div className="text-sm font-medium px-2 mb-1">{nameRu}, {unit}</div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--tg-theme-hint-color, #8e8e93)"
            opacity={0.3}
          />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: 'var(--tg-theme-hint-color, #8e8e93)', fontSize: 11 }}
          />
          <YAxis
            domain={[yMin, yMax]}
            tick={{ fill: 'var(--tg-theme-hint-color, #8e8e93)', fontSize: 11 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--tg-theme-bg-color, #1c1c1e)',
              border: '1px solid var(--tg-theme-hint-color, #8e8e93)',
              borderRadius: '8px',
              color: 'var(--tg-theme-text-color, #fff)',
            }}
            formatter={(val: number) => [`${val} ${unit}`, nameRu]}
          />

          {/* Зона нормы */}
          {refMin !== undefined && refMax !== undefined && (
            <ReferenceArea
              y1={refMin}
              y2={refMax}
              fill="#34c759"
              fillOpacity={0.08}
            />
          )}

          {/* Линии нормы */}
          {refMin !== undefined && (
            <ReferenceLine
              y={refMin}
              stroke="#34c759"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{ value: `${refMin}`, position: 'insideBottomRight', fontSize: 10, fill: '#34c759' }}
            />
          )}
          {refMax !== undefined && (
            <ReferenceLine
              y={refMax}
              stroke="#34c759"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
              label={{ value: `${refMax}`, position: 'insideTopRight', fontSize: 10, fill: '#34c759' }}
            />
          )}

          {/* Линия данных */}
          <Line
            type="monotone"
            dataKey="value"
            stroke="var(--tg-theme-link-color, #007aff)"
            strokeWidth={2}
            dot={(props: { cx: number; cy: number; payload: { value: number } }) => {
              const color = getDotColor(props.payload.value, refMin, refMax);
              return (
                <circle
                  cx={props.cx}
                  cy={props.cy}
                  r={5}
                  fill={color}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              );
            }}
            activeDot={{ r: 7 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
