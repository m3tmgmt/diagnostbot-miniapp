// Типы для данных диагностики (Mini App)
// Соответствует таблице user_diagnostic_results в Supabase

export interface PostureMetric {
  score: number;
  status: 'good' | 'warning' | 'critical';
  detail: string;
}

export interface DiagnosticResultData {
  metrics?: Record<string, PostureMetric>;
  recommendations?: string[];
  landmarks_detected?: number;
  processed_at?: string;
  media_url?: string;
}

export interface DiagnosticResult {
  id: string;
  telegram_id: number;
  test_id: string;
  score: number | null;
  ai_confidence: number | null;
  result_data: DiagnosticResultData;
  executed_at: string;
  execution_level: string;
  created_at: string;
}
