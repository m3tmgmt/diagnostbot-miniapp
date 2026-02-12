// Утилиты для интерпретации результатов опросников (PHQ-9, GAD-7, PSS-10)

import type { QuestionnaireType, SeverityLevel } from '../types/diagnostics';

/** Информация об опроснике */
interface QuestionnaireInfo {
  name: string;
  shortName: string;
  maxScore: number;
}

/** Шкала интерпретации — порог + label + цвет */
interface InterpretationScale {
  maxScore: number;
  label: string;
  color: string;
}

export const QUESTIONNAIRE_INFO: Record<QuestionnaireType, QuestionnaireInfo> = {
  phq9: { name: 'PHQ-9 — Шкала настроения', shortName: 'PHQ-9', maxScore: 27 },
  gad7: { name: 'GAD-7 — Шкала тревожности', shortName: 'GAD-7', maxScore: 21 },
  pss10: { name: 'PSS-10 — Шкала стресса', shortName: 'PSS-10', maxScore: 40 },
};

/** Шкалы интерпретации по типу опросника */
const INTERPRETATION_SCALES: Record<QuestionnaireType, InterpretationScale[]> = {
  phq9: [
    { maxScore: 4, label: 'Минимальная', color: '#34c759' },
    { maxScore: 9, label: 'Лёгкая', color: '#a8d44a' },
    { maxScore: 14, label: 'Умеренная', color: '#ff9500' },
    { maxScore: 19, label: 'Умеренно-тяжёлая', color: '#ff6b35' },
    { maxScore: 27, label: 'Тяжёлая', color: '#ff3b30' },
  ],
  gad7: [
    { maxScore: 4, label: 'Минимальная', color: '#34c759' },
    { maxScore: 9, label: 'Лёгкая', color: '#a8d44a' },
    { maxScore: 14, label: 'Умеренная', color: '#ff9500' },
    { maxScore: 21, label: 'Тяжёлая', color: '#ff3b30' },
  ],
  pss10: [
    { maxScore: 13, label: 'Низкий', color: '#34c759' },
    { maxScore: 26, label: 'Умеренный', color: '#ff9500' },
    { maxScore: 40, label: 'Высокий', color: '#ff3b30' },
  ],
};

/** Получить интерпретацию по типу и баллу */
export function getInterpretation(
  type: QuestionnaireType,
  score: number,
): { label: string; color: string } {
  const scales = INTERPRETATION_SCALES[type];
  for (const scale of scales) {
    if (score <= scale.maxScore) {
      return { label: scale.label, color: scale.color };
    }
  }
  const last = scales[scales.length - 1]!;
  return { label: last.label, color: last.color };
}

/** Emoji по уровню тяжести */
export function severityEmoji(severity: SeverityLevel): string {
  switch (severity) {
    case 'minimal': return '\uD83C\uDF1F';
    case 'mild': return '\uD83D\uDC4D';
    case 'moderate': return '\u26A0\uFE0F';
    case 'severe': return '\uD83D\uDD34';
  }
}

/** Проверка: является ли testId типом опросника */
export function isQuestionnaireType(testId: string): testId is QuestionnaireType {
  return testId === 'pss10' || testId === 'gad7' || testId === 'phq9';
}
