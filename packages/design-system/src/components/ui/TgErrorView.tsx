import React from 'react';

interface TgErrorViewProps {
  /** Сообщение об ошибке */
  message?: string;
  /** Обработчик повтора */
  onRetry?: () => void;
}

export const TgErrorView: React.FC<TgErrorViewProps> = ({
  message = 'Что-то пошло не так',
  onRetry,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>😔</div>
      <div
        style={{
          fontSize: 15,
          color: 'var(--plm-text, #000000)',
          marginBottom: 8,
        }}
      >
        {message}
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--plm-text-hint, #8e8e93)',
          marginBottom: 16,
        }}
      >
        Попробуйте обновить страницу
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          style={{
            backgroundColor: 'var(--plm-btn-bg, #007aff)',
            color: 'var(--plm-btn-text, #ffffff)',
            border: 'none',
            borderRadius: 12,
            padding: '12px 24px',
            fontSize: 15,
            fontWeight: 600,
            minHeight: 44,
            cursor: 'pointer',
          }}
        >
          Обновить 🔄
        </button>
      )}
    </div>
  );
};
