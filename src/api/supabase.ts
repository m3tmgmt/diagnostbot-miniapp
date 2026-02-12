// Supabase клиент — чтение результатов диагностики и опросников
import { createClient } from '@supabase/supabase-js';
import type {
  DiagnosticResult,
  QuestionnaireResultRow,
  UnifiedResult,
  SeverityLevel,
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

/** Получает один результат по ID */
export async function getResultById(id: string): Promise<DiagnosticResult | null> {
  const { data, error } = await supabase
    .from('user_diagnostic_results')
    .select('*')
    .eq('id', id)
    .single();

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

/** Получает один результат опросника по ID */
export async function getQuestionnaireResultById(
  id: string,
): Promise<QuestionnaireResultRow | null> {
  const { data, error } = await supabase
    .from('questionnaire_results')
    .select('*')
    .eq('id', id)
    .single();

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

/** Получает ВСЕ результаты (body scan + опросники), сортирует по дате */
export async function getAllResults(userId: number, limit = 40): Promise<UnifiedResult[]> {
  const [diagResults, questResults] = await Promise.all([
    getResults(userId, limit),
    getQuestionnaireResults(userId, limit),
  ]);

  const unified: UnifiedResult[] = [
    ...diagResults.map(toDiagUnified),
    ...questResults.map(toQuestUnified),
  ];

  // Сортировка от новых к старым
  unified.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return unified.slice(0, limit);
}
