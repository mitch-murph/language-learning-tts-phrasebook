import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import { useTheme } from '@mui/material/styles';
import {
  getEffectivePrompts,
  hasUserOverride,
  setUserLangPrompts,
  clearUserLangPrompts,
} from '../../api/settings';
import { callTts, TtsError, type Pace } from '../../api/tts';

interface Props {
  open: boolean;
  onToggle: () => void;
  languageName: string;
  languageCode: string;
  testText: string;
  disabled?: boolean;
}

export default function LanguagePromptEditor({
  open, onToggle, languageName, languageCode, testText, disabled,
}: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  const [normal, setNormal] = useState(() => getEffectivePrompts(languageName).normal);
  const [slow, setSlow] = useState(() => getEffectivePrompts(languageName).slow);
  const [isOverride, setIsOverride] = useState(() => hasUserOverride(languageName));
  const [playingPace, setPlayingPace] = useState<Pace | null>(null);
  const [playError, setPlayError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const eff = getEffectivePrompts(languageName);
    setNormal(eff.normal);
    setSlow(eff.slow);
    setIsOverride(hasUserOverride(languageName));
  }, [languageName]);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  function getSaved() { return getEffectivePrompts(languageName); }

  function handleNormalChange(v: string) { setNormal(v); }
  function handleSlowChange(v: string) { setSlow(v); }

  function handleSave() {
    setUserLangPrompts(languageName, { normal: normal.trim(), slow: slow.trim() });
    setIsOverride(true);
  }

  function handleDiscard() {
    const saved = getSaved();
    setNormal(saved.normal);
    setSlow(saved.slow);
  }

  function handleReset() {
    clearUserLangPrompts(languageName);
    setIsOverride(false);
    const defaults = getEffectivePrompts(languageName);
    setNormal(defaults.normal);
    setSlow(defaults.slow);
  }

  function handleStop() {
    audioRef.current?.pause();
    setPlayingPace(null);
  }

  async function handleHear(pace: Pace) {
    const trimmed = testText.trim();
    if (!trimmed || playingPace) return;
    audioRef.current?.pause();
    setPlayError(null);
    setPlayingPace(pace);
    const draftPrompt = pace === 'slow' ? slow : normal;
    try {
      const base64 = await callTts(trimmed, languageCode, pace, '', draftPrompt);
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const url = URL.createObjectURL(new Blob([bytes], { type: 'audio/mpeg' }));
      const audio = new Audio(url);
      audioRef.current = audio;
      const cleanup = () => { setPlayingPace(null); URL.revokeObjectURL(url); };
      audio.addEventListener('ended', cleanup, { once: true });
      audio.addEventListener('error', cleanup, { once: true });
      audio.play();
    } catch (e) {
      setPlayError(e instanceof TtsError ? e.message : String(e));
      setPlayingPace(null);
    }
  }

  const saved = getSaved();
  const isDirty = normal !== saved.normal || slow !== saved.slow;
  const canHear = !!testText.trim();

  return (
    <>
      <Box sx={{ mt: isComic ? '-10px' : '-18px', mb: isComic ? '14px' : '20px' }}>
        <Button
          size="small"
          onClick={onToggle}
          disabled={disabled}
          sx={{
            fontSize: 11, textTransform: 'none', opacity: open ? 0.8 : 0.55,
            fontStyle: isComic ? 'normal' : 'italic',
            p: isComic ? '2px 6px' : '2px 0',
            minWidth: 0,
            '&:hover': { opacity: 0.9 },
          }}
        >
          Edit prompts for {languageName} {open ? '▲' : '▼'}
        </Button>
      </Box>

      <Collapse in={open} unmountOnExit>
        <Box sx={{
          mb: isComic ? '20px' : '28px',
          p: isComic ? '14px 16px' : '12px 0 16px',
          border: isComic ? `2px solid ${t.palette.divider}` : 'none',
          borderRadius: isComic ? 2 : 0,
          borderTop: isComic ? undefined : `1px solid ${t.palette.divider}`,
        }}>
          <Stack spacing={2}>
            <PromptField
              label="Normal"
              value={normal}
              onChange={handleNormalChange}
              onHear={() => handleHear('normal')}
              onStop={handleStop}
              playing={playingPace === 'normal'}
              canHear={canHear && !playingPace}
            />
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <PromptField
                label="Slow"
                value={slow}
                onChange={handleSlowChange}
                onHear={() => handleHear('slow')}
                onStop={handleStop}
                playing={playingPace === 'slow'}
                canHear={canHear && !playingPace}
              />
              <Typography sx={{ fontSize: 11, opacity: 0.5, fontStyle: 'italic' }}>
                These prompts are instructions sent to the TTS model on how to speak. Type a phrase above to test.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
              {isOverride && (
                <Button size="small" onClick={handleReset}>Reset to default</Button>
              )}
              {isDirty && (
                <Button size="small" onClick={handleDiscard}>Discard</Button>
              )}
              <Button
                size="small"
                variant="contained"
                onClick={handleSave}
                disabled={!isDirty}
                sx={{ ml: 'auto' }}
              >
                Save
              </Button>
            </Box>
            {playError && (
              <Typography sx={{ fontSize: 11, color: t.accents.pop }}>{playError}</Typography>
            )}
          </Stack>
        </Box>
      </Collapse>
    </>
  );
}

function PromptField({ label, value, onChange, onHear, onStop, playing, canHear }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onHear: () => void;
  onStop: () => void;
  playing: boolean;
  canHear: boolean;
}) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      <TextField
        label={label}
        value={value}
        onChange={e => onChange(e.target.value)}
        multiline
        minRows={2}
        fullWidth
        size="small"
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <Button
        size="small"
        variant="outlined"
        onClick={playing ? onStop : onHear}
        disabled={!playing && !canHear}
        title={playing ? 'Stop' : 'Test this draft prompt'}
        sx={{ mt: '4px', minWidth: 52, px: 1, flexShrink: 0 }}
      >
        {playing ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
      </Button>
    </Box>
  );
}
