import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Link from '@mui/material/Link';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import TtsUrlField from './TtsUrlField';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const STEPS = [
  <>Open the link above and scroll to the <strong>Put Text-to-Speech into action</strong> demo.</>,
  <>Open your browser's network tab (<strong>F12 → Network</strong>). Note: Google sometimes blocks dev tools in Chrome on their site. If this happens, try Firefox instead.</>,
  <>Press <strong>Speak it</strong>.</>,
  <>Find a request with <code style={{ fontSize: '0.85em' }}>/proxy?url=</code> in its name. Click it to open the request details.</>,
  <>In the <strong>Headers</strong> tab, copy the full <strong>Request URL</strong>. It starts with <code style={{ fontSize: '0.85em' }}>https://cxl-services.appspot.com/proxy?url=…&token=…</code></>,
  <>Paste it in the field below.</>,
];

type TestStatus = { ok: true } | { ok: false; msg: string } | null;

export default function TtsSetupModal({ open, onClose, onSaved }: Props) {
  const t = useTheme();
  const isInk = t.appName === 'ink';
  const [ttsUrl, setTtsUrl] = useState(() => localStorage.getItem('ttsUrl') ?? '');
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>(null);

  function handleUrlChange(value: string) {
    setTtsUrl(value);
    setTestStatus(null);
  }

  async function handleTest() {
    const url = ttsUrl.trim();
    if (!url) return;
    setTesting(true);
    setTestStatus(null);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({
          input: { text: 'Token accepted. Welcome.', prompt: 'Speak like a calm language tutor. Read the phrase slowly and clearly.' },
          voice: { languageCode: 'en-AU', name: 'Charon', modelName: 'gemini-3.1-flash-tts-preview' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1 },
        }),
      });
      if (!res.ok) {
        setTestStatus({ ok: false, msg: `${res.status}: ${await res.text()}` });
        return;
      }
      const { audioContent } = await res.json();
      new Audio(`data:audio/mp3;base64,${audioContent}`).play();
      setTestStatus({ ok: true });
    } catch (e) {
      setTestStatus({ ok: false, msg: e instanceof Error ? e.message : String(e) });
    } finally {
      setTesting(false);
    }
  }

  function handleSave() {
    localStorage.setItem('ttsUrl', ttsUrl.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSaved?.();
      onClose();
    }, 800);
  }

  const canSubmit = !!ttsUrl.trim() && !saved && testStatus?.ok === true;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>TTS Setup Required</DialogTitle>
      <DialogContent>
        <Stack spacing={2}>
          <Typography sx={{ fontStyle: isInk ? 'italic' : 'normal' }}>
            This app uses Google Cloud Text-to-Speech. To keep costs minimal, it doesn't include
            an API key. Grab a free short-lived token from Google's demo page and paste it below.
          </Typography>

          <Link
            href="https://cloud.google.com/text-to-speech"
            target="_blank"
            rel="noopener noreferrer"
            underline="always"
          >
            cloud.google.com/text-to-speech
          </Link>

          <List dense disablePadding>
            {STEPS.map((step, i) => (
              <ListItem key={i} disableGutters sx={{ alignItems: 'flex-start', py: 0.25 }}>
                <ListItemText
                  primary={
                    <Typography component="span" sx={{ fontSize: 14 }}>
                      <strong>{i + 1}.</strong>&nbsp;{step}
                    </Typography>
                  }
                />
              </ListItem>
            ))}
          </List>

          <TtsUrlField value={ttsUrl} onChange={handleUrlChange} />

          {testStatus && (
            <Typography sx={{
              fontSize: 12,
              fontStyle: isInk ? 'italic' : 'normal',
              color: testStatus.ok ? '#1f8a36' : t.accents.pop,
            }}>
              {testStatus.ok ? 'Token works. You should hear audio.' : `Test failed: ${testStatus.msg}`}
            </Typography>
          )}

          {saved && (
            <Typography sx={{ fontSize: 12, color: '#1f8a36' }}>
              Saved! Retrying…
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="outlined"
          size="small"
          onClick={handleTest}
          disabled={!ttsUrl.trim() || testing}
        >
          {testing ? 'Testing…' : 'Test token'}
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!canSubmit}>
          Save &amp; continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
