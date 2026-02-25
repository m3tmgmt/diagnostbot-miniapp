import React, { createContext, useContext, useEffect, useState } from 'react';

// Telegram CSS Variables → наш design token mapping
export interface IPlemyaTheme {
  // Из Telegram автоматически
  bgColor: string;
  textColor: string;
  hintColor: string;
  linkColor: string;
  buttonColor: string;
  buttonTextColor: string;
  secondaryBgColor: string;
  headerBgColor: string;
  accentTextColor: string;
  destructiveTextColor: string;

  // PLEMYA-specific (health domain)
  healthGood: string;     // Зелёный для хороших показателей
  healthWarning: string;  // Жёлтый
  healthDanger: string;   // Красный
  healthNeutral: string;  // Серый

  // Spacing
  spacing: {
    xs: string;  // 4px
    sm: string;  // 8px
    md: string;  // 16px
    lg: string;  // 24px
    xl: string;  // 32px
  };

  // Touch targets
  minTouchTarget: string; // 44px
}

const defaultTheme: IPlemyaTheme = {
  bgColor: '#ffffff',
  textColor: '#000000',
  hintColor: '#999999',
  linkColor: '#2481cc',
  buttonColor: '#2481cc',
  buttonTextColor: '#ffffff',
  secondaryBgColor: '#f0f0f0',
  headerBgColor: '#ffffff',
  accentTextColor: '#2481cc',
  destructiveTextColor: '#ff3b30',

  healthGood: '#34C759',
  healthWarning: '#FF9500',
  healthDanger: '#FF3B30',
  healthNeutral: '#8E8E93',

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },

  minTouchTarget: '44px',
};

const ThemeContext = createContext<IPlemyaTheme>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<IPlemyaTheme>(defaultTheme);

  useEffect(() => {
    // Читаем CSS variables Telegram при монтировании
    const root = document.documentElement;
    const getVar = (name: string, fallback: string) =>
      getComputedStyle(root).getPropertyValue(name).trim() || fallback;

    setTheme(prev => ({
      ...prev,
      bgColor: getVar('--tg-theme-bg-color', prev.bgColor),
      textColor: getVar('--tg-theme-text-color', prev.textColor),
      hintColor: getVar('--tg-theme-hint-color', prev.hintColor),
      linkColor: getVar('--tg-theme-link-color', prev.linkColor),
      buttonColor: getVar('--tg-theme-button-color', prev.buttonColor),
      buttonTextColor: getVar('--tg-theme-button-text-color', prev.buttonTextColor),
      secondaryBgColor: getVar('--tg-theme-secondary-bg-color', prev.secondaryBgColor),
      headerBgColor: getVar('--tg-theme-header-bg-color', prev.headerBgColor),
      accentTextColor: getVar('--tg-theme-accent-text-color', prev.accentTextColor),
      destructiveTextColor: getVar('--tg-theme-destructive-text-color', prev.destructiveTextColor),
    }));
  }, []);

  return (
    <ThemeContext.Provider value={theme}>
      {children}
    </ThemeContext.Provider>
  );
};
