// Корневой компонент — роутинг между home, result и measurements + deep links
import { useState, useCallback, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { MeasurementsTab } from './pages/MeasurementsTab';

type Page =
  | { type: 'home' }
  | { type: 'result'; id: string }
  | { type: 'measurements' };

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
    />
  );
}
