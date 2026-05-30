import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { deletePhrase, type Phrase } from '../../api/client';

interface Props {
  phrase: Phrase;
  onClose: () => void;
  onDeleted: (phraseId: string) => void;
}

export default function ConfirmDeleteModal({ phrase, onClose, onDeleted }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setDeleting(true);
    setError(null);
    try {
      await deletePhrase(phrase.phraseId);
      onDeleted(phrase.phraseId);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDeleting(false);
    }
  }

  return (
    <Dialog open onClose={deleting ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{isComic ? 'Delete this?' : 'Delete phrase'}</DialogTitle>
      <DialogContent>
        <Typography sx={{
          mb: 2, color: t.palette.text.secondary,
          fontStyle: isComic ? 'normal' : 'italic', fontSize: 13,
        }}>
          This will remove the phrase and its saved audio. This can't be undone.
        </Typography>
        <Box sx={{
          padding: isComic ? '12px 14px' : 0,
          paddingTop: isComic ? '12px' : '14px',
          paddingBottom: isComic ? '12px' : '14px',
          backgroundColor: isComic ? t.palette.background.default : 'transparent',
          border: isComic ? `2.5px solid ${t.palette.text.primary}` : undefined,
          borderTop: isComic ? `2.5px solid ${t.palette.text.primary}` : '1px solid #d2d2d2',
          borderBottom: isComic ? `2.5px solid ${t.palette.text.primary}` : '1px solid #d2d2d2',
          borderRadius: isComic ? 2 : 0,
        }}>
          <Typography sx={{
            fontSize: 9, textTransform: 'uppercase',
            letterSpacing: isComic ? '0.10em' : '0.16em',
            color: t.palette.text.disabled,
            fontWeight: isComic ? 800 : 400,
            mb: '4px',
          }}>{phrase.languageName}</Typography>
          <Typography sx={isComic
            ? { fontSize: 18, fontWeight: 800, lineHeight: 1.25, color: t.palette.text.primary }
            : { fontSize: 20, lineHeight: 1.3, color: t.palette.text.primary }
          }>{phrase.text}</Typography>
        </Box>

        {error && (
          <Typography sx={{
            mt: 2, fontSize: 12, color: t.accents.pop,
            fontWeight: isComic ? 700 : 400,
            fontStyle: isComic ? 'normal' : 'italic',
          }}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 0, gap: 1, flexWrap: 'wrap' }}>
        <Button onClick={onClose} disabled={deleting}>Cancel</Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleConfirm}
          disabled={deleting}
          sx={isComic ? undefined : { backgroundColor: t.accents.pop ?? undefined }}
        >
          {deleting ? 'Deleting…' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
