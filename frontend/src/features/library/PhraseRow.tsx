import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import type { Phrase } from '../../api/client';

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameYear = d.getFullYear() === now.getFullYear();
  const fmt: Intl.DateTimeFormatOptions = sameYear
    ? { weekday: 'short', day: 'numeric', month: 'short' }
    : { day: 'numeric', month: 'short', year: 'numeric' };
  return new Intl.DateTimeFormat(undefined, fmt).format(d);
}

interface Props {
  phrase: Phrase;
  isPlaying: boolean;
  stageLabel?: string;
  onPlay: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export default function PhraseRow({ phrase, isPlaying, stageLabel, onPlay, onEdit, onDelete }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  const containerSx = isComic
    ? {
        display: 'grid', gridTemplateColumns: '1fr auto',
        gap: '14px', alignItems: 'center',
        padding: '14px 16px', mt: '12px', boxShadow: `3px 3px 0 ${t.palette.text.primary}`,
        borderRadius: 1,
      }
    : {
        display: 'grid', gridTemplateColumns: '1fr auto',
        gap: '18px', alignItems: 'start',
        padding: '18px 0', borderBottom: '1px solid #e6e6e6',
      };

  const Container = isComic ? Paper : Box;

  return (
    <Container sx={containerSx}>
      <Box>
        <Box sx={isComic
          ? { fontSize: { xs: 17, sm: 19 }, fontWeight: 800, lineHeight: 1.25, letterSpacing: '-0.01em', color: t.palette.text.primary }
          : { fontSize: { xs: 21, sm: 24 }, fontWeight: 400, lineHeight: 1.3, color: t.palette.text.primary }
        }>{phrase.text}</Box>

        {phrase.transcription && (
          <Box sx={isComic
            ? { fontSize: 13, fontWeight: 600, color: t.palette.text.secondary, mt: '4px' }
            : { fontSize: 15, fontStyle: 'italic', color: t.palette.text.secondary, mt: '5px' }
          }>{phrase.transcription}</Box>
        )}

        {phrase.translation && (
          <Box sx={{
            mt: isComic ? '2px' : '4px',
            fontSize: isComic ? 13 : 14,
            color: t.palette.text.disabled,
          }}>{phrase.translation}</Box>
        )}

        <Box sx={{
          textTransform: 'uppercase', color: t.palette.text.disabled,
          ...(isComic
            ? { fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', mt: '7px' }
            : { fontSize: 10, letterSpacing: '0.10em', mt: '8px', color: '#c4c4c4' }),
        }}>{formatWhen(phrase.createdAt)}</Box>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
        <PlayCircle isPlaying={isPlaying} onClick={onPlay} />
        {isPlaying && stageLabel && (
          <Box sx={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.04em',
            color: 'text.disabled', lineHeight: 1,
          }}>{stageLabel}</Box>
        )}
        <Box sx={{ display: 'flex', gap: '6px', mt: '4px' }}>
          <RowActionButton onClick={onEdit}>Edit</RowActionButton>
          <RowActionButton onClick={onDelete} destructive>Delete</RowActionButton>
        </Box>
      </Box>
    </Container>
  );
}

function RowActionButton({ children, onClick, destructive }: {
  children: string; onClick: () => void; destructive?: boolean;
}) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        background: 'transparent', border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', color: t.palette.text.disabled,
        ...(isComic
          ? {
              fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.10em', padding: '2px 4px',
              '&:hover': { color: destructive ? t.accents.pop : t.palette.text.primary },
            }
          : {
              fontSize: 11, fontStyle: 'italic', padding: '2px 4px',
              '&:hover': { color: t.palette.text.primary },
            }),
      }}
    >
      {children}
    </Box>
  );
}

function PlayCircle({ isPlaying, onClick }: { isPlaying: boolean; onClick: () => void }) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      aria-label={isPlaying ? 'Stop' : 'Play'}
      sx={{
        borderRadius: '50%', cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'inherit',
        ...(isComic ? {
          width: 44, height: 44,
          border: `3px solid ${t.palette.text.primary}`,
          backgroundColor: isPlaying ? t.accents.pop : t.accents.pen,
          color: isPlaying ? '#fff' : t.palette.text.primary,
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
          '&:hover': { transform: 'translate(-1px, -1px)', boxShadow: `3px 3px 0 ${t.palette.text.primary}` },
        } : {
          width: 38, height: 38,
          border: `1px solid ${t.palette.text.primary}`,
          backgroundColor: isPlaying ? t.palette.text.primary : 'transparent',
          color: isPlaying ? '#fff' : t.palette.text.primary,
          transition: 'all 0.12s ease',
          '&:hover': { backgroundColor: t.palette.text.primary, color: '#fff' },
        }),
      }}
    >
      {isPlaying ? <StopIcon fontSize="small" /> : <PlayArrowIcon fontSize="small" />}
    </Box>
  );
}
