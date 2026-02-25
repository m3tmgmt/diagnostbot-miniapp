// Нижняя панель навигации — 4 таба Mini App (spec: diagnostbot.md → Mini App)
// HealthScore | Анализы | Прогноз рисков | SOS

export type TabId = 'healthscore' | 'labs' | 'risk' | 'emergency';

interface TabItem {
  id: TabId;
  icon: string;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'healthscore', icon: '❤️', label: 'Score' },
  { id: 'labs', icon: '🔬', label: 'Анализы' },
  { id: 'risk', icon: '📊', label: 'Риски' },
  { id: 'emergency', icon: '🆘', label: 'SOS' },
];

interface BottomTabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function BottomTabBar({ activeTab, onTabChange }: BottomTabBarProps) {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 flex border-t"
      style={{
        backgroundColor: 'var(--plm-bg, var(--tg-theme-bg-color, #fff))',
        borderColor: 'var(--plm-border, var(--tg-theme-secondary-bg-color, #e5e7eb))',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        zIndex: 50,
      }}
    >
      {TABS.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            className="flex-1 flex flex-col items-center py-2 transition-colors"
            style={{
              color: isActive
                ? 'var(--plm-accent, var(--tg-theme-link-color, #007aff))'
                : 'var(--plm-text-hint, var(--tg-theme-hint-color, #999))',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onClick={() => onTabChange(tab.id)}
            aria-selected={isActive}
            role="tab"
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            <span
              className="text-[10px] mt-0.5 font-medium"
              style={{
                opacity: isActive ? 1 : 0.7,
              }}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
