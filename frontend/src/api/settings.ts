import defaultSettingsJson from '../defaultSettings.json';

export interface LanguagePromptConfig {
  slow: string;
  normal: string;
}

interface SettingsStore {
  languagePrompts?: Record<string, LanguagePromptConfig>;
}

const USER_KEY = 'userSettings';

const DEFAULTS = defaultSettingsJson as {
  languagePrompts: Record<string, LanguagePromptConfig>;
};

function read(): SettingsStore {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) return JSON.parse(raw) as SettingsStore;
  } catch {}
  return {};
}

function persist(s: SettingsStore) {
  localStorage.setItem(USER_KEY, JSON.stringify(s));
}

export function getPrompt(pace: 'slow' | 'normal', languageName: string): string {
  const user = read();
  return (
    user.languagePrompts?.[languageName]?.[pace] ??
    DEFAULTS.languagePrompts[languageName]?.[pace] ??
    DEFAULTS.languagePrompts['__default__'][pace]
  );
}

export function getEffectivePrompts(languageName: string): LanguagePromptConfig {
  return {
    slow: getPrompt('slow', languageName),
    normal: getPrompt('normal', languageName),
  };
}

export function hasUserOverride(languageName: string): boolean {
  return !!read().languagePrompts?.[languageName];
}

export function setUserLangPrompts(languageName: string, config: LanguagePromptConfig) {
  const s = read();
  persist({ ...s, languagePrompts: { ...s.languagePrompts, [languageName]: config } });
}

export function clearUserLangPrompts(languageName: string) {
  const s = read();
  if (!s.languagePrompts) return;
  const { [languageName]: _, ...rest } = s.languagePrompts;
  persist({ ...s, languagePrompts: rest });
}

export function exportSettings(): string {
  return localStorage.getItem(USER_KEY) ?? '{}';
}

export function importSettings(json: string) {
  const incoming = JSON.parse(json) as SettingsStore;
  const existing = read();
  persist({
    ...existing,
    languagePrompts: { ...existing.languagePrompts, ...incoming.languagePrompts },
  });
}
