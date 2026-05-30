import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import LanguagePicker from './LanguagePicker';
import LanguagePromptEditor from './LanguagePromptEditor';
import ModeSelector from './ModeSelector';
import PhraseBubble from './PhraseBubble';
import AddLanguageModal from './AddLanguageModal';
import {
  languagesFromPhrases,
  mergeLanguages,
  type Language,
} from '../../domain/languages';
import { savePhrase, type Phrase } from '../../api/client';
import { callTts, TtsError } from '../../api/tts';
import { playPhrase, type Mode, type PlayController } from '../../playback/player';

const FALLBACK_CODE = 'en-US';

interface Props {
  phrases: Phrase[];
  onSaved: (phrase: Phrase) => void;
}

export default function Composer({ phrases, onSaved }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [text, setText] = useState('');
  const [sessionAdded, setSessionAdded] = useState<Language[]>([]);
  const [lang, setLang] = useState<Language | null>(null);
  const [transcription, setTranscription] = useState('');
  const [translation, setTranslation] = useState('');
  const [mode, setMode] = useState<Mode>('triple');
  const [status, setStatus] = useState<{ kind: 'error' | 'retry'; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [stageLabel, setStageLabel] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [promptOpen, setPromptOpen] = useState(false);
  const [hasDraftChanges, setHasDraftChanges] = useState(false);
  const [savedStamp, setSavedStamp] = useState(false);
  const playRef = useRef<PlayController | null>(null);
  const stampTimerRef = useRef<number | null>(null);

  const languages = useMemo(
    () => mergeLanguages(languagesFromPhrases(phrases), sessionAdded),
    [phrases, sessionAdded],
  );

  useEffect(() => () => {
    playRef.current?.stop();
    if (stampTimerRef.current) clearTimeout(stampTimerRef.current);
  }, []);

  useEffect(() => {
    if (!lang && languages.length > 0) setLang(languages[0]);
  }, [languages, lang]);

  useEffect(() => {
    setHasDraftChanges(false);
  }, [lang?.name]);

  const busy = saving || playing;

  function stopPlayback() {
    playRef.current?.stop();
    playRef.current = null;
    setPlaying(false);
    setStageLabel('');
  }

  function handlePlay() {
    if (playing) { stopPlayback(); return; }
    const trimmed = text.trim();
    if (!trimmed || !lang) return;
    setStatus(null);
    setPlaying(true);
    const ctl = playPhrase({
      text: trimmed, lang: lang.code, langName: lang.name, mode,
      onStage: ({ index, total }) => {
        if (mode === 'triple') setStageLabel(`${index}/${total}`);
        else setStageLabel('');
      },
    });
    playRef.current = ctl;
    ctl.done
      .catch(e => setStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) }))
      .finally(() => {
        if (playRef.current === ctl) {
          playRef.current = null;
          setPlaying(false);
          setStageLabel('');
        }
      });
  }

  async function performSave(ttsCode: string) {
    const trimmed = text.trim();
    if (!trimmed || !lang) return;
    setSaving(true);
    try {
      const audioBase64 = await callTts(trimmed, ttsCode, 'slow', lang?.name ?? '');
      const phrase = await savePhrase({
        text: trimmed,
        languageCode: lang.code,
        languageName: lang.name,
        nonLatin: lang.nonLatin,
        audioBase64,
        transcription: transcription.trim() || undefined,
        translation: translation.trim() || undefined,
      });
      if (stampTimerRef.current) clearTimeout(stampTimerRef.current);
      setSavedStamp(true);
      stampTimerRef.current = window.setTimeout(() => {
        setSavedStamp(false);
        setText('');
        setTranscription('');
        setTranslation('');
        stampTimerRef.current = null;
      }, 1500);
      onSaved(phrase);
    } catch (e) {
      if (e instanceof TtsError && e.unsupportedLanguage && ttsCode !== FALLBACK_CODE) {
        setStatus({
          kind: 'retry',
          msg: `${e.message} You can retry using ${FALLBACK_CODE} and the TTS will still attempt the phrase.`,
        });
      } else {
        setStatus({ kind: 'error', msg: e instanceof Error ? e.message : String(e) });
      }
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!lang) return;
    setStatus(null);
    performSave(lang.code);
  }

  function handleRetryFallback() {
    setStatus(null);
    performSave(FALLBACK_CODE);
  }

  function handleAddLanguage(newLang: Language) {
    setSessionAdded(prev => [...prev, newLang]);
    setLang(newLang);
    setShowAddModal(false);
  }

  const compositionWrap = isComic ? Paper : Box;
  const wrapSx = isComic ? { padding: '20px', mb: '32px' } : { mb: '52px' };

  return (
    <Box component={compositionWrap} sx={wrapSx}>
      <Typography variant="h2" sx={{ mb: isComic ? '12px' : '16px' }}>
        {isComic ? 'Pick a language' : 'Language'}
      </Typography>

      <LanguagePicker
        languages={languages}
        value={lang}
        onChange={setLang}
        onAddClick={() => setShowAddModal(true)}
        disabled={busy}
      />

      {lang && (
        <LanguagePromptEditor
          open={promptOpen}
          onToggle={() => setPromptOpen(o => !o)}
          languageName={lang.name}
          languageCode={lang.code}
          testText={text}
          disabled={busy}
          onDirtyChange={setHasDraftChanges}
        />
      )}

      <PhraseBubble
        text={text} onTextChange={setText}
        transcription={transcription} onTranscriptionChange={setTranscription}
        translation={translation} onTranslationChange={setTranslation}
        showRomanization={lang?.nonLatin ?? false}
        disabled={busy}
        stamped={savedStamp}
      />

      <Box sx={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: isComic ? '14px' : '16px',
        mt: isComic ? 0 : '26px',
        flexDirection: { xs: 'column', sm: 'row' },
        '& > *': { width: { xs: '100%', sm: 'auto' } },
      }}>
        <ModeSelector value={mode} onChange={setMode} disabled={playing} />
        <Box sx={{
          display: 'flex', gap: isComic ? '10px' : '12px',
          alignItems: 'center',
          width: { xs: '100%', sm: 'auto' },
          '& > .MuiButton-root': { flex: { xs: 1, sm: 'unset' }, justifyContent: 'center' },
        }}>
          <Button
            onClick={handleSave}
            disabled={busy || !text.trim() || !lang}
          >
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handlePlay}
            disabled={saving || (!playing && (!text.trim() || !lang))}
            startIcon={playing ? <StopIcon /> : <PlayArrowIcon />}
            sx={isComic && playing ? {
              backgroundColor: t.accents.pen, color: t.palette.text.primary,
              '&:hover': { backgroundColor: t.accents.pen },
            } : undefined}
          >
            {playing ? 'Stop' : 'Hear it'}
            {hasDraftChanges && !playing && (
              <Box component="span" title="Unsaved prompt changes" sx={{
                ml: 0.75, width: 6, height: 6, borderRadius: '50%',
                backgroundColor: t.palette.warning.main,
                display: 'inline-block', verticalAlign: 'middle', flexShrink: 0,
              }} />
            )}
            {stageLabel && (
              <Box component="span" sx={{
                ml: 1, fontSize: isComic ? 10 : 12,
                fontWeight: isComic ? 700 : 400,
                fontStyle: isComic ? 'normal' : 'italic',
                textTransform: 'none', letterSpacing: 0, opacity: 0.85,
              }}>
                {stageLabel}
              </Box>
            )}
          </Button>
        </Box>
      </Box>

      {status && (
        <Box sx={{ mt: '12px' }}>
          <Typography sx={{
            fontSize: 12,
            fontWeight: isComic ? 700 : 400,
            fontStyle: isComic ? 'normal' : 'italic',
            color: t.accents.pop,
          }}>
            {status.msg}
          </Typography>
          {status.kind === 'retry' && (
            <Button
              size="small"
              variant="outlined"
              onClick={handleRetryFallback}
              disabled={saving}
              sx={{ mt: '8px' }}
            >
              Retry as {FALLBACK_CODE}
            </Button>
          )}
        </Box>
      )}

      {showAddModal && (
        <AddLanguageModal
          existing={languages}
          onClose={() => setShowAddModal(false)}
          onAdd={handleAddLanguage}
        />
      )}

    </Box>
  );
}
