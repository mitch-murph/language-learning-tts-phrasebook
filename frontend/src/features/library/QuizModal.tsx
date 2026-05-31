import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import { getAudioUrl, type Phrase } from '../../api/client';
import { playPhraseFromUrls, type PlayController } from '../../playback/player';

type Phase = 'typing' | 'revealed' | 'done';

interface Props {
  phrases: Phrase[];
  onClose: () => void;
}

export default function QuizModal({ phrases, onClose }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [index, setIndex] = useState(0);
  const [input, setInput] = useState('');
  const [phase, setPhase] = useState<Phase>('typing');
  const inputRef = useRef<HTMLInputElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const playRef = useRef<PlayController | null>(null);

  const total = phrases.length;
  const phrase = phase !== 'done' ? phrases[index] : null;

  useEffect(() => () => { playRef.current?.stop(); }, []);

  useEffect(() => {
    if (phase === 'typing') {
      const id = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
    if (phase === 'revealed') {
      const id = setTimeout(() => nextRef.current?.focus(), 30);
      return () => clearTimeout(id);
    }
  }, [phase, index]);

  function reveal() {
    if (!phrase) return;
    setPhase('revealed');
    playRef.current?.stop();
    const ctl = playPhraseFromUrls({
      normalUrl: getAudioUrl(phrase.normalS3Key),
      slowUrl: getAudioUrl(phrase.slowS3Key),
      mode: 'drill',
    });
    playRef.current = ctl;
    ctl.done.finally(() => {
      if (playRef.current === ctl) playRef.current = null;
    });
  }

  function advance() {
    playRef.current?.stop();
    playRef.current = null;
    if (index + 1 >= total) {
      setPhase('done');
    } else {
      setIndex(i => i + 1);
      setInput('');
      setPhase('typing');
    }
  }

  const labelSx = {
    fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const,
    letterSpacing: '0.10em', color: 'text.disabled', mb: 0.5,
  };

  if (phase === 'done') {
    return (
      <Dialog open onClose={onClose} fullWidth maxWidth="xs">
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Box sx={{ fontSize: 13, color: 'text.disabled', mb: 1.5 }}>Quiz complete</Box>
          <Box sx={{
            fontSize: { xs: 22, sm: 26 },
            fontWeight: isComic ? 800 : 400,
            mb: 3,
          }}>
            {total} phrase{total !== 1 ? 's' : ''} reviewed
          </Box>
          <Button variant="contained" onClick={onClose} autoFocus>
            Done
          </Button>
        </Box>
      </Dialog>
    );
  }

  if (!phrase) return null;

  const prompt = phrase.translation || phrase.text;
  const promptLabel = phrase.translation ? 'Translate' : 'Read aloud';

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="xs">
      <Box sx={{ p: 3 }}>
        <Box sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          mb: 2.5,
        }}>
          <Box sx={{
            fontSize: 11,
            fontWeight: isComic ? 800 : 400,
            textTransform: isComic ? 'uppercase' : 'none',
            letterSpacing: isComic ? '0.08em' : 'normal',
            color: 'text.disabled',
          }}>
            {phrase.languageName}
          </Box>
          <Box sx={{ fontSize: 13, color: 'text.disabled' }}>
            {index + 1} / {total}
          </Box>
        </Box>

        <Box sx={{ mb: 3 }}>
          <Box sx={labelSx}>{promptLabel}</Box>
          <Box sx={{
            fontSize: { xs: 22, sm: 28 },
            fontWeight: isComic ? 800 : 400,
            lineHeight: 1.25,
          }}>
            {prompt}
          </Box>
        </Box>

        {phase === 'typing' && (
          <TextField
            inputRef={inputRef}
            fullWidth
            label="Your romanization"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                reveal();
              }
            }}
            autoComplete="off"
            helperText="Enter to reveal · Esc to exit"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        )}

        {phase === 'revealed' && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Box sx={labelSx}>Your answer</Box>
              <Box sx={{
                fontSize: 16,
                color: input ? 'text.primary' : 'text.disabled',
                fontStyle: input ? 'normal' : 'italic',
              }}>
                {input || 'skipped'}
              </Box>
            </Box>

            {(phrase.transcription || phrase.nonLatin) && (
              <Box>
                <Box sx={labelSx}>Romanization</Box>
                <Box sx={{ fontSize: 16, fontWeight: isComic ? 700 : 600 }}>
                  {phrase.transcription || '—'}
                </Box>
              </Box>
            )}

            <Box>
              <Box sx={labelSx}>Phrase</Box>
              <Box sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: isComic ? 800 : 400 }}>
                {phrase.text}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 0.5 }}>
              <Button
                ref={nextRef}
                variant="contained"
                onClick={advance}
              >
                {index + 1 >= total ? 'Finish' : 'Next'}
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    </Dialog>
  );
}
