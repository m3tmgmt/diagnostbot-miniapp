// Главная страница — список результатов диагностики
import { useEffect, useState } from 'react';
import { Section, Spinner, Placeholder } from '@telegram-apps/telegram-ui';
import { ResultCard } from '../components/ResultCard';
import { useTelegram } from '../hooks/useTelegram';
import { getResults } from '../api/supabase';
import type { DiagnosticResult } from '../types/diagnostics';

interface HomePageProps {
  onSelectResult: (id: string) => void;
}

const TEST_NAMES: Record<string, string> = {
  body_scan_full_body_video: 'Body Scan',
  body_scan_eye_tracking: 'Eye Tracking',
};

export function HomePage({ onSelectResult }: HomePageProps) {
  const { userId } = useTelegram();
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getResults(userId).then((data) => {
      setResults(data);
      setLoading(false);
    });
  }, [userId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="l" />
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <Placeholder
        header="Нет результатов"
        description="Пройди диагностику в боте, чтобы увидеть результаты здесь"
      />
    );
  }

  return (
    <Section header="Мои результаты">
      {results.map((r) => (
        <ResultCard
          key={r.id}
          testName={TEST_NAMES[r.test_id] ?? r.test_id}
          score={r.score}
          date={r.executed_at}
          onClick={() => onSelectResult(r.id)}
        />
      ))}
    </Section>
  );
}
