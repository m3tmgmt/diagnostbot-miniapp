// Корневой компонент — роутинг + bottom tab bar (4 таба по spec)
// diagnostbot.md → Mini App: HealthScore | Labs | Risk Prediction | Emergency + deep links
import { useState, useCallback, useEffect } from 'react';
import { ThemeProvider, SafeAreaProvider, SafeAreaView } from '@plemya/design-system';
import { ErrorBoundary } from './components/ErrorBoundary';
import { BottomTabBar, type TabId } from './components/BottomTabBar';
import { HomePage } from './pages/HomePage';
import { ResultPage } from './pages/ResultPage';
import { MeasurementsTab } from './pages/MeasurementsTab';
import { DiaryTab } from './pages/DiaryTab';
import { HealthScoreTab } from './pages/HealthScoreTab';
import { TimelinePage } from './pages/TimelinePage';
import { EmergencyCardPage } from './pages/EmergencyCardPage';
import { BodyMapTab } from './pages/BodyMapTab';
import { LabResultsTab } from './pages/LabResultsTab';
import { RiskPredictionTab } from './pages/RiskPredictionTab';

type Page =
  | { type: 'home' }
  | { type: 'result'; id: string }
  | { type: 'measurements' }
  | { type: 'diary' }
  | { type: 'healthscore' }
  | { type: 'timeline' }
  | { type: 'emergency' }
  | { type: 'bodymap' }
  | { type: 'labs' }
  | { type: 'risk' };

// Страницы, для которых показываем bottom tab bar (4 таба по spec)
const TAB_PAGES = new Set<string>(['healthscore', 'labs', 'risk', 'emergency']);

/** Маппинг Page.type → TabId для подсветки активного таба */
function pageToTabId(pageType: string): TabId | null {
  switch (pageType) {
    case 'healthscore': return 'healthscore';
    case 'labs': return 'labs';
    case 'risk': return 'risk';
    case 'emergency': return 'emergency';
    default: return null;
  }
}

export default function App() {
  const [page, setPage] = useState<Page>({ type: 'home' });

  // Deep links: ?result=uuid | ?tab=measurements | ?tab=bodymap | ?tab=labs
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'measurements') { setPage({ type: 'measurements' }); return; }
    if (tab === 'diary') { setPage({ type: 'diary' }); return; }
    if (tab === 'healthscore') { setPage({ type: 'healthscore' }); return; }
    if (tab === 'timeline') { setPage({ type: 'timeline' }); return; }
    if (tab === 'emergency') { setPage({ type: 'emergency' }); return; }
    if (tab === 'bodymap') { setPage({ type: 'bodymap' }); return; }
    if (tab === 'risk') { setPage({ type: 'risk' }); return; }
    if (tab === 'labs') { setPage({ type: 'labs' }); return; }
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

  // Навигация по табам
  const handleTabChange = useCallback((tab: TabId) => {
    setPage({ type: tab });
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

  const handleNavigateToTimeline = useCallback(() => {
    setPage({ type: 'timeline' });
  }, []);

  const handleNavigateToEmergency = useCallback(() => {
    setPage({ type: 'emergency' });
  }, []);

  const handleNavigateToBodyMap = useCallback(() => {
    setPage({ type: 'bodymap' });
  }, []);

  const handleNavigateToLabs = useCallback(() => {
    setPage({ type: 'labs' });
  }, []);

  // Рендер страницы по текущему состоянию
  function renderPage() {
    switch (page.type) {
      case 'healthscore':
        return <HealthScoreTab onBack={handleBack} />;
      case 'diary':
        return <DiaryTab onBack={handleBack} />;
      case 'measurements':
        return <MeasurementsTab onBack={handleBack} />;
      case 'result':
        return <ResultPage resultId={page.id} onBack={handleBack} />;
      case 'timeline':
        return <TimelinePage onBack={handleBack} onSelectResult={handleSelectResult} />;
      case 'emergency':
        return <EmergencyCardPage onBack={handleBack} />;
      case 'bodymap':
        return <BodyMapTab onBack={handleBack} />;
      case 'risk':
        return <RiskPredictionTab onBack={handleBack} />;
      case 'labs':
        return <LabResultsTab onBack={handleBack} onSelectResult={handleSelectResult} />;
      default:
        return (
          <HomePage
            onSelectResult={handleSelectResult}
            onNavigateToMeasurements={handleNavigateToMeasurements}
            onNavigateToDiary={handleNavigateToDiary}
            onNavigateToHealthScore={handleNavigateToHealthScore}
            onNavigateToTimeline={handleNavigateToTimeline}
            onNavigateToEmergency={handleNavigateToEmergency}
            onNavigateToBodyMap={handleNavigateToBodyMap}
            onNavigateToLabs={handleNavigateToLabs}
          />
        );
    }
  }

  // Показывать bottom tab bar на tab-страницах
  const activeTab = pageToTabId(page.type);
  const showTabBar = TAB_PAGES.has(page.type);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <SafeAreaProvider>
          <SafeAreaView>
            {renderPage()}
            {showTabBar && activeTab && (
              <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            )}
          </SafeAreaView>
        </SafeAreaProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
