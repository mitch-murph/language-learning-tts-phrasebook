export interface Language {
  code: string;
  name: string;
  nonLatin: boolean;
}

const PALETTE = [
  '#ffd23f', '#3a86ff', '#e8392b', '#ff6b35', '#06a77d',
  '#1d3557', '#457b9d', '#fcbf49', '#d62828', '#2a9d8f',
  '#8ac926', '#9b2226', '#005f73', '#ee9b00', '#f72585',
  '#9d4edd', '#e63946',
];

export function colorForName(name: string): string {
  const key = name.toLowerCase();
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  return PALETTE[Math.abs(h) % PALETTE.length];
}

export function normalizeLanguageName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : '')
    .join(' ');
}

interface PhraseLike { languageCode: string; languageName: string; nonLatin: boolean }

export function languagesFromPhrases(phrases: PhraseLike[]): Language[] {
  const seen = new Map<string, Language>();
  for (const p of phrases) {
    const key = p.languageName.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, { code: p.languageCode, name: p.languageName, nonLatin: p.nonLatin });
    }
  }
  return [...seen.values()];
}

export function mergeLanguages(...lists: Language[][]): Language[] {
  const seen = new Map<string, Language>();
  for (const list of lists) {
    for (const l of list) {
      const key = l.name.toLowerCase();
      if (!seen.has(key)) seen.set(key, l);
    }
  }
  return [...seen.values()];
}
