import React, { createContext, useContext, useEffect, useState } from 'react';

interface SafeAreaInsets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

const SafeAreaContext = createContext<SafeAreaInsets>({
  top: 0, bottom: 0, left: 0, right: 0
});

export const useSafeArea = () => useContext(SafeAreaContext);

interface SafeAreaProviderProps {
  children: React.ReactNode;
}

export const SafeAreaProvider: React.FC<SafeAreaProviderProps> = ({ children }) => {
  const [insets, setInsets] = useState<SafeAreaInsets>({
    top: 0, bottom: 0, left: 0, right: 0
  });

  useEffect(() => {
    // Попытка 1: @tma.js/sdk viewport (рекомендуемый для Telegram)
    try {
      // Динамический импорт чтобы не ломать non-Telegram среду
      import('@tma.js/sdk').then(({ viewport }) => {
        if (viewport && viewport.safeAreaInsets) {
          const sa = viewport.safeAreaInsets();
          setInsets({
            top: sa.top || 0,
            bottom: sa.bottom || 0,
            left: sa.left || 0,
            right: sa.right || 0,
          });
        }
      }).catch(() => {
        // Попытка 2: CSS env() fallback (работает в обычном браузере)
        const testEl = document.createElement('div');
        testEl.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
        document.body.appendChild(testEl);
        const bottom = parseInt(getComputedStyle(testEl).paddingBottom) || 0;
        document.body.removeChild(testEl);

        if (bottom > 0) {
          setInsets(prev => ({ ...prev, bottom }));
        }
      });
    } catch {
      // Попытка 3: hardcoded для iOS (если ничего не сработало)
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      if (isIOS) {
        setInsets({ top: 47, bottom: 34, left: 0, right: 0 });
      }
    }
  }, []);

  return (
    <SafeAreaContext.Provider value={insets}>
      {children}
    </SafeAreaContext.Provider>
  );
};

// Утилитарный компонент — обёртка с safe area padding
export const SafeAreaView: React.FC<{
  children: React.ReactNode;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  style?: React.CSSProperties;
}> = ({ children, edges = ['top', 'bottom'], style }) => {
  const insets = useSafeArea();

  const paddingStyle: React.CSSProperties = {};
  if (edges.includes('top')) paddingStyle.paddingTop = `${insets.top}px`;
  if (edges.includes('bottom')) paddingStyle.paddingBottom = `${insets.bottom}px`;
  if (edges.includes('left')) paddingStyle.paddingLeft = `${insets.left}px`;
  if (edges.includes('right')) paddingStyle.paddingRight = `${insets.right}px`;

  return (
    <div style={{ ...paddingStyle, ...style }}>
      {children}
    </div>
  );
};
