import { useState } from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import {
  getEffectivePrompts,
  hasUserOverride,
  setUserLangPrompts,
  clearUserLangPrompts,
} from '../../api/settings';

interface Props {
  languageName: string;
  open: boolean;
  onClose: () => void;
}

export default function LanguagePromptModal({ languageName, open, onClose }: Props) {
  const effective = getEffectivePrompts(languageName);
  const [normal, setNormal] = useState(effective.normal);
  const [slow, setSlow] = useState(effective.slow);
  const [isOverride, setIsOverride] = useState(() => hasUserOverride(languageName));

  function handleSave() {
    setUserLangPrompts(languageName, { normal: normal.trim(), slow: slow.trim() });
    setIsOverride(true);
    onClose();
  }

  function handleReset() {
    clearUserLangPrompts(languageName);
    setIsOverride(false);
    const defaults = getEffectivePrompts(languageName);
    setNormal(defaults.normal);
    setSlow(defaults.slow);
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Prompts for {languageName}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <TextField
            label="Normal prompt"
            value={normal}
            onChange={e => setNormal(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            label="Slow prompt"
            value={slow}
            onChange={e => setSlow(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1, flexWrap: 'wrap' }}>
        {isOverride && (
          <Button onClick={handleReset}>Reset to default</Button>
        )}
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave}>Save</Button>
      </DialogActions>
    </Dialog>
  );
}
