// Страница детального результата — body scan и опросники
import { useEffect, useState } from 'react';
import { Section, Spinner, Cell } from '@telegram-apps/telegram-ui';
import { TrendChart } from '../components/TrendChart';
import { MetricBar } from '../components/MetricBar';
import { ScoreGauge } from '../components/ScoreGauge';
import { useTelegram, useBackButton } from '../hooks/useTelegram';
import {
  getResultById,
  getResultsByTest,
  getQuestionnaireResultById,
  getQuestionnaireResultsByType,
  toDiagUnified,
  toQuestUnified,
} from '../api/supabase';
import { QUESTIONNAIRE_INFO, getInterpretation } from '../utils/questionnaire';
import type {
  UnifiedResult,
  PostureMetric,
  QuestionnaireType,
  QuestionnaireResultRow,
  DiagnosticResult,
} from '../types/diagnostics';

interface ResultPageProps {
  resultId: string;
  onBack: () => void;
}

// Названия body scan тестов
const TEST_NAMES: Record<string, string> = {
  body_scan_full_body_video: 'Body Scan \u2014 Полное сканирование',
  body_scan_eye_tracking: 'Eye Tracking \u2014 Когнитивный скрининг',
};

/** Конвертация опросников в данные для TrendChart */
function questToTrendData(rows: QuestionnaireResultRow[]): Array<{ score: number; date: string }> {
  return [...rows].reverse().map((r) => ({
    score: r.score,
    date: new Date(r.completed_at).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    }),
  }));
}

export function ResultPage({ resultId, onBack }: ResultPageProps) {
  const { userId } = useTelegram();
  useBackButton(onBack);

  const [result, setResult] = useState<UnifiedResult | null>(null);
  // Тренд для body scan
  const [diagTrend, setDiagTrend] = useState<DiagnosticResult[]>([]);
  // Тренд для опросников
  const [questTrend, setQuestTrend] = useState<Array<{ score: number; date: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Сначала ищем в user_diagnostic_results
      const diagResult = await getResultById(resultId);
      if (diagResult) {
        setResult(toDiagUnified(diagResult));
        if (userId) {
          const trend = await getResultsByTest(userId, diagResult.test_id, 10);
          setDiagTrend(trend);
        }
        setLoading(false);
        return;
      }

      // Если не нашли — ищем в questionnaire_results
      const questResult = await getQuestionnaireResultById(resultId);
      if (questResult) {
        setResult(toQuestUnified(questResult));
        if (userId) {
          const trend = await getQuestionnaireResultsByType(userId, questResult.type, 10);
          setQuestTrend(questToTrendData(trend));
        }
        setLoading(false);
        return;
      }

      // Не найдено ни в одной таблице
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

  // Общие данные
  const formattedDate = new Date(result.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Для опросников
  const isQuest = result.kind === 'questionnaire';
  const questType = result.testId as QuestionnaireType;
  const questInfo = isQuest ? QUESTIONNAIRE_INFO[questType] : null;
  const interp = isQuest && result.score !== null
    ? getInterpretation(questType, result.score)
    : null;

  // Для body scan
  const metrics = !isQuest
    ? (result.resultData?.metrics as Record<string, PostureMetric> | undefined)
    : undefined;
  const recommendations = result.recommendations ?? [];

  // Название теста
  const testName = isQuest
    ? (questInfo?.name ?? result.testId)
    : (TEST_NAMES[result.testId] ?? result.testId);

  return (
    <div>
      {/* Заголовок */}
      <Section>
        <div className="p-4">
          <div className="text-lg font-semibold">{testName}</div>
          <div className="text-sm text-tg-hint mt-1">{formattedDate}</div>
        </div>
      </Section>

      {/* Score Gauge */}
      {result.score !== null && (
        <Section>
          <div className="py-2">
            <ScoreGauge
              score={result.score}
              maxScore={result.maxScore}
              color={interp?.color}
            />
          </div>
        </Section>
      )}

      {/* Интерпретация опросника */}
      {isQuest && interp && (
        <Section header="Интерпретация">
          <Cell
            before={
              <span
                className="inline-block w-3 h-3 rounded-full mr-1"
                style={{ backgroundColor: interp.color }}
              />
            }
            subtitle={result.interpretation}
            multiline
          >
            {interp.label}
          </Cell>
        </Section>
      )}

      {/* Тренд — body scan */}
      {!isQuest && diagTrend.length > 1 && (
        <Section header="Тренд">
          <div className="px-2 pb-2">
            <TrendChart results={diagTrend} />
          </div>
        </Section>
      )}

      {/* Тренд — опросники */}
      {isQuest && questTrend.length > 1 && (
        <Section header="Тренд">
          <div className="px-2 pb-2">
            <TrendChart rawData={questTrend} maxScore={result.maxScore} />
          </div>
        </Section>
      )}

      {/* Метрики (body scan only) */}
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

      {/* Уверенность анализа (body scan only) */}
      {!isQuest && result.aiConfidence != null && (
        <Section>
          <Cell subtitle={`${Math.round(result.aiConfidence * 100)}%`}>
            Уверенность анализа
          </Cell>
        </Section>
      )}
    </div>
  );
}
