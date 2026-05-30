import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { normalizeLanguageName, type Language } from '../../domain/languages';

interface Props {
  existing: Language[];
  onClose: () => void;
  onAdd: (lang: Language) => void;
}

export default function AddLanguageModal({ existing, onClose, onAdd }: Props) {
  const t = useTheme();
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [nonLatin, setNonLatin] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    const cleanName = normalizeLanguageName(name);
    if (!cleanName) { setError('Name is required.'); return; }
    const dupe = existing.some(l => l.name.toLowerCase() === cleanName.toLowerCase());
    if (dupe) { setError(`"${cleanName}" is already in the list — pick it from the pills.`); return; }
    onAdd({
      name: cleanName,
      code: code.trim() || 'en-US',
      nonLatin,
    });
  }

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add a language</DialogTitle>
      <DialogContent>
        <Typography sx={{
          mb: 2, fontSize: 13,
          color: t.palette.text.secondary,
          fontStyle: t.appName === 'ink' ? 'italic' : 'normal',
        }}>
          It'll show up as a section in your library once you save a phrase.
        </Typography>

        <Stack spacing={3}>
          <TextField
            label="Name"
            value={name}
            onChange={e => { setName(e.target.value); setError(null); }}
            placeholder="Vietnamese"
            fullWidth
            autoFocus
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="BCP-47 code (optional)"
            value={code}
            onChange={e => { setCode(e.target.value); setError(null); }}
            placeholder="vi-VN"
            spellCheck={false}
            fullWidth
            helperText="Hint for the TTS voice. If blank or unsupported, en-US is used as a fallback."
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <FormControlLabel
            control={
              <Checkbox checked={nonLatin} onChange={e => setNonLatin(e.target.checked)} />
            }
            label="Non-Latin script — show romanization field"
          />
        </Stack>

        {error && (
          <Box sx={{
            mt: 2, fontSize: 12, color: t.accents.pop,
            fontWeight: t.appName === 'comic' ? 700 : 400,
            fontStyle: t.appName === 'comic' ? 'normal' : 'italic',
          }}>{error}</Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleAdd}>Add</Button>
      </DialogActions>
    </Dialog>
  );
}
