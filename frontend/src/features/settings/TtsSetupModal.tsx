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
  <>Open your browser's network tab (<strong>F12 → Network</strong>). Note: Google sometimes blocks dev tools in Chrome on their site — if this happens, try Firefox instead.</>,
  <>Press <strong>Speak it</strong>.</>,
  <>Find a request with <code style={{ fontSize: '0.85em' }}>/proxy?url=</code> in its name. Click it to open the request details.</>,
  <>In the <strong>Headers</strong> tab, copy the full <strong>Request URL</strong>. It starts with <code style={{ fontSize: '0.85em' }}>https://cxl-services.appspot.com/proxy?url=…&token=…</code></>,
  <>Paste it in the field below.</>,
];

export default function TtsSetupModal({ open, onClose, onSaved }: Props) {
  const t = useTheme();
  const isInk = t.appName === 'ink';
  const [ttsUrl, setTtsUrl] = useState(() => localStorage.getItem('ttsUrl') ?? '');
  const [saved, setSaved] = useState(false);

  function handleSave() {
    localStorage.setItem('ttsUrl', ttsUrl.trim());
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onSaved?.();
      onClose();
    }, 800);
  }

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

          <TtsUrlField value={ttsUrl} onChange={setTtsUrl} />

          {saved && (
            <Typography sx={{ fontSize: 12, color: '#1f8a36' }}>
              Saved! Retrying…
            </Typography>
          )}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={!ttsUrl.trim() || saved}>
          Save &amp; continue
        </Button>
      </DialogActions>
    </Dialog>
  );
}
