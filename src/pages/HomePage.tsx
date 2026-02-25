// Главная страница — Health Dashboard + список результатов
import { useEffect, useState } from 'react';
import { Section, SegmentedControl } from '@telegram-apps/telegram-ui';
import {
  HealthScoreRing,
  TrendBadge,
  HealthCard,
  TgLoader,
  TgErrorView,
  TgEmptyState,
} from '@plemya/design-system';
import { ResultCard } from '../components/ResultCard';
import { useTelegram } from '../hooks/useTelegram';
import {
  getAllResults,
  getLatestHealthScore,
  getHealthScoreHistory,
  getCheckins,
  getMeasurements,
  getLabResults,
  type HealthScoreRow,
  type CheckinRow,
  type MeasurementRow,
  type LabResultRow,
} from '../api/supabase';
import type { UnifiedResult, ResultCategory } from '../types/diagnostics';

interface HomePageProps {
  onSelectResult: (id: string) => void;
  onNavigateToMeasurements: () => void;
  onNavigateToDiary: () => void;
  onNavigateToHealthScore: () => void;
  onNavigateToTimeline: () => void;
  onNavigateToEmergency: () => void;
  onNavigateToBodyMap: () => void;
  onNavigateToLabs: () => void;
}

/** Статус для HealthCard по значению компонента */
function cardStatus(score: number | null): 'good' | 'warning' | 'bad' | 'neutral' {
  if (score == null) return 'neutral';
  if (score >= 60) return 'good';
  if (score >= 40) return 'warning';
  return 'bad';
}

/** Форматирование даты для recent activity */
function formatRelativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffDays === 0) return `сегодня ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`;
  if (diffDays === 1) return 'вчера';
  if (diffDays < 7) return `${diffDays} дн. назад`;
  return d.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Тип для Recent Activity
interface RecentEvent {
  id: string;
  icon: string;
  title: string;
  description: string;
  date: string;
}

export function HomePage({
  onSelectResult,
  onNavigateToMeasurements,
  onNavigateToDiary,
  onNavigateToHealthScore,
  onNavigateToTimeline,
  onNavigateToEmergency,
  onNavigateToBodyMap,
  onNavigateToLabs,
}: HomePageProps) {
  const { userId } = useTelegram();
  const [results, setResults] = useState<UnifiedResult[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScoreRow | null>(null);
  const [scoreTrend, setScoreTrend] = useState<number | null>(null);
  const [recentEvents, setRecentEvents] = useState<RecentEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ResultCategory>('all');

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    // Загрузка всех данных параллельно
    Promise.all([
      getAllResults(userId),
      getLatestHealthScore(userId),
      getHealthScoreHistory(userId, 7),
      getCheckins(userId, 3),
      getMeasurements(userId, undefined, 3),
      getLabResults(userId, 1),
    ]).then(([resultsData, latestScore, historyData, checkins, measurements, labs]) => {
      setResults(resultsData);
      setHealthScore(latestScore);

      // Вычислить тренд: разница с самым ранним значением за 7 дней
      if (latestScore && historyData.length >= 2) {
        const oldest = historyData[historyData.length - 1];
        setScoreTrend(latestScore.score - oldest.score);
      }

      // Собрать recent events
      const events: RecentEvent[] = [];
      checkins.forEach((c: CheckinRow) => {
        events.push({
          id: `checkin-${c.id}`,
          icon: '✅',
          title: 'Check-in',
          description: formatRelativeDate(c.checked_at),
          date: c.checked_at,
        });
      });
      measurements.forEach((m: MeasurementRow) => {
        const typeEmoji: Record<string, string> = {
          weight: '⚖️', blood_pressure: '💓', pulse: '💗', temperature: '🌡️',
        };
        events.push({
          id: `measurement-${m.id}`,
          icon: typeEmoji[m.measurement_type] ?? '📏',
          title: `Замер: ${m.measurement_type}`,
          description: formatRelativeDate(m.measured_at),
          date: m.measured_at,
        });
      });
      labs.forEach((l: LabResultRow) => {
        events.push({
          id: `lab-${l.id}`,
          icon: '🔬',
          title: 'Анализы',
          description: formatRelativeDate(l.created_at),
          date: l.created_at,
        });
      });

      // Сортировка по дате (новые первые), макс 5
      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setRecentEvents(events.slice(0, 5));
    }).catch((err) => {
      console.error('[HomePage] Ошибка загрузки:', err);
      setError('Не удалось загрузить данные');
    }).finally(() => {
      setLoading(false);
    });
  }, [userId]);

  // Фильтрация результатов по вкладке
  const filtered = tab === 'all'
    ? results
    : results.filter((r) => r.kind === tab);

  if (loading) {
    return <TgLoader text="Загрузка..." />;
  }

  if (error) {
    return <TgErrorView message={error} onRetry={() => window.location.reload()} />;
  }

  return (
    <div>
      {/* === HEALTH DASHBOARD === */}
      {healthScore ? (
        <>
          {/* Health Score Ring */}
          <div style={{ textAlign: 'center', padding: '20px 16px 8px' }}>
            <HealthScoreRing
              value={healthScore.score}
              label="Health Score"
              size={140}
              strokeWidth={10}
            />
            {scoreTrend !== null && (
              <div style={{ marginTop: 8 }}>
                <TrendBadge value={scoreTrend} unit=" за 7 дн." />
              </div>
            )}
          </div>

          {/* Quick Stats 2×2 */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 8,
              padding: '8px 16px',
            }}
          >
            <HealthCard
              title="Сон"
              icon="💤"
              value={healthScore.sleep_score ?? '—'}
              unit={healthScore.sleep_score != null ? '/100' : ''}
              status={cardStatus(healthScore.sleep_score)}
              onClick={onNavigateToHealthScore}
            />
            <HealthCard
              title="Активность"
              icon="🏃"
              value={healthScore.activity_score ?? '—'}
              unit={healthScore.activity_score != null ? '/100' : ''}
              status={cardStatus(healthScore.activity_score)}
              onClick={onNavigateToHealthScore}
            />
            <HealthCard
              title="Ментальное здоровье"
              icon="🧠"
              value={healthScore.mental_score ?? '—'}
              unit={healthScore.mental_score != null ? '/100' : ''}
              status={cardStatus(healthScore.mental_score)}
              onClick={onNavigateToHealthScore}
            />
            <HealthCard
              title="Биометрия"
              icon="💊"
              value={healthScore.biometrics_score ?? '—'}
              unit={healthScore.biometrics_score != null ? '/100' : ''}
              status={cardStatus(healthScore.biometrics_score)}
              onClick={onNavigateToHealthScore}
            />
          </div>
        </>
      ) : (
        <div style={{ padding: '16px' }}>
          <TgEmptyState
            icon="❤️"
            title="Пройдите первый чек-ин"
            description="Чтобы увидеть ваш Health Score"
          />
        </div>
      )}

      {/* Recent Activity */}
      {recentEvents.length > 0 && (
        <Section header="Последние события">
          <div style={{ padding: '0 16px 8px' }}>
            {recentEvents.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 0',
                  borderBottom: '1px solid var(--plm-border, #c6c6c8)',
                }}
              >
                <span style={{ fontSize: 18 }}>{ev.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--plm-text)' }}>
                    {ev.title}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--plm-text-hint)' }}>
                    {ev.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Navigation: Body Map + Labs + Timeline + Emergency */}
      <div className="px-4 pt-2 pb-1 grid grid-cols-2 gap-2">
        <button
          className="rounded-xl p-3 text-left"
          style={{ backgroundColor: 'var(--plm-bg-secondary)', minHeight: 44 }}
          onClick={() => onNavigateToBodyMap()}
        >
          <div className="text-lg mb-1">💀</div>
          <div className="text-sm font-medium" style={{ color: 'var(--plm-text)' }}>
            Карта тела
          </div>
          <div className="text-xs" style={{ color: 'var(--plm-text-hint)' }}>
            Зоны и findings
          </div>
        </button>
        <button
          className="rounded-xl p-3 text-left"
          style={{ backgroundColor: 'var(--plm-bg-secondary)', minHeight: 44 }}
          onClick={() => onNavigateToLabs()}
        >
          <div className="text-lg mb-1">🔬</div>
          <div className="text-sm font-medium" style={{ color: 'var(--plm-text)' }}>
            Анализы
          </div>
          <div className="text-xs" style={{ color: 'var(--plm-text-hint)' }}>
            Результаты
          </div>
        </button>
        <button
          className="rounded-xl p-3 text-left"
          style={{ backgroundColor: 'var(--plm-bg-secondary)', minHeight: 44 }}
          onClick={() => onNavigateToTimeline()}
        >
          <div className="text-lg mb-1">📅</div>
          <div className="text-sm font-medium" style={{ color: 'var(--plm-text)' }}>
            История здоровья
          </div>
          <div className="text-xs" style={{ color: 'var(--plm-text-hint)' }}>
            Все события
          </div>
        </button>
        <button
          className="rounded-xl p-3 text-left"
          style={{ backgroundColor: 'var(--plm-bg-secondary)', minHeight: 44 }}
          onClick={() => onNavigateToEmergency()}
        >
          <div className="text-lg mb-1">🆘</div>
          <div className="text-sm font-medium" style={{ color: 'var(--plm-text)' }}>
            Экстренная карта
          </div>
          <div className="text-xs" style={{ color: 'var(--plm-text-hint)' }}>
            Мед. данные
          </div>
        </button>
      </div>

      {/* === RESULTS LIST === */}
      <div className="px-4 pt-3 pb-1">
        <SegmentedControl>
          <SegmentedControl.Item
            selected={false}
            onClick={() => onNavigateToHealthScore()}
          >
            🩺 Score
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={tab === 'all'}
            onClick={() => setTab('all')}
          >
            Все
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={tab === 'body_scan'}
            onClick={() => setTab('body_scan')}
          >
            Body Scan
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={tab === 'questionnaire'}
            onClick={() => setTab('questionnaire')}
          >
            Опросники
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={false}
            onClick={() => onNavigateToMeasurements()}
          >
            Замеры
          </SegmentedControl.Item>
          <SegmentedControl.Item
            selected={false}
            onClick={() => onNavigateToDiary()}
          >
            Дневник
          </SegmentedControl.Item>
        </SegmentedControl>
      </div>

      {results.length === 0 ? (
        <TgEmptyState
          icon="📊"
          title="Нет результатов"
          description="Пройди диагностику в боте, чтобы увидеть результаты здесь"
        />
      ) : (
        <Section header={`Результаты (${filtered.length})`}>
          {filtered.length === 0 ? (
            <div
              className="p-4 text-center text-sm"
              style={{ color: 'var(--plm-text-hint)' }}
            >
              Нет результатов в этой категории
            </div>
          ) : (
            filtered.map((r) => (
              <ResultCard
                key={r.id}
                result={r}
                onClick={() => onSelectResult(r.id)}
              />
            ))
          )}
        </Section>
      )}
    </div>
  );
}
