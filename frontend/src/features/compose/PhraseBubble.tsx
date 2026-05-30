import { useEffect, useRef, type ChangeEvent } from 'react';
import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';

interface Props {
  text: string;
  onTextChange: (v: string) => void;
  transcription: string;
  onTranscriptionChange: (v: string) => void;
  translation: string;
  onTranslationChange: (v: string) => void;
  showRomanization: boolean;
  disabled?: boolean;
  stamped?: boolean;
}

export default function PhraseBubble(props: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const taRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [props.text]);

  const wrapSx = isComic
    ? {
        position: 'relative' as const,
        backgroundColor: t.palette.background.paper,
        border: `3px solid ${t.palette.text.primary}`,
        borderRadius: '18px',
        padding: '18px 18px 20px',
        margin: '4px 0 22px',
        '&::after': {
          content: '""', position: 'absolute', left: 38, bottom: -19,
          width: 0, height: 0,
          borderRight: '24px solid transparent',
          borderTop: `20px solid ${t.palette.text.primary}`,
        },
        '&::before': {
          content: '""', position: 'absolute', left: 43, bottom: -13,
          width: 0, height: 0, zIndex: 1,
          borderRight: '16px solid transparent',
          borderTop: `13px solid ${t.palette.background.paper}`,
        },
      }
    : {
        position: 'relative' as const,
        borderTop: '1px solid #d2d2d2',
        paddingTop: '20px',
      };

  return (
    <Box sx={wrapSx}>
      <Box
        component="textarea"
        ref={taRef}
        rows={1}
        value={props.text}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => props.onTextChange(e.target.value)}
        placeholder={isComic ? 'Say it here…!' : 'Type a phrase to practice…'}
        disabled={props.disabled}
        sx={{
          width: '100%', border: 'none', outline: 'none',
          background: 'transparent', resize: 'none', padding: 0,
          color: t.palette.text.primary,
          fontFamily: 'inherit',
          ...(isComic ? {
            fontWeight: 800, fontSize: 30, lineHeight: 1.18,
            letterSpacing: '-0.01em', minHeight: 84,
            '&::placeholder': { color: '#c4beb5' },
          } : {
            fontWeight: 400, fontSize: 38, lineHeight: 1.2,
            letterSpacing: '-0.01em', minHeight: 104,
            '&::placeholder': { color: '#c4c4c4', fontStyle: 'italic' },
          }),
        }}
      />
      <MetaRow {...props} />
      {props.stamped && <SavedStamp isComic={isComic} />}
    </Box>
  );
}

function SavedStamp({ isComic }: { isComic: boolean }) {
  const t = useTheme();
  if (isComic) {
    return (
      <Box
        aria-hidden
        sx={{
          position: 'absolute',
          top: { xs: -10, sm: -16 },
          right: { xs: 10, sm: 20 },
          pointerEvents: 'none',
          zIndex: 3,
          fontFamily: '"Bangers", cursive',
          fontSize: { xs: 34, sm: 44 },
          lineHeight: 1,
          color: t.accents.pop,
          backgroundColor: 'rgba(255,255,255,0.92)',
          border: `3px solid ${t.accents.pop}`,
          borderRadius: '6px',
          padding: '6px 14px 2px',
          letterSpacing: '0.06em',
          textShadow: `1px 1px 0 ${t.palette.text.primary}22`,
          transformOrigin: 'center',
          animation: 'savedStampComic 1.6s ease-out forwards',
          '@keyframes savedStampComic': {
            '0%':   { opacity: 0, transform: 'rotate(-8deg) scale(2.4)' },
            '18%':  { opacity: 1, transform: 'rotate(-8deg) scale(0.88)' },
            '32%':  { opacity: 1, transform: 'rotate(-8deg) scale(1.04)' },
            '45%':  { opacity: 1, transform: 'rotate(-8deg) scale(1)' },
            '75%':  { opacity: 1, transform: 'rotate(-8deg) scale(1)' },
            '100%': { opacity: 0, transform: 'rotate(-8deg) scale(1)' },
          },
        }}
      >
        SAVED!
      </Box>
    );
  }
  return (
    <Box
      aria-hidden
      sx={{
        position: 'absolute',
        top: 24,
        right: 0,
        pointerEvents: 'none',
        zIndex: 3,
        fontFamily: '"Newsreader", Georgia, serif',
        fontStyle: 'italic',
        fontSize: 18,
        color: t.palette.text.secondary,
        letterSpacing: '0.02em',
        animation: 'savedStampInk 1.6s ease-out forwards',
        '@keyframes savedStampInk': {
          '0%':   { opacity: 0, transform: 'translateY(-4px)' },
          '15%':  { opacity: 1, transform: 'translateY(0)' },
          '75%':  { opacity: 1, transform: 'translateY(0)' },
          '100%': { opacity: 0, transform: 'translateY(0)' },
        },
      }}
    >
      ✓ saved
    </Box>
  );
}

function MetaRow(props: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  const rowSx = isComic
    ? {
        display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: '10px', mt: '12px', pt: '12px',
        borderTop: `2px dashed ${t.palette.text.primary}`,
      }
    : {
        display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
        gap: 0, mt: '8px', borderTop: '1px solid #e6e6e6',
      };

  return (
    <Box sx={rowSx}>
      {props.showRomanization && (
        <MetaCell
          label="Romanization"
          value={props.transcription}
          onChange={props.onTranscriptionChange}
          placeholder={isComic ? 'pinyin, romaji…' : 'pinyin, romaji…'}
          disabled={props.disabled}
          position="first"
        />
      )}
      <MetaCell
        label="English meaning"
        value={props.translation}
        onChange={props.onTranslationChange}
        placeholder="optional"
        disabled={props.disabled}
        position={props.showRomanization ? 'last' : 'full'}
      />
    </Box>
  );
}

function MetaCell({ label, value, onChange, placeholder, disabled, position }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  disabled?: boolean;
  position: 'first' | 'last' | 'full';
}) {
  const t = useTheme();
  const isComic = t.appName === 'comic';

  const cellSx = isComic
    ? { ...(position === 'full' && { gridColumn: '1 / -1' }) }
    : {
        ...(position === 'first' && { padding: '14px 18px 14px 0', borderRight: { xs: 'none', sm: '1px solid #e6e6e6' }, borderBottom: { xs: '1px solid #e6e6e6', sm: 'none' } }),
        ...(position === 'last'  && { padding: { xs: '14px 0', sm: '14px 0 14px 18px' } }),
        ...(position === 'full'  && { padding: '14px 0', gridColumn: '1 / -1' }),
      };

  return (
    <Box sx={cellSx}>
      <Box component="label" sx={{
        display: 'block', mb: isComic ? '3px' : '4px',
        ...(isComic
          ? { fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.10em', color: t.palette.text.disabled }
          : { fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.16em', color: '#8a8a8a' }),
      }}>
        {label}
      </Box>
      <Box
        component="input"
        type="text"
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        sx={{
          width: '100%', border: 'none', outline: 'none',
          background: 'transparent', padding: 0,
          color: t.palette.text.primary, fontFamily: 'inherit',
          ...(isComic
            ? { fontWeight: 600, fontSize: 16, '&::placeholder': { color: '#c4beb5' } }
            : { fontSize: 19, '&::placeholder': { color: '#c4c4c4', fontStyle: 'italic' } }),
        }}
      />
    </Box>
  );
}
