// Risk Prediction Tab — прогноз рисков на основе данных (spec: diagnostbot.md → Mini App tab 3)
// Stub-реализация — будет наполнена реальными данными при интеграции с Health Score

import { Section } from '@telegram-apps/telegram-ui';
import { useBackButton } from '../hooks/useTelegram';

interface RiskPredictionTabProps {
  onBack: () => void;
}

/** Карточка риска (stub) */
function RiskCard({ emoji, title, level, description }: {
  emoji: string;
  title: string;
  level: 'low' | 'medium' | 'high';
  description: string;
}) {
  const colors = {
    low: { bg: 'var(--plm-health-good-bg, #e8f5e9)', text: 'var(--plm-health-good, #4caf50)', label: 'Низкий' },
    medium: { bg: 'var(--plm-warning-bg, #fff3e0)', text: 'var(--plm-health-warning, #ff9800)', label: 'Средний' },
    high: { bg: 'var(--plm-destructive-bg, #ffebee)', text: 'var(--plm-text-destructive, #f44336)', label: 'Высокий' },
  };
  const c = colors[level];

  return (
    <div
      className="px-4 py-3 rounded-xl mb-2"
      style={{ backgroundColor: c.bg }}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
          {emoji} {title}
        </span>
        <span
          className="text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ backgroundColor: c.text, color: '#fff' }}
        >
          {c.label}
        </span>
      </div>
      <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
        {description}
      </div>
    </div>
  );
}

export function RiskPredictionTab({ onBack }: RiskPredictionTabProps) {
  useBackButton(onBack);

  return (
    <div className="pb-20">
      {/* Шапка */}
      <div
        className="px-4 py-4 mb-2 text-center"
        style={{ backgroundColor: 'var(--plm-warning-bg, var(--tg-theme-secondary-bg-color, #f5f5f5))' }}
      >
        <div className="text-3xl mb-2">📊</div>
        <div
          className="font-bold text-lg"
          style={{ color: 'var(--tg-theme-text-color)' }}
        >
          Прогноз рисков
        </div>
        <div
          className="text-xs mt-1"
          style={{ color: 'var(--tg-theme-hint-color)' }}
        >
          Анализ рисков на основе ваших данных
        </div>
      </div>

      {/* Текущие риски */}
      <Section header="⚠️ Текущие риски">
        <div className="px-4 py-2">
          <RiskCard
            emoji="💤"
            title="Недостаток сна"
            level="medium"
            description="Среднее время сна за неделю ниже рекомендуемых 7 часов"
          />
          <RiskCard
            emoji="🏃"
            title="Низкая активность"
            level="low"
            description="Уровень физической активности в пределах нормы"
          />
          <RiskCard
            emoji="🧠"
            title="Стресс"
            level="low"
            description="Показатели ментального здоровья стабильны"
          />

          <div
            className="text-xs text-center mt-3 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              color: 'var(--tg-theme-hint-color)',
            }}
          >
            Данные обновляются по мере поступления результатов анализов и трекинга
          </div>
        </div>
      </Section>

      {/* Рекомендации */}
      <Section header="💡 Рекомендации">
        <div className="px-4 py-2 space-y-2">
          <div
            className="px-3 py-2.5 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--plm-link-bg, var(--tg-theme-secondary-bg-color, #e3f2fd))',
              color: 'var(--tg-theme-text-color)',
            }}
          >
            🛏️ Старайтесь ложиться до 23:00 для улучшения качества сна
          </div>
          <div
            className="px-3 py-2.5 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--plm-link-bg, var(--tg-theme-secondary-bg-color, #e3f2fd))',
              color: 'var(--tg-theme-text-color)',
            }}
          >
            🥗 Регулярное питание поможет стабилизировать энергию в течение дня
          </div>
          <div
            className="px-3 py-2.5 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--plm-link-bg, var(--tg-theme-secondary-bg-color, #e3f2fd))',
              color: 'var(--tg-theme-text-color)',
            }}
          >
            🧘 Рассмотрите практики осознанности для снижения стресса
          </div>
        </div>
      </Section>

      {/* Timeline прогноза */}
      <Section header="📈 Timeline прогноза">
        <div className="px-4 py-2">
          <div className="space-y-3">
            {/* 1 неделя */}
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ backgroundColor: 'var(--plm-health-good-bg)', color: 'var(--plm-health-good)' }}
              >
                1н
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
                  Краткосрочный прогноз
                </div>
                <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  При текущем режиме показатели останутся стабильными
                </div>
              </div>
            </div>

            {/* 1 месяц */}
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ backgroundColor: 'var(--plm-warning-bg)', color: 'var(--plm-health-warning)' }}
              >
                1м
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
                  Среднесрочный прогноз
                </div>
                <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  Необходимо улучшить режим сна для предотвращения снижения Health Score
                </div>
              </div>
            </div>

            {/* 3 месяца */}
            <div className="flex items-start gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
                style={{ backgroundColor: 'var(--plm-link-bg)', color: 'var(--plm-text-link)' }}
              >
                3м
              </div>
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
                  Долгосрочный прогноз
                </div>
                <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>
                  При выполнении рекомендаций ожидается рост Health Score на 5-10 пунктов
                </div>
              </div>
            </div>
          </div>

          <div
            className="text-xs text-center mt-4 px-4 py-2 rounded-lg"
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #f5f5f5)',
              color: 'var(--tg-theme-hint-color)',
            }}
          >
            Прогнозы уточняются по мере накопления данных о вашем здоровье
          </div>
        </div>
      </Section>
    </div>
  );
}
