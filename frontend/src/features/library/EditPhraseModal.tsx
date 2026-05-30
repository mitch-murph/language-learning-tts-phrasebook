import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { updatePhrase, type Phrase } from '../../api/client';

interface Props {
  phrase: Phrase;
  onClose: () => void;
  onSaved: (updated: Phrase) => void;
}

export default function EditPhraseModal({ phrase, onClose, onSaved }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [transcription, setTranscription] = useState(phrase.transcription ?? '');
  const [translation, setTranslation] = useState(phrase.translation ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const showRomanization = phrase.nonLatin;

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const updated = await updatePhrase(phrase.phraseId, {
        transcription: transcription.trim() || undefined,
        translation: translation.trim() || undefined,
      });
      onSaved(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <DialogTitle>Edit phrase</DialogTitle>
      <DialogContent>
        <Box sx={{
          mb: 3,
          padding: isComic ? '14px 16px' : 0,
          borderTop: isComic ? 'none' : '1px solid #d2d2d2',
          borderBottom: isComic ? 'none' : '1px solid #d2d2d2',
          paddingTop: isComic ? '14px' : '16px',
          paddingBottom: isComic ? '14px' : '16px',
          backgroundColor: isComic ? t.palette.background.default : 'transparent',
          border: isComic ? `2.5px solid ${t.palette.text.primary}` : undefined,
          borderRadius: isComic ? 2 : 0,
        }}>
          <Typography sx={{
            fontSize: 10, textTransform: 'uppercase',
            letterSpacing: isComic ? '0.10em' : '0.16em',
            color: t.palette.text.disabled,
            fontWeight: isComic ? 800 : 400,
            mb: '6px',
          }}>
            {phrase.languageName} · text & audio can't be changed
          </Typography>
          <Typography sx={isComic
            ? { fontSize: 22, fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.01em', color: t.palette.text.primary }
            : { fontSize: 24, lineHeight: 1.3, color: t.palette.text.primary }
          }>{phrase.text}</Typography>
        </Box>

        <Stack spacing={3}>
          {showRomanization && (
            <TextField
              label="Romanization"
              value={transcription}
              onChange={e => setTranscription(e.target.value)}
              placeholder="pinyin, romaji…"
              fullWidth
              disabled={saving}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          )}
          <TextField
            label="English meaning"
            value={translation}
            onChange={e => setTranslation(e.target.value)}
            placeholder="optional"
            fullWidth
            disabled={saving}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>

        {error && (
          <Typography sx={{
            mt: 2, fontSize: 12, color: t.accents.pop,
            fontWeight: isComic ? 700 : 400,
            fontStyle: isComic ? 'normal' : 'italic',
          }}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
