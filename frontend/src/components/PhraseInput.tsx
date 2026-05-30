import { useState } from 'react';
import { callTts, savePhrase } from '../api';

const LANGUAGES = [
  { code: 'en-AU', label: 'English (AU)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'ja-JP', label: 'Japanese' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
  { code: 'zh-TW', label: 'Chinese (Traditional)' },
  { code: 'ko-KR', label: 'Korean' },
  { code: 'fr-FR', label: 'French' },
  { code: 'de-DE', label: 'German' },
  { code: 'es-ES', label: 'Spanish' },
  { code: 'pt-BR', label: 'Portuguese (BR)' },
  { code: 'it-IT', label: 'Italian' },
  { code: 'ru-RU', label: 'Russian' },
  { code: 'ar-SA', label: 'Arabic' },
  { code: 'hi-IN', label: 'Hindi' },
  { code: 'th-TH', label: 'Thai' },
  { code: 'vi-VN', label: 'Vietnamese' },
  { code: 'id-ID', label: 'Indonesian' },
];

function playBase64(base64: string) {
  const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
  const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
  const audio = new Audio(url);
  audio.play().finally(() => URL.revokeObjectURL(url));
}

interface Props {
  onSaved: () => void;
}

export default function PhraseInput({ onSaved }: Props) {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('en-AU');
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [status, setStatus] = useState<{ type: 'error' | 'success'; msg: string } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handlePlay() {
    if (!text.trim()) return;
    setPlaying(true);
    setStatus(null);
    try {
      const audioBase64 = await callTts(text.trim(), lang);
      playBase64(audioBase64);
    } catch (e) {
      setStatus({ type: 'error', msg: String(e instanceof Error ? e.message : e) });
    } finally {
      setPlaying(false);
    }
  }

  async function handleSave() {
    if (!text.trim()) return;
    setSaving(true);
    setStatus(null);
    try {
      const audioBase64 = await callTts(text.trim(), lang);
      await savePhrase(
        text.trim(),
        lang,
        audioBase64,
        transcription.trim() || undefined,
        translation.trim() || undefined
      );
      setStatus({ type: 'success', msg: 'Saved!' });
      setText('');
      setTranscription('');
      setTranslation('');
      onSaved();
    } catch (e) {
      setStatus({ type: 'error', msg: String(e instanceof Error ? e.message : e) });
    } finally {
      setSaving(false);
    }
  }

  const busy = playing || saving;

  return (
    <div className="card">
      <div className="field">
        <label>Phrase</label>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Type a phrase to hear it spoken…"
          rows={2}
          disabled={busy}
        />
      </div>

      <div className="field">
        <label>Language</label>
        <select value={lang} onChange={e => setLang(e.target.value)} disabled={busy}>
          {LANGUAGES.map(l => (
            <option key={l.code} value={l.code}>{l.label}</option>
          ))}
        </select>
      </div>

      <div className="row">
        <div className="field">
          <label>Romanisation (optional)</label>
          <input
            value={transcription}
            onChange={e => setTranscription(e.target.value)}
            placeholder="e.g. Ohayou gozaimasu"
            disabled={busy}
          />
        </div>
        <div className="field">
          <label>Translation (optional)</label>
          <input
            value={translation}
            onChange={e => setTranslation(e.target.value)}
            placeholder="e.g. Good morning"
            disabled={busy}
          />
        </div>
      </div>

      <div className="actions">
        <button className="btn btn-secondary" onClick={handlePlay} disabled={busy || !text.trim()}>
          {playing ? <><span className="spinner" /> Playing…</> : '▶ Play'}
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={busy || !text.trim()}>
          {saving ? <><span className="spinner" /> Saving…</> : '+ Save to library'}
        </button>
      </div>

      {status && <p className={status.type}>{status.msg}</p>}
    </div>
  );
}
