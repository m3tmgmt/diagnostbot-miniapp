// Страница детального результата — баллы, тренд, метрики, рекомендации
import { useEffect, useState } from 'react';
import { Section, Spinner, Cell } from '@telegram-apps/telegram-ui';
import { TrendChart } from '../components/TrendChart';
import { MetricBar } from '../components/MetricBar';
import { useTelegram, useBackButton } from '../hooks/useTelegram';
import { getResultById, getResultsByTest } from '../api/supabase';
import type { DiagnosticResult, PostureMetric } from '../types/diagnostics';

interface ResultPageProps {
  resultId: string;
  onBack: () => void;
}

const TEST_NAMES: Record<string, string> = {
  body_scan_full_body_video: 'Body Scan \u2014 \u041F\u043E\u043B\u043D\u043E\u0435 \u0441\u043A\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435',
  body_scan_eye_tracking: 'Eye Tracking \u2014 \u041A\u043E\u0433\u043D\u0438\u0442\u0438\u0432\u043D\u044B\u0439 \u0441\u043A\u0440\u0438\u043D\u0438\u043D\u0433',
};

export function ResultPage({ resultId, onBack }: ResultPageProps) {
  const { userId } = useTelegram();
  useBackButton(onBack);

  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [trendData, setTrendData] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const r = await getResultById(resultId);
      setResult(r);
      if (r && userId) {
        const trend = await getResultsByTest(userId, r.test_id, 10);
        setTrendData(trend);
      }
      setLoading(false);
    };
    load();
  }, [resultId, userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="l" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="p-4 text-center text-tg-hint">
        Результат не найден
      </div>
    );
  }

  const testName = TEST_NAMES[result.test_id] ?? result.test_id;
  const metrics = result.result_data?.metrics as Record<string, PostureMetric> | undefined;
  const recommendations = result.result_data?.recommendations ?? [];

  return (
    <div>
      {/* Заголовок */}
      <Section>
        <div className="p-4">
          <div className="text-lg font-semibold">{testName}</div>
          <div className="text-sm text-tg-hint mt-1">
            {new Date(result.executed_at).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="mt-3 text-4xl font-bold">
            {result.score ?? '\u2014'}/100
          </div>
        </div>
      </Section>

      {/* Тренд */}
      {trendData.length > 1 && (
        <Section header="Тренд">
          <div className="px-2 pb-2">
            <TrendChart results={trendData} />
          </div>
        </Section>
      )}

      {/* Метрики */}
      {metrics && Object.keys(metrics).length > 0 && (
        <Section header="Детальные метрики">
          <div className="px-2 pb-2">
            <MetricBar metrics={metrics} />
          </div>
        </Section>
      )}

      {/* Рекомендации */}
      {recommendations.length > 0 && (
        <Section header="Рекомендации">
          {recommendations.map((rec, i) => (
            <Cell key={i} multiline>
              {`\u2022 ${rec}`}
            </Cell>
          ))}
        </Section>
      )}

      {/* Уверенность анализа */}
      {result.ai_confidence != null && (
        <Section>
          <Cell subtitle={`${Math.round(result.ai_confidence * 100)}%`}>
            Уверенность анализа
          </Cell>
        </Section>
      )}
    </div>
  );
}
