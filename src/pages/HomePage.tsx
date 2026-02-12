// Главная страница — список результатов с табами фильтрации
import { useEffect, useState } from 'react';
import { Section, Spinner, Placeholder, SegmentedControl } from '@telegram-apps/telegram-ui';
import { ResultCard } from '../components/ResultCard';
import { useTelegram } from '../hooks/useTelegram';
import { getAllResults } from '../api/supabase';
import type { UnifiedResult, ResultCategory } from '../types/diagnostics';

interface HomePageProps {
  onSelectResult: (id: string) => void;
  onNavigateToMeasurements: () => void;
  onNavigateToDiary: () => void;
  onNavigateToHealthScore: () => void;
}

export function HomePage({ onSelectResult, onNavigateToMeasurements, onNavigateToDiary, onNavigateToHealthScore }: HomePageProps) {
  const { userId } = useTelegram();
  const [results, setResults] = useState<UnifiedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<ResultCategory>('all');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getAllResults(userId).then((data) => {
      setResults(data);
      setLoading(false);
    });
  }, [userId]);

  // Фильтрация по выбранной вкладке
  const filtered = tab === 'all'
    ? results
    : results.filter((r) => r.kind === tab);

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
    <div>
      {/* Вкладки фильтрации */}
      <div className="px-4 pt-3 pb-1">
        <SegmentedControl>
          <SegmentedControl.Item
            selected={false}
            onClick={() => onNavigateToHealthScore()}
          >
            {'\u{1FA7A}'} Score
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={tab === 'all'}
            onClick={() => setTab('all')}
          >
            Все
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={tab === 'body_scan'}
            onClick={() => setTab('body_scan')}
          >
            Body Scan
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={tab === 'questionnaire'}
            onClick={() => setTab('questionnaire')}
          >
            Опросники
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={false}
            onClick={() => onNavigateToMeasurements()}
          >
            Замеры
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={false}
            onClick={() => onNavigateToDiary()}
          >
            Дневник
          </SegmentedControl.Item>
        </SegmentedControl>
      </div>

      {/* Список результатов */}
      <Section header={`Результаты (${filtered.length})`}>
        {filtered.length === 0 ? (
          <div className="p-4 text-center text-tg-hint">
            Нет результатов в этой категории
          </div>
        ) : (
          filtered.map((r) => (
            <ResultCard
              key={r.id}
              result={r}
              onClick={() => onSelectResult(r.id)}
            />
          ))
        )}
      </Section>
    </div>
  );
}
