// Корневой компонент — роутинг между home и result
import { useState, useCallback } from 'react';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';

type Page = { type: 'home' } | { type: 'result'; id: string };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'home' });

  const handleSelectResult = useCallback((id: string) => {
    setPage({ type: 'result', id });
  }, []);

  const handleBack = useCallback(() => {
    setPage({ type: 'home' });
  }, []);

  if (page.type === 'result') {
    return <ResultPage resultId={page.id} onBack={handleBack} />;
  }

  return <HomePage onSelectResult={handleSelectResult} />;
}
