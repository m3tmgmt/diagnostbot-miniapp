// Карточка результата в списке — иконка по баллу + дата
import { Cell } from '@telegram-apps/telegram-ui';

interface ResultCardProps {
  testName: string;
  score: number | null;
  date: string;
  onClick: () => void;
}

function scoreIcon(score: number | null): string {
  if (score === null) return '\u2753';
  if (score >= 85) return '\uD83C\uDF1F';
  if (score >= 70) return '\uD83D\uDCAA';
  if (score >= 55) return '\uD83D\uDC4D';
  return '\u26A0\uFE0F';
}

export function ResultCard({ testName, score, date, onClick }: ResultCardProps) {
  const formattedDate = new Date(date).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <Cell
      before={<span style={{ fontSize: '1.5rem' }}>{scoreIcon(score)}</span>}
      subtitle={`${score ?? '\u2014'}/100 \u2022 ${formattedDate}`}
      onClick={onClick}
    >
      {testName}
    </Cell>
  );
}
