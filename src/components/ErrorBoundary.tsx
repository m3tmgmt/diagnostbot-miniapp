// Глобальный Error Boundary — ловит ошибки React-дерева и показывает fallback UI
import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Кастомный fallback вместо дефолтного */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--tg-theme-text-color, #fff)',
          }}
        >
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>😔</div>
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Что-то пошло не так
          </h2>
          <p
            style={{
              fontSize: '14px',
              color: 'var(--tg-theme-hint-color, #999)',
              marginBottom: '24px',
              maxWidth: '280px',
            }}
          >
            Произошла ошибка при загрузке. Попробуйте обновить страницу.
          </p>
          <button
            type="button"
            onClick={this.handleRetry}
            style={{
              padding: '12px 32px',
              borderRadius: '12px',
              border: 'none',
              backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
              color: 'var(--tg-theme-button-text-color, #fff)',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              minHeight: '48px',
            }}
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
