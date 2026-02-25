// Карта тела — просмотр findings по зонам (WOW #5)
// Показывает findings из сеансов массажа на SVG карте тела
// Цветовая кодировка: зелёный = норма, жёлтый = attention, красный = проблема

import { useEffect, useState } from 'react';
import { Section } from '@telegram-apps/telegram-ui';
import { TgLoader, TgEmptyState } from '@plemya/design-system';
import { BodyMap } from '../components/BodyMap';
import { BODY_ZONE_MAP } from '../data/body-zones';
import { useTelegram, useBackButton } from '../hooks/useTelegram';
import { getBodyMapFindings, type BodyMapFindingRow } from '../api/supabase';
import type { IBodyMapZone } from '../types/diagnostics';

interface BodyMapTabProps {
  onBack: () => void;
}

/** Конвертация finding → IBodyMapZone для рендера */
function findingToMapZone(finding: BodyMapFindingRow): IBodyMapZone {
  const def = BODY_ZONE_MAP.get(finding.zoneId);
  return {
    zoneId: finding.zoneId,
    nameRu: def?.nameRu ?? finding.zoneName,
    anatomicalName: def?.anatomicalName ?? finding.zoneId,
    touchPoint: def?.center ?? { x: 100, y: 200 },
    intensity: finding.intensity,
  };
}

/** Форматирование даты для панели деталей */
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function BodyMapTab({ onBack }: BodyMapTabProps) {
  const { userId } = useTelegram();
  useBackButton(onBack);

  const [view, setView] = useState<'front' | 'back'>('front');
  const [findings, setFindings] = useState<BodyMapFindingRow[]>([]);
  const [zones, setZones] = useState<IBodyMapZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    getBodyMapFindings(userId)
      .then((data) => {
        setFindings(data);
        setZones(data.map(findingToMapZone));
      })
      .catch((err) => {
        console.error('[BodyMapTab] Ошибка загрузки:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  // Найти finding для выбранной зоны
  const selectedFinding = selectedZoneId
    ? findings.find((f) => f.zoneId === selectedZoneId)
    : null;
  const selectedZoneDef = selectedZoneId ? BODY_ZONE_MAP.get(selectedZoneId) : null;

  if (loading) {
    return <TgLoader text="Загрузка карты тела..." />;
  }

  return (
    <div className="pb-20">
      {/* Заголовок */}
      <Section header="Карта тела">
        <div className="px-4 pb-2">
          <div className="text-sm" style={{ color: 'var(--plm-text-hint)' }}>
            {findings.length > 0
              ? `Отмечено зон: ${findings.length}`
              : 'Данные появятся после сеанса массажа'}
          </div>
        </div>
      </Section>

      {/* Переключатель вида */}
      <div className="flex gap-2 px-4 pb-3">
        <button
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{
            backgroundColor: view === 'front'
              ? 'var(--plm-accent, var(--tg-theme-link-color, #007aff))'
              : 'var(--plm-bg-secondary, var(--tg-theme-secondary-bg-color, #f0f0f0))',
            color: view === 'front' ? '#fff' : 'var(--plm-text)',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setView('front')}
        >
          Спереди
        </button>
        <button
          className="flex-1 py-2 rounded-xl text-sm font-medium transition-colors"
          style={{
            backgroundColor: view === 'back'
              ? 'var(--plm-accent, var(--tg-theme-link-color, #007aff))'
              : 'var(--plm-bg-secondary, var(--tg-theme-secondary-bg-color, #f0f0f0))',
            color: view === 'back' ? '#fff' : 'var(--plm-text)',
            border: 'none',
            cursor: 'pointer',
          }}
          onClick={() => setView('back')}
        >
          Сзади
        </button>
      </div>

      {/* Body Map SVG */}
      <div className="px-4">
        {findings.length > 0 ? (
          <BodyMap
            view={view}
            zones={zones}
            onZoneClick={setSelectedZoneId}
            selectedZoneId={selectedZoneId ?? undefined}
          />
        ) : (
          <TgEmptyState
            icon="💀"
            title="Нет данных"
            description="После сеанса массажа здесь появится карта с отмеченными зонами"
          />
        )}
      </div>

      {/* Детали выбранной зоны */}
      {selectedZoneId && (
        <Section header="Детали зоны">
          <div className="px-4 py-3">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="inline-block w-3 h-3 rounded-full"
                style={{
                  backgroundColor: selectedFinding
                    ? selectedFinding.severity === 'concern' ? '#ef4444'
                      : selectedFinding.severity === 'attention' ? '#eab308'
                        : '#22c55e'
                    : '#999',
                }}
              />
              <span className="text-base font-medium" style={{ color: 'var(--plm-text)' }}>
                {selectedZoneDef?.nameRu ?? selectedZoneId}
              </span>
            </div>

            {selectedFinding ? (
              <>
                <div className="text-sm mb-1" style={{ color: 'var(--plm-text)' }}>
                  {selectedFinding.description}
                </div>
                <div className="text-sm mb-1" style={{ color: 'var(--plm-text-hint)' }}>
                  Интенсивность: {selectedFinding.intensity}/10
                </div>
                <div className="text-xs" style={{ color: 'var(--plm-text-hint)' }}>
                  {selectedFinding.source} — {formatDate(selectedFinding.sessionDate)}
                </div>
              </>
            ) : (
              <div className="text-sm" style={{ color: 'var(--plm-text-hint)' }}>
                {selectedZoneDef?.anatomicalName ?? 'Зона не отмечена'}
                {' — нет данных'}
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Легенда */}
      <Section header="Легенда">
        <div className="px-4 py-2 flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#22c55e' }} />
            <span className="text-xs" style={{ color: 'var(--plm-text-hint)' }}>Норма</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#eab308' }} />
            <span className="text-xs" style={{ color: 'var(--plm-text-hint)' }}>Внимание</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: '#ef4444' }} />
            <span className="text-xs" style={{ color: 'var(--plm-text-hint)' }}>Проблема</span>
          </div>
        </div>
      </Section>
    </div>
  );
}
