import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import type { Mode } from '../../playback/player';

const MODES: { value: Mode; label: string }[] = [
  { value: 'triple', label: 'Triple' },
  { value: 'slow',   label: 'Slow' },
  { value: 'normal', label: 'Normal' },
  { value: 'drill',  label: 'Drill' },
];

interface Props {
  value: Mode;
  onChange: (m: Mode) => void;
  disabled?: boolean;
}

export default function ModeSelector({ value, onChange, disabled }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  return (
    <Box sx={{
      display: 'flex', flexWrap: 'wrap',
      alignItems: isComic ? 'center' : 'baseline',
      gap: isComic ? '6px' : '16px',
    }}>
      <Typography variant="overline" sx={{ mr: isComic ? '4px' : 0 }}>Mode</Typography>
      {MODES.map(m => (
        <ModePill
          key={m.value}
          selected={value === m.value}
          disabled={disabled}
          onClick={() => onChange(m.value)}
        >
          {m.label}
        </ModePill>
      ))}
    </Box>
  );
}

function ModePill({ selected, disabled, onClick, children }: {
  selected: boolean; disabled?: boolean; onClick: () => void; children: string;
}) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={{
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
        ...(isComic ? {
          fontSize: 12, fontWeight: 700, padding: '6px 10px',
          border: `2.5px solid ${t.palette.text.primary}`,
          borderRadius: 999,
          backgroundColor: selected ? t.palette.text.primary : t.palette.background.paper,
          color: selected ? '#fff' : t.palette.text.primary,
        } : {
          fontSize: 16, fontStyle: 'italic',
          border: 'none', background: 'transparent', padding: 0,
          color: selected ? t.palette.text.primary : t.palette.text.disabled,
          textDecoration: selected ? 'underline' : 'none',
          textUnderlineOffset: 4,
          '&:hover': { color: t.palette.text.secondary },
        }),
      }}
    >
      {children}
    </Box>
  );
}
