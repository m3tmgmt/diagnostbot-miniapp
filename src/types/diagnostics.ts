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
export type ResultCategory = 'all' | 'body_scan' | 'questionnaire' | 'measurements' | 'lab';

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

// === Medical Timeline ===

/** Категории событий для Medical Timeline */
export type TimelineEventType = 'checkin' | 'measurement' | 'lab' | 'massage' | 'questionnaire';

/** Единое событие Medical Timeline */
export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  date: string;           // ISO timestamp
  title: string;          // "Check-in", "Вес", "Анализы: биохимия"
  description: string;    // "Настроение 4/5 · Энергия 3/5"
  icon: string;           // emoji
  /** Ссылка на детальную страницу (result ID) */
  detailId?: string;
  /** Статус события */
  status?: 'good' | 'warning' | 'critical';
}

// === Emergency Card ===

/** Экстренная медицинская карта (JSONB в user_states.emergency_info) */
export interface EmergencyInfo {
  bloodType: string | null;
  allergies: string[];
  chronicDiseases: string[];
  medications: string[];
  emergencyContacts: Array<{
    name: string;
    phone: string;
    relation: string;
  }>;
  specialNotes: string | null;
  updatedAt: string | null;
}

// === Body Map ===

/** Зона на body map (данные о состоянии зоны) */
export interface IBodyMapZone {
  zoneId: string;
  nameRu: string;
  anatomicalName: string;
  touchPoint: { x: number; y: number };
  intensity: number; // 0-10
  painType?: 'sharp' | 'dull' | 'burning' | 'aching' | 'throbbing' | 'other';
}

/** Определение зоны тела для SVG (каталог) */
export interface IBodyZoneDefinition {
  id: string;
  nameRu: string;
  anatomicalName: string;
  pathData: string;
  center: { x: number; y: number };
  views: Array<'front' | 'back' | 'side_left' | 'side_right'>;
  relatedAnatomy: string[];
}

/** Находка по зоне тела (из session_notes) */
export interface ZoneFinding {
  zoneId: string;
  zoneName: string;
  description: string;
  severity: 'normal' | 'attention' | 'concern';
  sessionDate: string;
  source: string;
}

// === Unified Results ===

/** Унифицированный результат (body scan + опросники + анализы) */
export interface UnifiedResult {
  id: string;
  kind: 'body_scan' | 'questionnaire' | 'lab';
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
  // Lab results
  labValues?: Array<{
    name: string;
    nameRu: string;
    value: number;
    unit: string;
    refMin?: number;
    refMax?: number;
    status: string;
  }>;
  warnings?: string[];
  labCategory?: string;
}
