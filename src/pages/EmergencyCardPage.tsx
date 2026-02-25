// Emergency Card — экстренная медицинская карта (view + edit)
import { useEffect, useState, useCallback } from 'react';
import { Section } from '@telegram-apps/telegram-ui';
import { TgLoader, TgEmptyState } from '@plemya/design-system';
import { useTelegram, useBackButton } from '../hooks/useTelegram';
import {
  getEmergencyInfo,
  getUserProfile,
  saveEmergencyInfo,
  type UserProfileRow,
} from '../api/supabase';
import type { EmergencyInfo } from '../types/diagnostics';

// Варианты группы крови
const BLOOD_TYPES = [
  'A(I) Rh+', 'A(I) Rh-',
  'B(II) Rh+', 'B(II) Rh-',
  'AB(III) Rh+', 'AB(III) Rh-',
  'O(IV) Rh+', 'O(IV) Rh-',
];

/** Пустая карта по умолчанию */
function emptyInfo(): EmergencyInfo {
  return {
    bloodType: null,
    allergies: [],
    chronicDiseases: [],
    medications: [],
    emergencyContacts: [],
    specialNotes: null,
    updatedAt: null,
  };
}

/** Форматирование возраста */
function calculateAge(birthDate: string | null): string | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  if (now.getMonth() < birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())) {
    age--;
  }
  return `${age} \u043B\u0435\u0442`;
}

interface EmergencyCardPageProps {
  onBack: () => void;
}

export function EmergencyCardPage({ onBack }: EmergencyCardPageProps) {
  useBackButton(onBack);
  const { userId } = useTelegram();
  const [info, setInfo] = useState<EmergencyInfo>(emptyInfo());
  const [profile, setProfile] = useState<UserProfileRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isNew, setIsNew] = useState(false);

  // Стейт для формы редактирования
  const [draft, setDraft] = useState<EmergencyInfo>(emptyInfo());
  // Временные поля ввода
  const [allergyInput, setAllergyInput] = useState('');
  const [diseaseInput, setDiseaseInput] = useState('');
  const [medInput, setMedInput] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');

  // Загрузка данных
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    Promise.all([
      getEmergencyInfo(userId),
      getUserProfile(userId),
    ])
      .then(([ei, up]) => {
        setProfile(up);
        if (ei) {
          setInfo(ei);
          setDraft(ei);
        } else {
          setIsNew(true);
          setEditing(true);
        }
      })
      .catch((err) => {
        console.error('[EmergencyCard] \u041E\u0448\u0438\u0431\u043A\u0430:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [userId]);

  // Сохранение
  const handleSave = useCallback(async () => {
    if (!userId) return;
    setSaving(true);
    const ok = await saveEmergencyInfo(userId, draft);
    setSaving(false);
    if (ok) {
      setInfo(draft);
      setEditing(false);
      setIsNew(false);
    }
  }, [userId, draft]);

  // Начало редактирования
  const startEdit = useCallback(() => {
    setDraft({ ...info });
    setEditing(true);
  }, [info]);

  // Отмена
  const cancelEdit = useCallback(() => {
    setDraft({ ...info });
    setEditing(false);
    setAllergyInput('');
    setDiseaseInput('');
    setMedInput('');
  }, [info]);

  // Хелперы добавления/удаления элементов списков
  const addToList = (field: 'allergies' | 'chronicDiseases' | 'medications', value: string) => {
    if (!value.trim()) return;
    setDraft((prev) => ({ ...prev, [field]: [...prev[field], value.trim()] }));
  };

  const removeFromList = (field: 'allergies' | 'chronicDiseases' | 'medications', idx: number) => {
    setDraft((prev) => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== idx),
    }));
  };

  const addContact = () => {
    if (!contactName.trim() || !contactPhone.trim()) return;
    setDraft((prev) => ({
      ...prev,
      emergencyContacts: [
        ...prev.emergencyContacts,
        { name: contactName.trim(), phone: contactPhone.trim(), relation: contactRelation.trim() },
      ],
    }));
    setContactName('');
    setContactPhone('');
    setContactRelation('');
  };

  const removeContact = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      emergencyContacts: prev.emergencyContacts.filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return <TgLoader text="Загрузка карты..." />;
  }

  // ===== РЕЖИМ РЕДАКТИРОВАНИЯ =====
  if (editing) {
    return (
      <div className="pb-4">
        {/* Шапка */}
        <div
          className="px-4 py-3 mb-2 text-center"
          style={{ backgroundColor: 'var(--plm-destructive-bg)' }}
        >
          <div className="text-2xl mb-1">{'\u270F\uFE0F'}</div>
          <div
            className="font-bold text-sm"
            style={{ color: 'var(--tg-theme-text-color)' }}
          >
            {isNew ? '\u0421\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u044D\u043A\u0441\u0442\u0440\u0435\u043D\u043D\u043E\u0439 \u043A\u0430\u0440\u0442\u044B' : '\u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435'}
          </div>
        </div>

        {/* Группа крови */}
        <Section header={'\uD83E\uDE78 \u0413\u0440\u0443\u043F\u043F\u0430 \u043A\u0440\u043E\u0432\u0438'}>
          <div className="px-4 py-2">
            <select
              value={draft.bloodType ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, bloodType: e.target.value || null }))}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                color: 'var(--tg-theme-text-color, #fff)',
                border: '1px solid var(--tg-theme-hint-color, #555)',
              }}
            >
              <option value="">{'\u041D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430'}</option>
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>{bt}</option>
              ))}
            </select>
          </div>
        </Section>

        {/* Аллергии */}
        <Section header={'\u26A0\uFE0F \u0410\u043B\u043B\u0435\u0440\u0433\u0438\u0438'}>
          <div className="px-4 py-2">
            <div className="flex gap-2 mb-2">
              <input
                value={allergyInput}
                onChange={(e) => setAllergyInput(e.target.value)}
                placeholder={'\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u041F\u0435\u043D\u0438\u0446\u0438\u043B\u043B\u0438\u043D'}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                  color: 'var(--tg-theme-text-color, #fff)',
                  border: '1px solid var(--tg-theme-hint-color, #555)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToList('allergies', allergyInput);
                    setAllergyInput('');
                  }
                }}
              />
              <button
                onClick={() => { addToList('allergies', allergyInput); setAllergyInput(''); }}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
                  color: 'var(--tg-theme-button-text-color, #fff)',
                }}
              >+</button>
            </div>
            {draft.allergies.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {draft.allergies.map((a, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{ backgroundColor: 'var(--plm-destructive-bg)', color: 'var(--plm-text-destructive)' }}
                  >
                    {a}
                    <button onClick={() => removeFromList('allergies', i)} className="ml-0.5">{'\u00D7'}</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Хронические заболевания */}
        <Section header={'\uD83C\uDFE5 \u0425\u0440\u043E\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0437\u0430\u0431\u043E\u043B\u0435\u0432\u0430\u043D\u0438\u044F'}>
          <div className="px-4 py-2">
            <div className="flex gap-2 mb-2">
              <input
                value={diseaseInput}
                onChange={(e) => setDiseaseInput(e.target.value)}
                placeholder={'\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u0410\u0441\u0442\u043C\u0430'}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                  color: 'var(--tg-theme-text-color, #fff)',
                  border: '1px solid var(--tg-theme-hint-color, #555)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToList('chronicDiseases', diseaseInput);
                    setDiseaseInput('');
                  }
                }}
              />
              <button
                onClick={() => { addToList('chronicDiseases', diseaseInput); setDiseaseInput(''); }}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
                  color: 'var(--tg-theme-button-text-color, #fff)',
                }}
              >+</button>
            </div>
            {draft.chronicDiseases.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {draft.chronicDiseases.map((d, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{ backgroundColor: 'var(--plm-warning-bg)', color: 'var(--plm-health-warning)' }}
                  >
                    {d}
                    <button onClick={() => removeFromList('chronicDiseases', i)} className="ml-0.5">{'\u00D7'}</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Лекарства */}
        <Section header={'\uD83D\uDC8A \u0422\u0435\u043A\u0443\u0449\u0438\u0435 \u043B\u0435\u043A\u0430\u0440\u0441\u0442\u0432\u0430'}>
          <div className="px-4 py-2">
            <div className="flex gap-2 mb-2">
              <input
                value={medInput}
                onChange={(e) => setMedInput(e.target.value)}
                placeholder={'\u041D\u0430\u043F\u0440\u0438\u043C\u0435\u0440: \u041C\u0435\u0442\u0444\u043E\u0440\u043C\u0438\u043D 500\u043C\u0433'}
                className="flex-1 px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                  color: 'var(--tg-theme-text-color, #fff)',
                  border: '1px solid var(--tg-theme-hint-color, #555)',
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addToList('medications', medInput);
                    setMedInput('');
                  }
                }}
              />
              <button
                onClick={() => { addToList('medications', medInput); setMedInput(''); }}
                className="px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
                  color: 'var(--tg-theme-button-text-color, #fff)',
                }}
              >+</button>
            </div>
            {draft.medications.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {draft.medications.map((m, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs"
                    style={{ backgroundColor: 'var(--plm-link-bg)', color: 'var(--plm-text-link)' }}
                  >
                    {m}
                    <button onClick={() => removeFromList('medications', i)} className="ml-0.5">{'\u00D7'}</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </Section>

        {/* Экстренные контакты */}
        <Section header={'\uD83D\uDCDE \u042D\u043A\u0441\u0442\u0440\u0435\u043D\u043D\u044B\u0435 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B'}>
          <div className="px-4 py-2 space-y-2">
            {draft.emergencyContacts.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5 border-b last:border-b-0"
                style={{ borderColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)' }}
              >
                <div>
                  <div className="text-sm font-medium" style={{ color: 'var(--tg-theme-text-color)' }}>
                    {c.name} {c.relation && `(${c.relation})`}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--tg-theme-hint-color)' }}>{c.phone}</div>
                </div>
                <button
                  onClick={() => removeContact(i)}
                  className="text-xs px-2 py-1 rounded"
                  style={{ color: '#F44336' }}
                >{'\u0423\u0434\u0430\u043B\u0438\u0442\u044C'}</button>
              </div>
            ))}

            {/* Форма добавления контакта */}
            <div className="space-y-1.5 pt-1">
              <input
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={'\u0418\u043C\u044F'}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                  color: 'var(--tg-theme-text-color, #fff)',
                  border: '1px solid var(--tg-theme-hint-color, #555)',
                }}
              />
              <input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder={'\u0422\u0435\u043B\u0435\u0444\u043E\u043D'}
                type="tel"
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                  color: 'var(--tg-theme-text-color, #fff)',
                  border: '1px solid var(--tg-theme-hint-color, #555)',
                }}
              />
              <input
                value={contactRelation}
                onChange={(e) => setContactRelation(e.target.value)}
                placeholder={'\u0421\u0432\u044F\u0437\u044C (\u0436\u0435\u043D\u0430, \u043C\u0430\u0442\u044C, \u0434\u0440\u0443\u0433)'}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                  color: 'var(--tg-theme-text-color, #fff)',
                  border: '1px solid var(--tg-theme-hint-color, #555)',
                }}
              />
              <button
                onClick={addContact}
                className="w-full py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                  color: 'var(--tg-theme-link-color, #007aff)',
                }}
              >
                {'\u2795 \u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0430\u043A\u0442'}
              </button>
            </div>
          </div>
        </Section>

        {/* Особые заметки */}
        <Section header={'\uD83D\uDCDD \u041E\u0441\u043E\u0431\u044B\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438'}>
          <div className="px-4 py-2">
            <textarea
              value={draft.specialNotes ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, specialNotes: e.target.value || null }))}
              placeholder={'\u041A\u0430\u0440\u0434\u0438\u043E\u0441\u0442\u0438\u043C\u0443\u043B\u044F\u0442\u043E\u0440, \u0441\u0442\u0435\u043D\u0442, \u043F\u0440\u043E\u0442\u0435\u0437...'}
              rows={2}
              className="w-full px-3 py-2 rounded-lg text-sm resize-none"
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                color: 'var(--tg-theme-text-color, #fff)',
                border: '1px solid var(--tg-theme-hint-color, #555)',
              }}
            />
          </div>
        </Section>

        {/* Кнопки действий */}
        <div className="px-4 pt-3 space-y-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 rounded-xl text-sm font-bold"
            style={{
              backgroundColor: 'var(--tg-theme-button-color, #3390ec)',
              color: 'var(--tg-theme-button-text-color, #fff)',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? '\u0421\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u0438\u0435...' : '\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C'}
          </button>
          {!isNew && (
            <button
              onClick={cancelEdit}
              className="w-full py-2.5 rounded-xl text-sm"
              style={{
                backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
                color: 'var(--tg-theme-hint-color, #8e8e93)',
              }}
            >
              {'\u041E\u0442\u043C\u0435\u043D\u0430'}
            </button>
          )}
        </div>
      </div>
    );
  }

  // ===== РЕЖИМ ПРОСМОТРА =====
  const hasData = info.bloodType || info.allergies.length > 0 || info.chronicDiseases.length > 0 ||
    info.medications.length > 0 || info.emergencyContacts.length > 0;

  if (!hasData) {
    return (
      <TgEmptyState
        icon="🚑"
        title="Экстренная карта"
        description="Заполните медицинские данные для экстренных случаев"
        actionLabel="Заполнить"
        onAction={startEdit}
      />
    );
  }

  const age = calculateAge(profile?.birth_date ?? null);
  const sex = profile?.sex === 'male' ? '\u043C\u0443\u0436' : profile?.sex === 'female' ? '\u0436\u0435\u043D' : null;

  return (
    <div className="pb-4">
      {/* Шапка */}
      <div
        className="px-4 py-4 mb-2 text-center"
        style={{ backgroundColor: 'var(--plm-destructive-bg)' }}
      >
        <div className="text-3xl mb-2">{'\uD83C\uDD98'}</div>
        <div
          className="font-bold text-lg"
          style={{ color: 'var(--tg-theme-text-color)' }}
        >
          {profile?.full_name ?? '\u041F\u0430\u0446\u0438\u0435\u043D\u0442'}
        </div>
        {(age || sex) && (
          <div
            className="text-sm mt-0.5"
            style={{ color: 'var(--tg-theme-hint-color)' }}
          >
            {[sex, age].filter(Boolean).join(', ')}
          </div>
        )}
      </div>

      {/* Группа крови */}
      {info.bloodType && (
        <Section header={'\uD83E\uDE78 \u0413\u0440\u0443\u043F\u043F\u0430 \u043A\u0440\u043E\u0432\u0438'}>
          <div className="px-4 py-3 text-center">
            <span
              className="text-2xl font-bold"
              style={{ color: '#F44336' }}
            >
              {info.bloodType}
            </span>
          </div>
        </Section>
      )}

      {/* Аллергии */}
      {info.allergies.length > 0 && (
        <Section header={'\u26A0\uFE0F \u0410\u043B\u043B\u0435\u0440\u0433\u0438\u0438'}>
          <div className="px-4 py-2 flex flex-wrap gap-1.5">
            {info.allergies.map((a, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'var(--plm-destructive-bg)', color: 'var(--plm-text-destructive)' }}
              >
                {a}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Хронические заболевания */}
      {info.chronicDiseases.length > 0 && (
        <Section header={'\uD83C\uDFE5 \u0425\u0440\u043E\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0437\u0430\u0431\u043E\u043B\u0435\u0432\u0430\u043D\u0438\u044F'}>
          <div className="px-4 py-2 flex flex-wrap gap-1.5">
            {info.chronicDiseases.map((d, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'var(--plm-warning-bg)', color: 'var(--plm-health-warning)' }}
              >
                {d}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Лекарства */}
      {info.medications.length > 0 && (
        <Section header={'\uD83D\uDC8A \u0422\u0435\u043A\u0443\u0449\u0438\u0435 \u043B\u0435\u043A\u0430\u0440\u0441\u0442\u0432\u0430'}>
          <div className="px-4 py-2 flex flex-wrap gap-1.5">
            {info.medications.map((m, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: 'var(--plm-link-bg)', color: 'var(--plm-text-link)' }}
              >
                {m}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* Экстренные контакты */}
      {info.emergencyContacts.length > 0 && (
        <Section header={'\uD83D\uDCDE \u042D\u043A\u0441\u0442\u0440\u0435\u043D\u043D\u044B\u0435 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B'}>
          <div className="px-4 py-2 space-y-2">
            {info.emergencyContacts.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between py-1.5"
              >
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--tg-theme-text-color)' }}
                  >
                    {c.name} {c.relation && `(${c.relation})`}
                  </div>
                </div>
                <a
                  href={`tel:${c.phone}`}
                  className="text-sm font-medium px-3 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: 'var(--plm-health-good-bg)',
                    color: 'var(--plm-health-good)',
                  }}
                >
                  {c.phone}
                </a>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Особые заметки */}
      {info.specialNotes && (
        <Section header={'\uD83D\uDCDD \u041E\u0441\u043E\u0431\u044B\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438'}>
          <div
            className="px-4 py-2 text-sm"
            style={{ color: 'var(--tg-theme-text-color)' }}
          >
            {info.specialNotes}
          </div>
        </Section>
      )}

      {/* Последнее обновление + кнопка */}
      <div className="px-4 pt-3 space-y-2">
        {info.updatedAt && (
          <div
            className="text-xs text-center"
            style={{ color: 'var(--tg-theme-hint-color)' }}
          >
            {'\u041E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u043E: '}{new Date(info.updatedAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        )}
        <button
          onClick={startEdit}
          className="w-full py-2.5 rounded-xl text-sm font-medium"
          style={{
            backgroundColor: 'var(--tg-theme-secondary-bg-color, #2c2c2e)',
            color: 'var(--tg-theme-link-color, #007aff)',
          }}
        >
          {'\u270F\uFE0F \u0420\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C'}
        </button>
      </div>
    </div>
  );
}
