import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const t = useTheme();
  const [ttsUrl, setTtsUrl] = useState(() => localStorage.getItem('ttsUrl') ?? '');
  const [saved, setSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  function handleSave() {
    localStorage.setItem('ttsUrl', ttsUrl.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function handleTestTts() {
    const url = ttsUrl.trim();
    if (!url) { setTestStatus('No TTS URL set.'); return; }
    setTestStatus('Testing…');
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: JSON.stringify({
          input: { text: 'hello', prompt: 'Speak like a calm language tutor. Read the phrase slowly and clearly.' },
          voice: { languageCode: 'en-AU', name: 'Charon', modelName: 'gemini-3.1-flash-tts-preview' },
          audioConfig: { audioEncoding: 'MP3', speakingRate: 1 },
        }),
      });
      if (!res.ok) {
        setTestStatus(`Failed: ${res.status} ${await res.text()}`);
        return;
      }
      const { audioContent } = await res.json();
      new Audio(`data:audio/mp3;base64,${audioContent}`).play();
      setTestStatus('Success — you should hear audio.');
    } catch (e) {
      setTestStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Settings</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 3, fontStyle: t.appName === 'ink' ? 'italic' : 'normal' }}>
          Stored locally in this browser only.
        </DialogContentText>

        <Stack spacing={3}>
          <TextField
            label="TTS Proxy URL (including ?token=…)"
            value={ttsUrl}
            onChange={e => setTtsUrl(e.target.value)}
            placeholder="https://cxl-services.appspot.com/proxy?url=…&token=…"
            spellCheck={false}
            fullWidth
            helperText="Paste the full proxy URL. The OAuth2 token is short-lived — update it here when it expires."
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        {testStatus && (
          <Typography sx={{
            mt: 2, fontSize: 12,
            fontStyle: t.appName === 'ink' ? 'italic' : 'normal',
            color: t.palette.text.secondary,
          }}>{testStatus}</Typography>
        )}
        {saved && (
          <Typography sx={{ mt: 2, fontSize: 12, color: '#1f8a36' }}>Saved!</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={handleTestTts}>Test TTS</Button>
        <Button onClick={onClose}>Close</Button>
        <Button variant="contained" color="primary" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
