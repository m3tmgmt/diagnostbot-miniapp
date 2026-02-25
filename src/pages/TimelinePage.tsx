// Medical Timeline — хронологическая лента всех health-событий
import { useEffect, useState, useCallback } from 'react';
import { Section } from '@telegram-apps/telegram-ui';
import { TgLoader, TgErrorView, TgEmptyState } from '@plemya/design-system';
import { useTelegram, useBackButton } from '../hooks/useTelegram';
import { getTimelineEvents } from '../api/supabase';
import type { TimelineEvent, TimelineEventType } from '../types/diagnostics';

const PAGE_SIZE = 20;

// Конфигурация фильтров
const FILTERS: Array<{ key: TimelineEventType | 'all'; label: string }> = [
  { key: 'all', label: '\u0412\u0441\u0435' },
  { key: 'checkin', label: 'Check-in' },
  { key: 'measurement', label: '\u0417\u0430\u043C\u0435\u0440\u044B' },
  { key: 'lab', label: '\u0410\u043D\u0430\u043B\u0438\u0437\u044B' },
  { key: 'massage', label: '\u041C\u0430\u0441\u0441\u0430\u0436' },
  { key: 'questionnaire', label: '\u041E\u043F\u0440\u043E\u0441\u043D\u0438\u043A\u0438' },
];

// Цвета статусов
const STATUS_COLORS: Record<string, string> = {
  good: '#4CAF50',
  warning: '#FF9800',
  critical: '#F44336',
};

// Форматирование даты
function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
}

// Группировка событий по дате
function groupByDate(events: TimelineEvent[]): Array<{ date: string; label: string; items: TimelineEvent[] }> {
  const groups = new Map<string, TimelineEvent[]>();
  for (const ev of events) {
    const key = new Date(ev.date).toISOString().slice(0, 10);
    const arr = groups.get(key) ?? [];
    arr.push(ev);
    groups.set(key, arr);
  }

  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    date: dateKey,
    label: formatDateLabel(dateKey),
    items,
  }));
}

function formatDateLabel(dateKey: string): string {
  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  if (dateKey === today) return '\u0421\u0435\u0433\u043E\u0434\u043D\u044F';
  if (dateKey === yesterday) return '\u0412\u0447\u0435\u0440\u0430';
  return new Date(dateKey).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
  });
}

interface TimelinePageProps {
  onBack: () => void;
  onSelectResult?: (id: string) => void;
}

export function TimelinePage({ onBack, onSelectResult }: TimelinePageProps) {
  useBackButton(onBack);
  const { userId } = useTelegram();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [filter, setFilter] = useState<TimelineEventType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Начальная загрузка
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    getTimelineEvents(userId, PAGE_SIZE, 0)
      .then((data) => {
        setEvents(data);
        setHasMore(data.length >= PAGE_SIZE);
      })
      .catch((err) => {
        console.error('[TimelinePage] \u041E\u0448\u0438\u0431\u043A\u0430 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0438:', err);
        setError('\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0438\u0441\u0442\u043E\u0440\u0438\u044E');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  // Подгрузка следующей страницы
  const handleLoadMore = useCallback(async () => {
    if (!userId || loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const data = await getTimelineEvents(userId, PAGE_SIZE, events.length);
      setEvents((prev) => [...prev, ...data]);
      setHasMore(data.length >= PAGE_SIZE);
    } catch (err) {
      console.error('[TimelinePage] \u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u043E\u0434\u0433\u0440\u0443\u0437\u043A\u0438:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [userId, events.length, loadingMore, hasMore]);

  // Фильтрация на клиенте
  const filtered = filter === 'all' ? events : events.filter((e) => e.type === filter);
  const groups = groupByDate(filtered);

  if (loading) {
    return <TgLoader text="Загрузка истории..." />;
  }

  if (error) {
    return <TgErrorView message={error} onRetry={() => window.location.reload()} />;
  }

  if (events.length === 0) {
    return (
      <TgEmptyState
        icon="📋"
        title="Нет событий"
        description="Ваша медицинская история появится здесь после первых check-inов и замеров"
      />
    );
  }

  return (
    <div className="pb-4">
      {/* Фильтры */}
      <div className="px-4 pt-3 pb-2 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {FILTERS.map((f) => {
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors"
                style={{
                  backgroundColor: active
                    ? 'var(--tg-theme-button-color, #3390ec)'
                    : 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                  color: active
                    ? 'var(--tg-theme-button-text-color, #fff)'
                    : 'var(--tg-theme-text-color, #fff)',
                }}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Сгруппированный список */}
      {filtered.length === 0 ? (
        <div
          className="p-4 text-center text-sm"
          style={{ color: 'var(--tg-theme-hint-color, #8e8e93)' }}
        >
          {'\u041D\u0435\u0442 \u0441\u043E\u0431\u044B\u0442\u0438\u0439 \u0432 \u044D\u0442\u043E\u0439 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438'}
        </div>
      ) : (
        groups.map((group) => (
          <Section key={group.date} header={group.label}>
            <div className="px-4 py-1">
              {group.items.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-start gap-3 py-2.5 border-b last:border-b-0"
                  style={{ borderColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)' }}
                  onClick={() => ev.detailId && onSelectResult?.(ev.detailId)}
                  role={ev.detailId ? 'button' : undefined}
                >
                  {/* Иконка */}
                  <div className="text-xl flex-shrink-0 mt-0.5">{ev.icon}</div>

                  {/* Контент */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span
                        className="font-medium text-sm"
                        style={{ color: 'var(--tg-theme-text-color, #fff)' }}
                      >
                        {ev.title}
                      </span>
                      <span
                        className="text-xs flex-shrink-0 ml-2"
                        style={{ color: 'var(--tg-theme-hint-color, #8e8e93)' }}
                      >
                        {formatTime(ev.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {ev.status && (
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: STATUS_COLORS[ev.status] }}
                        />
                      )}
                      <span
                        className="text-xs truncate"
                        style={{ color: 'var(--tg-theme-hint-color, #8e8e93)' }}
                      >
                        {ev.description}
                      </span>
                    </div>
                  </div>

                  {/* Стрелка если кликабельно */}
                  {ev.detailId && (
                    <div
                      className="text-sm flex-shrink-0 mt-1"
                      style={{ color: 'var(--tg-theme-hint-color, #8e8e93)' }}
                    >
                      {'\u203A'}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </Section>
        ))
      )}

      {/* Кнопка подгрузки */}
      {hasMore && (
        <div className="px-4 pt-3 pb-1">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="w-full py-2.5 rounded-xl text-sm font-medium"
            style={{
              backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
              color: 'var(--tg-theme-link-color, #007aff)',
            }}
          >
            {loadingMore ? '\u0417\u0430\u0433\u0440\u0443\u0437\u043A\u0430...' : '\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0435\u0449\u0451'}
          </button>
        </div>
      )}
    </div>
  );
}
