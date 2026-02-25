import React from 'react';

interface TgLoaderProps {
  /** Текст под спиннером */
  text?: string;
  /** На весь экран (minHeight 60vh) */
  fullScreen?: boolean;
}

export const TgLoader: React.FC<TgLoaderProps> = ({
  text = 'Загрузка...',
  fullScreen = true,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: fullScreen ? '60vh' : undefined,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          border: '2.5px solid transparent',
          borderTopColor: 'var(--plm-btn-bg, #007aff)',
          borderRadius: '50%',
          animation: 'plm-spin 0.8s linear infinite',
        }}
      />
      {text && (
        <div
          style={{
            fontSize: 13,
            color: 'var(--plm-text-hint, #8e8e93)',
            marginTop: 12,
          }}
        >
          {text}
        </div>
      )}
    </div>
  );
};
