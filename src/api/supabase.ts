// Supabase клиент — только чтение результатов диагностики
import { createClient } from '@supabase/supabase-js';
import type { DiagnosticResult } from '../types/diagnostics';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
