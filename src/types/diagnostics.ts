// Типы для данных диагностики (Mini App)
// Таблицы: user_diagnostic_results + questionnaire_results

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

// === Опросники (questionnaire_results) ===

/** Тип опросника */
export type QuestionnaireType = 'pss10' | 'gad7' | 'phq9';

/** Уровень тяжести */
export type SeverityLevel = 'minimal' | 'mild' | 'moderate' | 'severe';

/** Категория для фильтрации */
export type ResultCategory = 'all' | 'body_scan' | 'questionnaire';

/** Строка из таблицы questionnaire_results */
export interface QuestionnaireResultRow {
  id: string;
  user_id: number;
  type: QuestionnaireType;
  answers: number[];
  score: number;
  max_score: number;
  severity: SeverityLevel;
  interpretation: string;
  recommendations: string[];
  completed_at: string;
  created_at: string;
}

/** Унифицированный результат (body scan + опросники) */
export interface UnifiedResult {
  id: string;
  kind: 'body_scan' | 'questionnaire';
  testId: string;
  score: number | null;
  maxScore: number;
  date: string;
  // Body scan
  resultData?: DiagnosticResultData;
  aiConfidence?: number | null;
  // Опросники
  severity?: SeverityLevel;
  interpretation?: string;
  recommendations?: string[];
}
