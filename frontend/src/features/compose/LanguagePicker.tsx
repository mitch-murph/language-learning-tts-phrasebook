import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { colorForName, type Language } from '../../domain/languages';

interface Props {
  languages: Language[];
  value: Language | null;
  onChange: (lang: Language) => void;
  onAddClick: () => void;
  disabled?: boolean;
}

export default function LanguagePicker({ languages, value, onChange, onAddClick, disabled }: Props) {
  const selectedKey = value?.name.toLowerCase();
  return (
    <Box sx={(t) => ({
      display: 'flex', flexWrap: 'wrap',
      gap: t.appName === 'comic' ? '7px' : '4px 20px',
      mb: t.appName === 'comic' ? '18px' : '26px',
    })}>
      {languages.map(l => (
        <Pill
          key={l.name.toLowerCase()}
          language={l}
          selected={l.name.toLowerCase() === selectedKey}
          disabled={disabled}
          onClick={() => onChange(l)}
        />
      ))}
      <AddPill onClick={onAddClick} disabled={disabled} />
    </Box>
  );
}

function Pill({ language, selected, onClick, disabled }: {
  language: Language; selected: boolean; onClick: () => void; disabled?: boolean;
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
        display: 'inline-flex', alignItems: isComic ? 'center' : 'baseline',
        gap: '7px', fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.12s ease',
        ...(isComic ? {
          fontSize: 13, fontWeight: 700, padding: '6px 12px',
          border: `2.5px solid ${t.palette.text.primary}`,
          borderRadius: 999,
          backgroundColor: selected ? t.palette.text.primary : t.palette.background.paper,
          color: selected ? '#fff' : t.palette.text.primary,
          '&:hover': { backgroundColor: selected ? t.palette.text.primary : t.accents.pen },
        } : {
          fontSize: 16, fontStyle: 'italic', padding: '2px 0',
          border: 'none', background: 'transparent',
          color: selected ? t.palette.text.primary : t.palette.text.disabled,
          textDecoration: selected ? 'underline' : 'none',
          textUnderlineOffset: 4,
          '&:hover': { color: t.palette.text.secondary },
        }),
      }}
    >
      <Box component="span" sx={{
        width: isComic ? 9 : 6,
        height: isComic ? 9 : 6,
        borderRadius: '50%',
        backgroundColor: colorForName(language.name),
        ...(isComic
          ? { border: `1.5px solid ${selected ? '#fff' : t.palette.text.primary}` }
          : { opacity: 0.8, alignSelf: 'center' }),
      }} />
      {language.name}
    </Box>
  );
}

function AddPill({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
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
        display: 'inline-flex', alignItems: 'center',
        gap: '5px', fontFamily: 'inherit',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.12s ease',
        ...(isComic ? {
          fontSize: 13, fontWeight: 700, padding: '6px 12px',
          border: `2.5px dashed ${t.palette.text.primary}`,
          borderRadius: 999,
          backgroundColor: 'transparent',
          color: t.palette.text.primary,
          '&:hover': { backgroundColor: t.accents.pen },
        } : {
          fontSize: 16, fontStyle: 'italic', padding: '2px 0',
          border: 'none', background: 'transparent',
          color: t.palette.text.disabled,
          '&:hover': { color: t.palette.text.primary },
        }),
      }}
    >
      + Add language
    </Box>
  );
}
