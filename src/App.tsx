// Корневой компонент — роутинг между home, result и measurements + deep links
import { useState, useCallback, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { MeasurementsTab } from './pages/MeasurementsTab';
import { DiaryTab } from './pages/DiaryTab';
import { HealthScoreTab } from './pages/HealthScoreTab';

type Page =
  | { type: 'home' }
  | { type: 'result'; id: string }
  | { type: 'measurements' }
  | { type: 'diary' }
  | { type: 'healthscore' };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'home' });

  // Deep links: ?result=uuid | ?tab=measurements
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'measurements') {
      setPage({ type: 'measurements' });
      return;
    }
    if (tab === 'diary') {
      setPage({ type: 'diary' });
      return;
    }
    if (tab === 'healthscore') {
      setPage({ type: 'healthscore' });
      return;
    }
    const resultId = params.get('result');
    if (resultId) {
      setPage({ type: 'result', id: resultId });
    }
  }, []);

  const handleSelectResult = useCallback((id: string) => {
    setPage({ type: 'result', id });
  }, []);

  const handleBack = useCallback(() => {
    setPage({ type: 'home' });
  }, []);

  const handleNavigateToMeasurements = useCallback(() => {
    setPage({ type: 'measurements' });
  }, []);

  const handleNavigateToDiary = useCallback(() => {
    setPage({ type: 'diary' });
  }, []);

  const handleNavigateToHealthScore = useCallback(() => {
    setPage({ type: 'healthscore' });
  }, []);

  if (page.type === 'healthscore') {
    return <HealthScoreTab onBack={handleBack} />;
  }

  if (page.type === 'diary') {
    return <DiaryTab onBack={handleBack} />;
  }

  if (page.type === 'measurements') {
    return <MeasurementsTab onBack={handleBack} />;
  }

  if (page.type === 'result') {
    return <ResultPage resultId={page.id} onBack={handleBack} />;
  }

  return (
    <HomePage
      onSelectResult={handleSelectResult}
      onNavigateToMeasurements={handleNavigateToMeasurements}
      onNavigateToDiary={handleNavigateToDiary}
      onNavigateToHealthScore={handleNavigateToHealthScore}
    />
  );
}
