// Страница детального результата — body scan, опросники и анализы
import { useEffect, useState } from 'react';
import { Section, Cell } from '@telegram-apps/telegram-ui';
import { TgLoader, TgEmptyState } from '@plemya/design-system';
import { TrendChart } from '../components/TrendChart';
import { LabTrendChart } from '../components/LabTrendChart';
import { MetricBar } from '../components/MetricBar';
import { ScoreGauge } from '../components/ScoreGauge';
import { useTelegram, useBackButton } from '../hooks/useTelegram';
import {
  getResultById,
  getResultsByTest,
  getQuestionnaireResultById,
  getQuestionnaireResultsByType,
  getLabResultById,
  getLabValueHistory,
  toDiagUnified,
  toQuestUnified,
  toLabUnified,
} from '../api/supabase';
import { QUESTIONNAIRE_INFO, getInterpretation, severityEmoji } from '../utils/questionnaire';
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

// Названия категорий анализов
const LAB_CATEGORY_NAMES: Record<string, string> = {
  blood_general: '\u{1FA78} Общий анализ крови',
  blood_biochem: '\u{1F9EA} Биохимия крови',
  hormones: '\u2697\uFE0F Гормоны',
  vitamins: '\u{1F48A} Витамины и микроэлементы',
  urine: '\u{1F9EB} Анализ мочи',
  lipids: '\u{1FAC0} Липидный профиль',
  other: '\u{1F4CB} Анализы',
};

// Emoji статуса значения анализа
const STATUS_EMOJI: Record<string, string> = {
  normal: '\u{1F7E2}',
  low: '\u{1F7E1}',
  high: '\u{1F7E1}',
  critical_low: '\u{1F534}',
  critical_high: '\u{1F534}',
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
  // Тренд для лабораторного показателя
  const [labTrendData, setLabTrendData] = useState<Array<{ date: string; value: number; refMin?: number; refMax?: number }>>([]);
  const [selectedBiomarker, setSelectedBiomarker] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      // Сначала ищем в user_diagnostic_results (с user_id фильтром — IDOR fix)
      const diagResult = await getResultById(resultId, userId);
      if (diagResult) {
        setResult(toDiagUnified(diagResult));
        if (userId) {
          const trend = await getResultsByTest(userId, diagResult.test_id, 10);
          setDiagTrend(trend);
        }
        setLoading(false);
        return;
      }

      // Если не нашли — ищем в questionnaire_results (с user_id фильтром — IDOR fix)
      const questResult = await getQuestionnaireResultById(resultId, userId);
      if (questResult) {
        setResult(toQuestUnified(questResult));
        if (userId) {
          const trend = await getQuestionnaireResultsByType(userId, questResult.type, 10);
          setQuestTrend(questToTrendData(trend));
        }
        setLoading(false);
        return;
      }

      // Ищем в lab_results (с user_id фильтром — IDOR fix)
      const labResult = await getLabResultById(resultId, userId);
      if (labResult) {
        const unified = toLabUnified(labResult);
        setResult(unified);
        // Выбираем первый биомаркер для тренда
        if (unified.labValues && unified.labValues.length > 0) {
          const firstKey = unified.labValues[0].name;
          setSelectedBiomarker(firstKey);
        }
        setLoading(false);
        return;
      }

      // Не найдено ни в одной таблице
      setLoading(false);
    };
    load();
  }, [resultId, userId]);

  // Загрузка тренда при смене биомаркера
  useEffect(() => {
    if (!selectedBiomarker || !userId || result?.kind !== 'lab') return;
    getLabValueHistory(userId, selectedBiomarker, 6).then(setLabTrendData);
  }, [selectedBiomarker, userId, result?.kind]);

  if (loading) {
    return <TgLoader text="Загрузка результата..." />;
  }

  if (!result) {
    return (
      <TgEmptyState
        icon="🔍"
        title="Результат не найден"
        description="Попробуйте вернуться назад"
      />
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
  const isLab = result.kind === 'lab';
  const questType = result.testId as QuestionnaireType;
  const questInfo = isQuest ? QUESTIONNAIRE_INFO[questType] : null;
  const interp = isQuest && result.score !== null
    ? getInterpretation(questType, result.score)
    : null;

  // Для body scan
  const metrics = !isQuest && !isLab
    ? (result.resultData?.metrics as Record<string, PostureMetric> | undefined)
    : undefined;
  const recommendations = result.recommendations ?? [];

  // Название теста
  const testName = isQuest
    ? (questInfo?.name ?? result.testId)
    : isLab
      ? (LAB_CATEGORY_NAMES[result.labCategory ?? ''] ?? '\u{1F9EA} Анализы')
      : (TEST_NAMES[result.testId] ?? result.testId);

  // Для тренда лабораторного — текущий выбранный биомаркер
  const selectedBiomarkerInfo = isLab && selectedBiomarker
    ? result.labValues?.find(v => v.name === selectedBiomarker)
    : null;

  return (
    <div>
      {/* Заголовок */}
      <Section>
        <div className="p-4">
          <div className="text-lg font-semibold">{testName}</div>
          <div className="text-sm text-tg-hint mt-1">{formattedDate}</div>
        </div>
      </Section>

      {/* Score Gauge (body scan + опросники) */}
      {!isLab && result.score !== null && (
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

      {/* Прогресс-бар результата опросника */}
      {isQuest && result.score !== null && (
        <Section header="Результат">
          <div className="px-4 py-3">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium">{result.score} / {result.maxScore}</span>
              <span className="text-sm text-tg-hint">{Math.round((result.score / result.maxScore) * 100)}%</span>
            </div>
            <div
              className="w-full rounded-full h-2.5"
              style={{ backgroundColor: 'var(--tg-theme-secondary-bg-color, #e5e7eb)' }}
            >
              <div
                className="h-2.5 rounded-full transition-all"
                style={{
                  width: `${(result.score / result.maxScore) * 100}%`,
                  backgroundColor: interp?.color ?? '#6b7280',
                }}
              />
            </div>
            {/* Тренд-стрелка: сравнение с предыдущим результатом */}
            {questTrend.length >= 2 && (() => {
              const prev = questTrend[questTrend.length - 2];
              const curr = questTrend[questTrend.length - 1];
              if (!prev || !curr) return null;
              const diff = curr.score - prev.score;
              if (diff === 0) return (
                <div className="text-xs text-tg-hint mt-1">{'\u2192'} без изменений</div>
              );
              // Для опросников ниже = лучше (PHQ-9, GAD-7, PSS-10)
              const better = diff < 0;
              return (
                <div className="text-xs mt-1" style={{ color: better ? '#34c759' : '#ff3b30' }}>
                  {better ? '\u2193' : '\u2191'} {Math.abs(diff)} {better ? '(улучшение)' : '(ухудшение)'}
                </div>
              );
            })()}
          </div>
        </Section>
      )}

      {/* Интерпретация опросника — badge */}
      {isQuest && interp && (
        <Section header="Интерпретация">
          <div className="px-4 py-3">
            <div
              className="inline-block px-3 py-1 rounded-full text-sm font-medium"
              style={{
                backgroundColor: interp.color + '20',
                color: interp.color,
              }}
            >
              {result.severity ? severityEmoji(result.severity) : ''} {interp.label}
            </div>
            {result.interpretation && (
              <div className="text-sm text-tg-hint mt-2">{result.interpretation}</div>
            )}
          </div>
        </Section>
      )}

      {/* === LAB RESULTS === */}

      {/* Таблица показателей анализа */}
      {isLab && result.labValues && result.labValues.length > 0 && (
        <Section header={`Показатели (${result.labValues.length})`}>
          {result.labValues.map((v, i) => (
            <Cell
              key={i}
              before={<span>{STATUS_EMOJI[v.status] ?? '\u26AA'}</span>}
              subtitle={
                v.refMin !== undefined && v.refMax !== undefined
                  ? `Норма: ${v.refMin}\u2013${v.refMax} ${v.unit}`
                  : v.unit
              }
              after={
                <span
                  className="text-sm font-medium cursor-pointer"
                  style={{
                    color: v.status === 'normal' ? 'var(--tg-theme-text-color)' : '#ff9500',
                    textDecoration: 'underline',
                    textDecorationStyle: 'dotted',
                  }}
                  onClick={() => setSelectedBiomarker(v.name)}
                >
                  {v.value} {v.unit}
                </span>
              }
            >
              {v.nameRu}
            </Cell>
          ))}
        </Section>
      )}

      {/* AI Интерпретация анализа */}
      {isLab && result.interpretation && (
        <Section header="\u{1F916} AI Интерпретация">
          <div className="px-4 py-3">
            <div className="text-sm">{result.interpretation}</div>
          </div>
        </Section>
      )}

      {/* Предупреждения анализа */}
      {isLab && result.warnings && result.warnings.length > 0 && (
        <Section header="\u26A0\uFE0F Предупреждения">
          {result.warnings.map((w, i) => (
            <Cell key={i} multiline>
              {`\u2022 ${w}`}
            </Cell>
          ))}
        </Section>
      )}

      {/* Тренд лабораторного показателя */}
      {isLab && selectedBiomarkerInfo && labTrendData.length > 1 && (
        <Section header="Тренд показателя">
          <div className="px-2 pb-2">
            <LabTrendChart
              data={labTrendData}
              refMin={selectedBiomarkerInfo.refMin}
              refMax={selectedBiomarkerInfo.refMax}
              unit={selectedBiomarkerInfo.unit}
              nameRu={selectedBiomarkerInfo.nameRu}
            />
          </div>
        </Section>
      )}

      {/* Селектор биомаркера для тренда */}
      {isLab && result.labValues && result.labValues.length > 1 && (
        <Section header="Выбрать показатель">
          <div className="px-4 py-2 flex flex-wrap gap-2">
            {result.labValues.map((v) => (
              <button
                key={v.name}
                onClick={() => setSelectedBiomarker(v.name)}
                className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: selectedBiomarker === v.name
                    ? 'var(--tg-theme-link-color, #007aff)'
                    : 'var(--tg-theme-secondary-bg-color, #e5e7eb)',
                  color: selectedBiomarker === v.name
                    ? '#fff'
                    : 'var(--tg-theme-text-color, #000)',
                }}
              >
                {v.nameRu}
              </button>
            ))}
          </div>
        </Section>
      )}

      {/* === END LAB RESULTS === */}

      {/* Тренд — body scan */}
      {!isQuest && !isLab && diagTrend.length > 1 && (
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
      {!isQuest && !isLab && result.aiConfidence != null && (
        <Section>
          <Cell subtitle={`${Math.round(result.aiConfidence * 100)}%`}>
            Уверенность анализа
          </Cell>
        </Section>
      )}

      {/* Дисклеймер */}
      {isLab && (
        <div className="px-4 py-3 text-xs text-tg-hint text-center">
          {'\u2695\uFE0F'} Информационный анализ, не медицинский диагноз. Покажите результаты врачу.
        </div>
      )}
    </div>
  );
}
