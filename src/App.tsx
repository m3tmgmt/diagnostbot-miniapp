// Корневой компонент — роутинг между home и result + deep links
import { useState, useCallback, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';

type Page = { type: 'home' } | { type: 'result'; id: string };

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'home' });

  // Deep link: ?result=uuid → открыть конкретный результат
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
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

  if (page.type === 'result') {
    return <ResultPage resultId={page.id} onBack={handleBack} />;
  }

  return <HomePage onSelectResult={handleSelectResult} />;
}
