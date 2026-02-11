// Хук для доступа к Telegram WebApp API
// Используем прямой window.Telegram.WebApp (как в plemya-miniapp)
import { useEffect, useCallback } from 'react';

interface TelegramWebApp {
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
    };
  };
  colorScheme: 'light' | 'dark';
  BackButton: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  ready: () => void;
  expand: () => void;
}

function getWebApp(): TelegramWebApp | null {
  const tg = (window as Record<string, unknown>).Telegram as { WebApp?: TelegramWebApp } | undefined;
  return tg?.WebApp ?? null;
}

export function useTelegram() {
  const webApp = getWebApp();

  useEffect(() => {
    webApp?.ready();
    webApp?.expand();
  }, [webApp]);

  const userId = webApp?.initDataUnsafe.user?.id ?? null;
  const userName = webApp?.initDataUnsafe.user?.first_name ?? 'User';
  const isDark = webApp?.colorScheme === 'dark';

  return { userId, userName, isDark, webApp };
}

export function useBackButton(onBack: (() => void) | null) {
  const webApp = getWebApp();

  const handleBack = useCallback(() => {
    onBack?.();
  }, [onBack]);

  useEffect(() => {
    if (!webApp) return;

    if (onBack) {
      webApp.BackButton.show();
      webApp.BackButton.onClick(handleBack);
    } else {
      webApp.BackButton.hide();
    }

    return () => {
      webApp.BackButton.offClick(handleBack);
      webApp.BackButton.hide();
    };
  }, [webApp, onBack, handleBack]);
}
