// Список результатов анализов — Lab Results Tab
// Показывает все анализы с категориями, датами, статусами

import { useEffect, useState } from 'react';
import { Section, Cell } from '@telegram-apps/telegram-ui';
import { TgLoader, TgEmptyState } from '@plemya/design-system';
import { useTelegram, useBackButton } from '../hooks/useTelegram';
import { getLabResultsSummary, type LabResultRow } from '../api/supabase';

interface LabResultsTabProps {
  onBack: () => void;
  onSelectResult: (id: string) => void;
}

// Названия категорий анализов
const LAB_CATEGORY_NAMES: Record<string, string> = {
  blood_general: '🩸 Общий анализ крови',
  blood_biochem: '🧪 Биохимия крови',
  hormones: '⚗️ Гормоны',
  vitamins: '💊 Витамины и микроэлементы',
  urine: '🧫 Анализ мочи',
  lipids: '🫀 Липидный профиль',
  other: '📋 Анализы',
};

/** Форматирование даты */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

/** Подсчёт статусов */
function getStatusSummary(values: LabResultRow['values']): { normal: number; abnormal: number } {
  let normal = 0;
  let abnormal = 0;
  for (const v of values ?? []) {
    if (v.status === 'normal') {
      normal++;
    } else {
      abnormal++;
    }
  }
  return { normal, abnormal };
}

export function LabResultsTab({ onBack, onSelectResult }: LabResultsTabProps) {
  const { userId } = useTelegram();
  useBackButton(onBack);

  const [results, setResults] = useState<LabResultRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    getLabResultsSummary(userId)
      .then(setResults)
      .catch((err) => {
        console.error('[LabResultsTab] Ошибка загрузки:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  if (loading) {
    return <TgLoader text="Загрузка анализов..." />;
  }

  if (results.length === 0) {
    return (
      <div className="pb-20">
        <TgEmptyState
          icon="🔬"
          title="Нет результатов анализов"
          description="Загрузите фото анализов в бот, чтобы увидеть результаты здесь"
        />
      </div>
    );
  }

  return (
    <div className="pb-20">
      <Section header={`Анализы (${results.length})`}>
        {results.map((lab) => {
          const { normal, abnormal } = getStatusSummary(lab.values);
          const total = normal + abnormal;
          const categoryName = LAB_CATEGORY_NAMES[lab.category] ?? `📋 ${lab.category}`;

          return (
            <Cell
              key={lab.id}
              subtitle={
                <span>
                  {formatDate(lab.test_date)}
                  {' · '}
                  {total} показат.
                  {abnormal > 0 && (
                    <span style={{ color: '#ff9500' }}> · {abnormal} отклон.</span>
                  )}
                </span>
              }
              after={
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: abnormal > 0 ? '#ff9500' : '#34c759',
                  }}
                />
              }
              onClick={() => onSelectResult(lab.id)}
              className="cursor-pointer"
            >
              {categoryName}
            </Cell>
          );
        })}
      </Section>

      {/* AI Disclaimer */}
      <div className="px-4 py-3 text-xs text-center" style={{ color: 'var(--plm-text-hint)' }}>
        ⚕️ Информационный анализ, не медицинский диагноз
      </div>
    </div>
  );
}
