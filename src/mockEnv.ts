// Мок Telegram WebApp окружения для локальной разработки
if (typeof window !== 'undefined' && !(window as Record<string, unknown>).Telegram) {
  const noop = () => {};
  (window as Record<string, unknown>).Telegram = {
    WebApp: {
      initData: '',
      initDataUnsafe: {
        user: {
          id: 12345678,
          first_name: 'Test',
          last_name: 'User',
          username: 'testuser',
        },
      },
      version: '7.0',
      platform: 'tdesktop',
      colorScheme: 'dark',
      themeParams: {
        bg_color: '#1c1c1e',
        text_color: '#ffffff',
        hint_color: '#8e8e93',
        link_color: '#007aff',
        button_color: '#007aff',
        button_text_color: '#ffffff',
      },
      isExpanded: true,
      viewportHeight: 600,
      viewportStableHeight: 600,
      ready: noop,
      expand: noop,
      close: noop,
      MainButton: {
        text: '',
        color: '#007aff',
        textColor: '#ffffff',
        isVisible: false,
        isActive: true,
        show: noop,
        hide: noop,
        onClick: noop,
        offClick: noop,
        setText: noop,
      },
      BackButton: {
        isVisible: false,
        show: noop,
        hide: noop,
        onClick: noop,
        offClick: noop,
      },
    },
  };
}

export {};
