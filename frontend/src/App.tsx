import { useEffect, useMemo, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import SettingsIcon from '@mui/icons-material/Settings';
import { useThemeController } from './theme/ThemeController';
import Composer from './features/compose/Composer';
import Library from './features/library/Library';
import SettingsModal from './features/settings/SettingsModal';
import { listPhrases, type Phrase } from './api/client';

function formatDate(d: Date): string {
  return new Intl.DateTimeFormat(undefined, { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
}

export default function App() {
  const { name: themeName, toggle } = useThemeController();
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [showSettings, setShowSettings] = useState(false);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loadingPhrases, setLoadingPhrases] = useState(true);
  const [phrasesError, setPhrasesError] = useState('');
  const today = useMemo(() => formatDate(new Date()), []);

  useEffect(() => {
    listPhrases()
      .then(setPhrases)
      .catch(e => setPhrasesError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoadingPhrases(false));
  }, []);

  return (
    <Container
      maxWidth={false}
      sx={isComic
        ? { maxWidth: 700, py: '26px', px: '22px', pb: '90px' }
        : { maxWidth: 660, pt: '48px', px: '34px', pb: '96px' }}
    >
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: isComic ? 'center' : 'baseline',
        gap: '12px',
        ...(isComic
          ? { mb: '24px' }
          : { pb: '18px', borderBottom: `1px solid ${t.palette.text.primary}`, mb: '40px' }),
      }}>
        <Brand />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <DateBadge label={today} />
          <ThemeToggle themeName={themeName} onToggle={toggle} />
          <IconButton onClick={() => setShowSettings(true)} aria-label="Settings">
            <SettingsIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <Composer
        phrases={phrases}
        onSaved={(p) => setPhrases(ps => [p, ...ps])}
      />
      <Library
        phrases={phrases}
        loading={loadingPhrases}
        error={phrasesError}
        onUpdated={(p) => setPhrases(ps => ps.map(x => x.phraseId === p.phraseId ? p : x))}
        onDeleted={(id) => setPhrases(ps => ps.filter(x => x.phraseId !== id))}
      />

      <SettingsModal open={showSettings} onClose={() => setShowSettings(false)} />
    </Container>
  );
}

function Brand() {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  return (
    <Box sx={{
      display: 'flex',
      alignItems: isComic ? 'center' : 'baseline',
      gap: isComic ? '12px' : '8px',
    }}>
      {isComic && (
        <Box sx={{
          width: 38, height: 38,
          backgroundColor: t.accents.pop, color: '#fff',
          border: `3px solid ${t.palette.text.primary}`,
          borderRadius: '50%',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: '"Bangers", cursive', fontSize: 22,
          transform: 'rotate(-6deg)',
        }}>P</Box>
      )}
      <Typography sx={isComic
        ? { fontFamily: '"Bangers", cursive', fontSize: 32, letterSpacing: '0.02em', transform: 'skew(-6deg)' }
        : { fontSize: 24, fontWeight: 400, fontStyle: 'italic', letterSpacing: '-0.01em' }
      }>
        {isComic ? 'Phrasebook!' : 'Phrasebook'}
      </Typography>
    </Box>
  );
}

function DateBadge({ label }: { label: string }) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  if (isComic) {
    return (
      <Box sx={{
        fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: t.palette.text.secondary, backgroundColor: t.accents.pen,
        border: `2px solid ${t.palette.text.primary}`,
        padding: '4px 8px',
        transform: 'rotate(2deg)',
      }}>{label}</Box>
    );
  }
  return (
    <Box sx={{ fontSize: 12, color: t.palette.text.disabled, fontStyle: 'italic' }}>{label}</Box>
  );
}

function ThemeToggle({ themeName, onToggle }: { themeName: 'comic' | 'ink'; onToggle: () => void }) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const label = themeName === 'comic' ? 'Ink' : 'Comic';

  return (
    <Box
      component="button"
      type="button"
      onClick={onToggle}
      title={`Switch to ${label} theme`}
      sx={{
        cursor: 'pointer', fontFamily: 'inherit',
        ...(isComic ? {
          padding: '4px 10px', height: 36, borderRadius: 1,
          border: `2.5px solid ${t.palette.text.primary}`,
          backgroundColor: t.palette.background.paper,
          color: t.palette.text.primary,
          boxShadow: `3px 3px 0 ${t.palette.text.primary}`,
          fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.02em',
          transition: 'transform 0.08s ease, box-shadow 0.08s ease',
          '&:hover': { transform: 'translate(-2px, -2px)', boxShadow: `5px 5px 0 ${t.palette.text.primary}`, backgroundColor: t.accents.pen },
        } : {
          padding: '4px 10px', border: `1px solid ${t.palette.text.primary}`,
          background: 'transparent', color: t.palette.text.primary,
          fontSize: 13, fontStyle: 'italic',
          transition: 'all 0.12s ease',
          '&:hover': { backgroundColor: t.palette.text.primary, color: '#fff' },
        }),
      }}
    >{label}</Box>
  );
}
