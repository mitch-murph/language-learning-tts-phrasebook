import { useState } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

interface Props {
  value: string[];
  onChange: (tags: string[]) => void;
  knownTags: string[];
  disabled?: boolean;
}

export default function TagEditor({ value, onChange, knownTags, disabled }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');

  const allTags = [...new Set([...knownTags, ...value])];

  function toggle(tag: string) {
    if (value.includes(tag)) onChange(value.filter(v => v !== tag));
    else onChange([...value, tag]);
  }

  function commitDraft() {
    const trimmed = draft.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setDraft('');
    setAdding(false);
  }

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' }}>
      {allTags.map(tag => (
        <TagPill
          key={tag}
          label={tag}
          active={value.includes(tag)}
          disabled={disabled}
          onClick={() => toggle(tag)}
        />
      ))}
      {adding ? (
        <Box
          component="input"
          autoFocus
          value={draft}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDraft(e.target.value)}
          onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === 'Enter') { e.preventDefault(); commitDraft(); }
            if (e.key === 'Escape') { setAdding(false); setDraft(''); }
          }}
          onBlur={commitDraft}
          disabled={disabled}
          placeholder="new tag"
          sx={{
            fontFamily: 'inherit',
            border: isComic ? `2px solid ${t.palette.text.primary}` : '1px solid #ccc',
            borderRadius: 999,
            padding: isComic ? '3px 10px' : '2px 10px',
            fontSize: 12,
            fontWeight: isComic ? 700 : 400,
            outline: 'none',
            width: '90px',
            backgroundColor: 'transparent',
            color: t.palette.text.primary,
          }}
        />
      ) : (
        <Box
          component="button"
          type="button"
          onClick={() => setAdding(true)}
          disabled={disabled}
          sx={isComic ? {
            fontSize: 12, fontWeight: 700,
            padding: '3px 10px',
            border: `2px dashed ${t.palette.text.primary}`,
            borderRadius: 999,
            cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent',
            color: t.palette.text.secondary,
            '&:hover:not(:disabled)': { color: t.palette.text.primary },
            '&:disabled': { opacity: 0.4, cursor: 'default' },
          } : {
            fontSize: 12, fontStyle: 'italic',
            padding: '2px 8px',
            border: '1px dashed #ccc',
            borderRadius: 999,
            cursor: 'pointer', fontFamily: 'inherit',
            background: 'transparent',
            color: t.palette.text.disabled,
            '&:hover:not(:disabled)': { color: t.palette.text.secondary, borderColor: '#999' },
            '&:disabled': { opacity: 0.4, cursor: 'default' },
          }}
        >
          + tag
        </Box>
      )}
    </Box>
  );
}

function TagPill({ label, active, disabled, onClick }: {
  label: string;
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      disabled={disabled}
      sx={isComic ? {
        fontSize: 12, fontWeight: 700,
        padding: '3px 10px',
        border: `2px solid ${t.palette.text.primary}`,
        borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        backgroundColor: active ? t.palette.text.primary : 'transparent',
        color: active ? '#fff' : t.palette.text.primary,
        transition: 'background-color 0.1s',
        '&:hover:not(:disabled)': { backgroundColor: active ? t.palette.text.secondary : t.palette.action?.hover ?? 'rgba(0,0,0,0.04)' },
        '&:disabled': { opacity: 0.4 },
      } : {
        fontSize: 12, fontStyle: 'italic',
        padding: '2px 8px',
        border: `1px solid ${active ? t.palette.text.primary : '#ccc'}`,
        borderRadius: 999,
        cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
        backgroundColor: active ? t.palette.text.primary : 'transparent',
        color: active ? '#fff' : t.palette.text.secondary,
        transition: 'all 0.1s',
        '&:hover:not(:disabled)': { borderColor: t.palette.text.primary, color: active ? '#fff' : t.palette.text.primary },
        '&:disabled': { opacity: 0.4 },
      }}
    >
      {label}
    </Box>
  );
}
