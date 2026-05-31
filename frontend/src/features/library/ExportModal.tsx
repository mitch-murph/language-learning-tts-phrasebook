import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { Phrase } from '../../api/client';
import type { Mode } from '../../playback/player';
import ModeSelector from '../compose/ModeSelector';
import { downloadZip, downloadCombined } from './exportUtils';

const PHRASE_GAP_SEC = 3;

const MODE_DESCRIPTION: Record<Mode, string> = {
  normal: 'One file per phrase at normal speed.',
  slow:   'One file per phrase at slow "teacher" speed.',
  drill:  'Normal → slow → normal per phrase, with 2 s between each step.',
};

type Stage = 'fetch' | 'encode';

interface Progress { done: number; total: number; stage: Stage; }

interface Props {
  phrases: Phrase[];
  onClose: () => void;
}

export default function ExportModal({ phrases, onClose }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [mode, setMode] = useState<Mode>('normal');
  const [progress, setProgress] = useState<Progress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = progress !== null;

  function onProg(done: number, total: number, stage: Stage) {
    setProgress({ done, total, stage });
  }

  async function run(fn: () => Promise<void>) {
    setError(null);
    setProgress({ done: 0, total: phrases.length, stage: 'fetch' });
    try {
      await fn();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setProgress(null);
    }
  }

  const progressLabel = progress
    ? progress.stage === 'encode'
      ? 'Encoding MP3…'
      : `Fetching audio… ${progress.done} / ${progress.total}`
    : '';

  const progressValue = progress
    ? progress.stage === 'encode'
      ? 100
      : (progress.done / progress.total) * 100
    : 0;

  return (
    <Dialog open={true} onClose={busy ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>
        Export {phrases.length} phrase{phrases.length !== 1 ? 's' : ''}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mb: 1.5 }}>
          <ModeSelector value={mode} onChange={setMode} disabled={busy} />
        </Box>

        <Typography sx={{
          fontSize: 12, mb: 3,
          color: 'text.secondary',
          fontStyle: isComic ? 'normal' : 'italic',
        }}>
          {MODE_DESCRIPTION[mode]}
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            disabled={busy}
            onClick={() => run(() => downloadZip(phrases, mode, (d, tot) => onProg(d, tot, 'fetch')))}
          >
            Download ZIP (individual MP3s)
          </Button>
          <Button
            variant="outlined"
            fullWidth
            disabled={busy}
            onClick={() => run(() => downloadCombined(phrases, mode, PHRASE_GAP_SEC, onProg))}
          >
            Download combined audio (.mp3)
          </Button>
        </Box>

        {busy && progress && (
          <Box sx={{ mt: 2.5 }}>
            <LinearProgress variant="determinate" value={progressValue} />
            <Box sx={{ fontSize: 11, color: 'text.disabled', mt: 0.75, textAlign: 'center' }}>
              {progressLabel}
            </Box>
          </Box>
        )}

        {error && (
          <Typography sx={{
            mt: 2, fontSize: 12, color: t.accents.pop,
            fontWeight: isComic ? 700 : 400,
            fontStyle: isComic ? 'normal' : 'italic',
          }}>
            {error}
          </Typography>
        )}
      </DialogContent>
    </Dialog>
  );
}
