// Карточка результата — поддержка body scan и опросников
import { Cell } from '@telegram-apps/telegram-ui';
import type { UnifiedResult, QuestionnaireType } from '../types/diagnostics';
import { QUESTIONNAIRE_INFO, getInterpretation } from '../utils/questionnaire';

// Названия body scan тестов
const TEST_NAMES: Record<string, string> = {
  body_scan_full_body_video: 'Body Scan',
  body_scan_eye_tracking: 'Eye Tracking',
};

interface ResultCardProps {
  result: UnifiedResult;
  onClick: () => void;
}

/** Иконка по результату */
function scoreIcon(result: UnifiedResult): string {
  if (result.kind === 'questionnaire' && result.severity) {
    switch (result.severity) {
      case 'minimal': return '\uD83C\uDF1F';
      case 'mild': return '\uD83D\uDC4D';
      case 'moderate': return '\u26A0\uFE0F';
      case 'severe': return '\uD83D\uDD34';
    }
  }
  const score = result.score;
  if (score === null) return '\u2753';
  if (score >= 85) return '\uD83C\uDF1F';
  if (score >= 70) return '\uD83D\uDCAA';
  if (score >= 55) return '\uD83D\uDC4D';
  return '\u26A0\uFE0F';
}

/** Отображаемое название теста */
function getDisplayName(result: UnifiedResult): string {
  if (result.kind === 'questionnaire') {
    const info = QUESTIONNAIRE_INFO[result.testId as QuestionnaireType];
    return info?.shortName ?? result.testId;
  }
  return TEST_NAMES[result.testId] ?? result.testId;
}

/** Подзаголовок: балл + интерпретация (опросник) или балл/100 (body scan) + дата */
function getSubtitle(result: UnifiedResult): string {
  const formattedDate = new Date(result.date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

  if (result.kind === 'questionnaire' && result.score !== null) {
    const interp = getInterpretation(result.testId as QuestionnaireType, result.score);
    return `${result.score}/${result.maxScore} \u2022 ${interp.label} \u2022 ${formattedDate}`;
  }

  return `${result.score ?? '\u2014'}/100 \u2022 ${formattedDate}`;
}

export function ResultCard({ result, onClick }: ResultCardProps) {
  return (
    <Cell
      before={<span style={{ fontSize: '1.5rem' }}>{scoreIcon(result)}</span>}
      subtitle={getSubtitle(result)}
      onClick={onClick}
    >
      {getDisplayName(result)}
    </Cell>
  );
}
