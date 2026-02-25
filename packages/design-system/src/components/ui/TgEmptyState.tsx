import React from 'react';

interface TgEmptyStateProps {
  /** Эмоджи иконка */
  icon?: string;
  /** Заголовок */
  title: string;
  /** Описание/подсказка */
  description?: string;
  /** Текст кнопки действия */
  actionLabel?: string;
  /** Обработчик действия */
  onAction?: () => void;
}

export const TgEmptyState: React.FC<TgEmptyStateProps> = ({
  icon = '📭',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '40vh',
        padding: 24,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 12 }}>{icon}</div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: 'var(--plm-text, #000000)',
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {description && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--plm-text-hint, #8e8e93)',
            maxWidth: 260,
            lineHeight: 1.4,
          }}
        >
          {description}
        </div>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          style={{
            marginTop: 16,
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
          {actionLabel}
        </button>
      )}
    </div>
  );
};
