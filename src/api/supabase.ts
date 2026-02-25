// Supabase клиент — чтение результатов диагностики и опросников
import { createClient } from '@supabase/supabase-js';
import type {
  DiagnosticResult,
  QuestionnaireResultRow,
  UnifiedResult,
  SeverityLevel,
  TimelineEvent,
  TimelineEventType,
  EmergencyInfo,
} from '../types/diagnostics';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// === Body Scan (user_diagnostic_results) ===

/** Получает историю результатов пользователя */
export async function getResults(userId: number, limit = 20): Promise<DiagnosticResult[]> {
  const { data, error } = await supabase
    .from('user_diagnostic_results')
    .select('*')
    .eq('telegram_id', userId)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[miniapp] Error fetching results:', error);
    return [];
  }
  return (data as DiagnosticResult[]) ?? [];
}

/** Получает один результат по ID (с проверкой принадлежности пользователю) */
export async function getResultById(id: string, userId?: number | null): Promise<DiagnosticResult | null> {
  let query = supabase
    .from('user_diagnostic_results')
    .select('*')
    .eq('id', id);

  // IDOR fix: фильтр по telegram_id если userId передан
  if (userId) {
    query = query.eq('telegram_id', userId);
  }

  const { data, error } = await query.single();
  if (error) return null;
  return data as DiagnosticResult;
}

/** Получает результаты по конкретному тесту (для тренда) */
export async function getResultsByTest(userId: number, testId: string, limit = 10): Promise<DiagnosticResult[]> {
  const { data, error } = await supabase
    .from('user_diagnostic_results')
    .select('*')
    .eq('telegram_id', userId)
    .eq('test_id', testId)
    .order('executed_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as DiagnosticResult[]) ?? [];
}

// === Опросники (questionnaire_results) ===

/** Получает историю опросников пользователя */
export async function getQuestionnaireResults(
  userId: number,
  limit = 20,
): Promise<QuestionnaireResultRow[]> {
  const { data, error } = await supabase
    .from('questionnaire_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[miniapp] Error fetching questionnaire results:', error);
    return [];
  }
  return (data as QuestionnaireResultRow[]) ?? [];
}

/** Получает один результат опросника по ID (с проверкой принадлежности пользователю) */
export async function getQuestionnaireResultById(
  id: string,
  userId?: number | null,
): Promise<QuestionnaireResultRow | null> {
  let query = supabase
    .from('questionnaire_results')
    .select('*')
    .eq('id', id);

  // IDOR fix: фильтр по user_id если userId передан
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();
  if (error) return null;
  return data as QuestionnaireResultRow;
}

/** Получает опросники по типу (для тренда) */
export async function getQuestionnaireResultsByType(
  userId: number,
  type: string,
  limit = 10,
): Promise<QuestionnaireResultRow[]> {
  const { data, error } = await supabase
    .from('questionnaire_results')
    .select('*')
    .eq('user_id', userId)
    .eq('type', type)
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) return [];
  return (data as QuestionnaireResultRow[]) ?? [];
}

// === Конвертеры → UnifiedResult ===

/** DiagnosticResult → UnifiedResult */
export function toDiagUnified(r: DiagnosticResult): UnifiedResult {
  return {
    id: r.id,
    kind: 'body_scan',
    testId: r.test_id,
    score: r.score,
    maxScore: 100,
    date: r.executed_at,
    resultData: r.result_data,
    aiConfidence: r.ai_confidence,
    recommendations: r.result_data?.recommendations,
  };
}

/** QuestionnaireResultRow → UnifiedResult */
export function toQuestUnified(r: QuestionnaireResultRow): UnifiedResult {
  return {
    id: r.id,
    kind: 'questionnaire',
    testId: r.type,
    score: r.score,
    maxScore: r.max_score,
    date: r.completed_at,
    severity: r.severity as SeverityLevel,
    interpretation: r.interpretation,
    recommendations: r.recommendations,
  };
}

// === Замеры (health_measurements) ===

export interface MeasurementRow {
  id: string;
  user_id: number;
  measurement_type: 'weight' | 'blood_pressure' | 'pulse' | 'temperature';
  value: Record<string, number>;
  unit: string;
  note: string | null;
  measured_at: string;
  created_at: string;
}

/** Получает историю замеров пользователя по типу */
export async function getMeasurements(
  userId: number,
  type?: string,
  limit = 30,
): Promise<MeasurementRow[]> {
  let query = supabase
    .from('health_measurements')
    .select('*')
    .eq('user_id', userId)
    .order('measured_at', { ascending: false })
    .limit(limit);

  if (type) {
    query = query.eq('measurement_type', type);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[miniapp] Error fetching measurements:', error);
    return [];
  }
  return (data as MeasurementRow[]) ?? [];
}

/** Получает последний замер каждого типа */
export async function getLatestMeasurements(
  userId: number,
): Promise<Record<string, MeasurementRow>> {
  const types = ['weight', 'blood_pressure', 'pulse', 'temperature'];
  const results: Record<string, MeasurementRow> = {};

  // Один запрос, group в памяти
  const { data, error } = await supabase
    .from('health_measurements')
    .select('*')
    .eq('user_id', userId)
    .in('measurement_type', types)
    .order('measured_at', { ascending: false })
    .limit(100);

  if (error || !data) return results;

  for (const row of data as MeasurementRow[]) {
    if (!results[row.measurement_type]) {
      results[row.measurement_type] = row;
    }
  }
  return results;
}

// === Check-ins (health_checkups) ===

export interface CheckinRow {
  id: string;
  user_id: number;
  mood: number | null;
  energy_level: number | null;
  sleep_quality: number | null;
  stress_level: number | null;
  notes: string | null;
  checked_at: string;
  created_at: string;
}

/** Получает историю check-ins пользователя */
export async function getCheckins(
  userId: number,
  limit = 30,
): Promise<CheckinRow[]> {
  const { data, error } = await supabase
    .from('health_checkups')
    .select('*')
    .eq('user_id', userId)
    .order('checked_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[miniapp] Error fetching checkins:', error);
    return [];
  }
  return (data as CheckinRow[]) ?? [];
}

/** Считает streak (последовательные дни с check-in) */
export function calculateStreakFromRows(rows: CheckinRow[]): number {
  if (rows.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < 90; dayOffset++) {
    const checkDate = new Date(today);
    checkDate.setDate(checkDate.getDate() - dayOffset);
    const dateStr = checkDate.toISOString().slice(0, 10);

    const has = rows.some(
      (c) => new Date(c.checked_at).toISOString().slice(0, 10) === dateStr,
    );

    if (has) {
      streak++;
    } else if (dayOffset === 0) {
      continue; // Сегодня ещё нет — проверяем вчера
    } else {
      break;
    }
  }
  return streak;
}

/** Получает ВСЕ результаты (body scan + опросники + анализы), сортирует по дате */
export async function getAllResults(userId: number, limit = 40): Promise<UnifiedResult[]> {
  const [diagResults, questResults, labResults] = await Promise.all([
    getResults(userId, limit),
    getQuestionnaireResults(userId, limit),
    getLabResults(userId, limit),
  ]);

  const unified: UnifiedResult[] = [
    ...diagResults.map(toDiagUnified),
    ...questResults.map(toQuestUnified),
    ...labResults.map(toLabUnified),
  ];

  // Сортировка от новых к старым
  unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return unified.slice(0, limit);
}

// === Health Score (health_scores) ===

export interface HealthScoreRow {
  id: string;
  user_id: number;
  score: number;
  activity_score: number | null;
  sleep_score: number | null;
  nutrition_score: number | null;
  mental_score: number | null;
  recovery_score: number | null;
  biometrics_score: number | null;
  source: string;
  calculated_at: string;
  created_at: string;
}

/** Получает последний Health Score */
export async function getLatestHealthScore(userId: number): Promise<HealthScoreRow | null> {
  const { data, error } = await supabase
    .from('health_scores')
    .select('*')
    .eq('user_id', userId)
    .order('calculated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) return null;
  return data as HealthScoreRow;
}

/** Получает историю Health Score (для тренда) */
export async function getHealthScoreHistory(userId: number, days = 30): Promise<HealthScoreRow[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data, error } = await supabase
    .from('health_scores')
    .select('*')
    .eq('user_id', userId)
    .gte('calculated_at', since.toISOString())
    .order('calculated_at', { ascending: true });

  if (error) {
    console.error('[miniapp] Error fetching health score history:', error);
    return [];
  }
  return (data as HealthScoreRow[]) ?? [];
}

// === Lab Results (lab_results) ===

export interface LabResultRow {
  id: string;
  user_id: number;
  category: string;
  lab_name: string | null;
  test_date: string;
  source: string;
  values: Array<{
    name: string;
    nameRu: string;
    value: number;
    unit: string;
    refMin?: number;
    refMax?: number;
    status: string;
  }>;
  ai_interpretation: string | null;
  recommendations: string[] | null;
  warnings: string[] | null;
  created_at: string;
}

/** Получает результат анализа по ID (с проверкой принадлежности пользователю) */
export async function getLabResultById(id: string, userId?: number | null): Promise<LabResultRow | null> {
  let query = supabase
    .from('lab_results')
    .select('*')
    .eq('id', id);

  // IDOR fix: фильтр по user_id если userId передан
  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data, error } = await query.single();
  if (error) return null;
  return data as LabResultRow;
}

/** Получает историю анализов пользователя */
export async function getLabResults(userId: number, limit = 20): Promise<LabResultRow[]> {
  const { data, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('user_id', userId)
    .order('test_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[miniapp] Error fetching lab results:', error);
    return [];
  }
  return (data as LabResultRow[]) ?? [];
}

/** Тренд конкретного биомаркера — извлекает из JSONB values */
export async function getLabValueHistory(
  userId: number,
  biomarkerKey: string,
  monthsBack: number = 6,
): Promise<Array<{ date: string; value: number; refMin?: number; refMax?: number }>> {
  const since = new Date();
  since.setMonth(since.getMonth() - monthsBack);

  const { data, error } = await supabase
    .from('lab_results')
    .select('test_date, values')
    .eq('user_id', userId)
    .gte('test_date', since.toISOString())
    .order('test_date', { ascending: true });

  if (error || !data) return [];

  const points: Array<{ date: string; value: number; refMin?: number; refMax?: number }> = [];

  for (const row of data as Array<{ test_date: string; values: LabResultRow['values'] }>) {
    const match = row.values?.find(v => v.name === biomarkerKey);
    if (match) {
      points.push({
        date: row.test_date,
        value: match.value,
        refMin: match.refMin,
        refMax: match.refMax,
      });
    }
  }

  return points;
}

/** Конвертация LabResultRow → UnifiedResult */
export function toLabUnified(r: LabResultRow): UnifiedResult {
  const abnormal = r.values?.filter(v => v.status !== 'normal').length ?? 0;
  return {
    id: r.id,
    kind: 'lab',
    testId: r.category,
    score: abnormal > 0 ? abnormal : null,
    maxScore: r.values?.length ?? 0,
    date: r.test_date,
    interpretation: r.ai_interpretation ?? undefined,
    recommendations: r.recommendations ?? undefined,
    labValues: r.values ?? undefined,
    warnings: r.warnings ?? undefined,
    labCategory: r.category,
  };
}

// === Medical Timeline ===

/** Строка из pre_session_assessments (массаж) */
export interface MassageSessionRow {
  id: string;
  chief_complaint: string | null;
  status: string;
  created_at: string;
}

/** Получает массажные сеансы для таймлайна */
export async function getMassageSessions(
  userId: number,
  limit = 20,
): Promise<MassageSessionRow[]> {
  // pre_session_assessments привязаны через practitioner_clients.client_telegram_id
  const { data, error } = await supabase
    .from('pre_session_assessments')
    .select('id, chief_complaint, status, created_at, practitioner_clients!inner(client_telegram_id)')
    .eq('practitioner_clients.client_telegram_id', String(userId))
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[miniapp] Error fetching massage sessions:', error);
    return [];
  }
  return (data as unknown as MassageSessionRow[]) ?? [];
}

// Хелперы для форматирования замеров в таймлайне
const MEASUREMENT_NAMES: Record<string, string> = {
  weight: 'Вес',
  blood_pressure: 'Давление',
  pulse: 'Пульс',
  temperature: 'Температура',
};

const MEASUREMENT_ICONS: Record<string, string> = {
  weight: '\u2696\uFE0F',
  blood_pressure: '\uD83D\uDC93',
  pulse: '\uD83D\uDC97',
  temperature: '\uD83C\uDF21\uFE0F',
};

function formatMeasurementValue(m: MeasurementRow): string {
  const v = m.value as Record<string, number>;
  switch (m.measurement_type) {
    case 'weight': return `${v.kg ?? v.value ?? '?'} \u043A\u0433`;
    case 'blood_pressure': return `${v.systolic ?? '?'}/${v.diastolic ?? '?'} \u043C\u043C \u0440\u0442.\u0441\u0442.`;
    case 'pulse': return `${v.bpm ?? v.value ?? '?'} \u0443\u0434/\u043C\u0438\u043D`;
    case 'temperature': return `${v.celsius ?? v.value ?? '?'} \u00B0C`;
    default: return JSON.stringify(v);
  }
}

/** Квалификаторы опросников */
const QUEST_NAMES: Record<string, string> = {
  pss10: 'PSS-10 (\u0441\u0442\u0440\u0435\u0441\u0441)',
  gad7: 'GAD-7 (\u0442\u0440\u0435\u0432\u043E\u0433\u0430)',
  phq9: 'PHQ-9 (\u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435)',
};

/**
 * Получает ВСЕ события для Medical Timeline.
 * 5 параллельных запросов с graceful degradation (Principle 6).
 */
export async function getTimelineEvents(
  userId: number,
  limit = 20,
  offset = 0,
): Promise<TimelineEvent[]> {
  const fetchLimit = limit + offset;

  const [checkins, measurements, labs, questionnaires, massages] = await Promise.all([
    getCheckins(userId, fetchLimit).catch(() => [] as CheckinRow[]),
    getMeasurements(userId, undefined, fetchLimit).catch(() => [] as MeasurementRow[]),
    getLabResults(userId, fetchLimit).catch(() => [] as LabResultRow[]),
    getQuestionnaireResults(userId, fetchLimit).catch(() => [] as QuestionnaireResultRow[]),
    getMassageSessions(userId, fetchLimit).catch(() => [] as MassageSessionRow[]),
  ]);

  const events: TimelineEvent[] = [];

  // Check-ins
  for (const c of checkins) {
    const parts: string[] = [];
    if (c.mood != null) parts.push(`\u041D\u0430\u0441\u0442\u0440\u043E\u0435\u043D\u0438\u0435 ${c.mood}/5`);
    if (c.energy_level != null) parts.push(`\u042D\u043D\u0435\u0440\u0433\u0438\u044F ${c.energy_level}/5`);
    if (c.sleep_quality != null) parts.push(`\u0421\u043E\u043D ${c.sleep_quality}/5`);
    if (c.stress_level != null) parts.push(`\u0421\u0442\u0440\u0435\u0441\u0441 ${c.stress_level}/5`);
    events.push({
      id: c.id,
      type: 'checkin',
      date: c.checked_at,
      title: 'Check-in',
      description: parts.join(' \u00B7 '),
      icon: '\uD83D\uDCCB',
    });
  }

  // Замеры
  for (const m of measurements) {
    events.push({
      id: m.id,
      type: 'measurement',
      date: m.measured_at,
      title: MEASUREMENT_NAMES[m.measurement_type] ?? '\u0417\u0430\u043C\u0435\u0440',
      description: formatMeasurementValue(m),
      icon: MEASUREMENT_ICONS[m.measurement_type] ?? '\uD83D\uDCCF',
    });
  }

  // Анализы
  for (const l of labs) {
    const abnormal = l.values?.filter(v => v.status !== 'normal').length ?? 0;
    events.push({
      id: l.id,
      type: 'lab',
      date: l.test_date,
      title: `\u0410\u043D\u0430\u043B\u0438\u0437\u044B: ${l.category}`,
      description: abnormal > 0
        ? `${abnormal} \u043E\u0442\u043A\u043B\u043E\u043D\u0435\u043D\u0438\u0439`
        : '\u0412\u0441\u0435 \u0432 \u043D\u043E\u0440\u043C\u0435',
      icon: '\uD83E\uDE78',
      detailId: l.id,
      status: abnormal > 0 ? 'warning' : 'good',
    });
  }

  // Опросники
  for (const q of questionnaires) {
    events.push({
      id: q.id,
      type: 'questionnaire',
      date: q.completed_at,
      title: QUEST_NAMES[q.type] ?? `\u041E\u043F\u0440\u043E\u0441\u043D\u0438\u043A: ${q.type}`,
      description: `${q.score}/${q.max_score} \u2014 ${q.interpretation}`,
      icon: '\uD83D\uDCDD',
      detailId: q.id,
      status: q.severity === 'severe' ? 'critical' : q.severity === 'moderate' ? 'warning' : 'good',
    });
  }

  // Массаж
  for (const ms of massages) {
    events.push({
      id: ms.id,
      type: 'massage',
      date: ms.created_at,
      title: '\u041C\u0430\u0441\u0441\u0430\u0436',
      description: ms.chief_complaint ?? '\u0421\u0435\u0430\u043D\u0441 \u043C\u0430\u0441\u0441\u0430\u0436\u0430',
      icon: '\uD83D\uDC86',
      status: ms.status === 'completed' ? 'good' : undefined,
    });
  }

  // Сортировка от новых к старым
  events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return events.slice(offset, offset + limit);
}

// === Body Map Findings ===

/** Находка по зоне тела (из session_notes / pre_session_assessments) */
export interface BodyMapFindingRow {
  zoneId: string;
  zoneName: string;
  description: string;
  intensity: number; // 0-10
  severity: 'normal' | 'attention' | 'concern';
  sessionDate: string;
  source: string;
}

/**
 * Получает данные body map для пользователя.
 * Источники: pre_session_assessments → SOAP / intake data с зонами боли.
 * Агрегирует последние findings по каждой зоне.
 */
export async function getBodyMapFindings(userId: number): Promise<BodyMapFindingRow[]> {
  // Получаем последние сеансы через связь с practitioner_clients
  const { data, error } = await supabase
    .from('pre_session_assessments')
    .select('id, intake_data, soap_data, status, created_at, practitioner_clients!inner(client_telegram_id)')
    .eq('practitioner_clients.client_telegram_id', String(userId))
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(10);

  if (error || !data) {
    console.error('[miniapp] Error fetching body map findings:', error);
    return [];
  }

  // Агрегировать зоны из intake_data.painZones
  const zoneMap = new Map<string, BodyMapFindingRow>();

  for (const row of data as Array<{
    id: string;
    intake_data: Record<string, unknown> | null;
    soap_data: Record<string, unknown> | null;
    created_at: string;
  }>) {
    const painZones = (row.intake_data?.painZones ?? row.intake_data?.pain_zones) as
      Array<{ zoneId?: string; bodyArea?: string; intensity?: number; painType?: string }> | undefined;

    if (!painZones || !Array.isArray(painZones)) continue;

    for (const zone of painZones) {
      const zoneId = zone.zoneId ?? zone.bodyArea ?? '';
      if (!zoneId) continue;

      // Не перезаписывать более свежие данные
      if (zoneMap.has(zoneId)) continue;

      const intensity = zone.intensity ?? 5;
      zoneMap.set(zoneId, {
        zoneId,
        zoneName: zoneId,
        description: zone.painType ? `${zone.painType} боль` : 'Отмечено мастером',
        intensity,
        severity: intensity <= 3 ? 'normal' : intensity <= 6 ? 'attention' : 'concern',
        sessionDate: row.created_at,
        source: 'Массаж',
      });
    }
  }

  return Array.from(zoneMap.values());
}

/** Получает список анализов для LabResultsTab (summary) */
export async function getLabResultsSummary(userId: number, limit = 20): Promise<LabResultRow[]> {
  return getLabResults(userId, limit);
}

// === Emergency Card ===

/** Профиль пользователя для шапки экстренной карты */
export interface UserProfileRow {
  full_name: string | null;
  birth_date: string | null;
  sex: string | null;
}

/** Получает экстренную мед. информацию */
export async function getEmergencyInfo(userId: number): Promise<EmergencyInfo | null> {
  const { data, error } = await supabase
    .from('user_states')
    .select('emergency_info')
    .eq('telegram_id', userId)
    .single();

  if (error || !data) return null;
  return (data.emergency_info as EmergencyInfo) ?? null;
}

/** Получает профиль пользователя для шапки Emergency Card */
export async function getUserProfile(userId: number): Promise<UserProfileRow | null> {
  const { data, error } = await supabase
    .from('user_states')
    .select('full_name, birth_date, sex')
    .eq('telegram_id', userId)
    .single();

  if (error || !data) return null;
  return data as UserProfileRow;
}

/** Сохраняет экстренную мед. информацию */
export async function saveEmergencyInfo(
  userId: number,
  info: EmergencyInfo,
): Promise<boolean> {
  const payload: EmergencyInfo = { ...info, updatedAt: new Date().toISOString() };
  const { error } = await supabase
    .from('user_states')
    .update({ emergency_info: payload })
    .eq('telegram_id', userId);

  if (error) {
    console.error('[miniapp] Error saving emergency info:', error);
    return false;
  }
  return true;
}
