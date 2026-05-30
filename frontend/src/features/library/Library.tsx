import { useEffect, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import { getAudioUrl, type Phrase } from '../../api/client';
import { playFromUrl, type PlayController } from '../../playback/player';
import PhraseRow from './PhraseRow';
import LanguageGroup from './LanguageGroup';
import EditPhraseModal from './EditPhraseModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';

function groupByLanguageName(phrases: Phrase[]): [string, Phrase[]][] {
  const groups = new Map<string, { name: string; items: Phrase[] }>();
  for (const p of phrases) {
    const key = p.languageName.toLowerCase();
    const entry = groups.get(key);
    if (entry) entry.items.push(p);
    else groups.set(key, { name: p.languageName, items: [p] });
  }
  return [...groups.values()]
    .sort((a, b) => a.name.localeCompare(b.name))
    .map(({ name, items }) => [name, items] as [string, Phrase[]]);
}

interface Props {
  phrases: Phrase[];
  loading: boolean;
  error: string;
  onUpdated: (phrase: Phrase) => void;
  onDeleted: (phraseId: string) => void;
}

export default function Library({ phrases, loading, error, onUpdated, onDeleted }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Phrase | null>(null);
  const [deletingPhrase, setDeletingPhrase] = useState<Phrase | null>(null);
  const playRef = useRef<PlayController | null>(null);

  useEffect(() => () => { playRef.current?.stop(); }, []);

  function handlePlay(p: Phrase) {
    if (playingId === p.phraseId) {
      playRef.current?.stop();
      playRef.current = null;
      setPlayingId(null);
      return;
    }
    playRef.current?.stop();
    setPlayingId(p.phraseId);
    const ctl = playFromUrl(getAudioUrl(p.s3Key));
    playRef.current = ctl;
    ctl.done.finally(() => {
      if (playRef.current === ctl) {
        playRef.current = null;
        setPlayingId(prev => (prev === p.phraseId ? null : prev));
      }
    });
  }

  return (
    <Box component="section">
      <Box sx={{
        display: 'flex',
        alignItems: isComic ? 'center' : 'baseline',
        justifyContent: 'space-between',
        ...(isComic
          ? { mb: '10px' }
          : { pb: '6px', borderBottom: `1px solid ${t.palette.text.primary}` }),
      }}>
        <Typography variant="h2">Library</Typography>
        <CountBadge count={phrases.length} loading={loading} />
      </Box>

      {error && (
        <Typography sx={{
          mt: '12px', fontSize: 12, color: t.accents.pop,
          fontWeight: isComic ? 700 : 400,
          fontStyle: isComic ? 'normal' : 'italic',
        }}>{error}</Typography>
      )}

      {!loading && phrases.length === 0 && !error && (
        <Box sx={isComic ? {
          mt: '12px', p: '24px', textAlign: 'center',
          border: `3px dashed ${t.palette.text.primary}`, borderRadius: 2,
          color: t.palette.text.disabled,
        } : {
          py: '28px', fontStyle: 'italic', color: t.palette.text.disabled,
        }}>
          No saved phrases yet. Save one above.
        </Box>
      )}

      {groupByLanguageName(phrases).map(([name, group]) => (
        <LanguageGroup key={name.toLowerCase()} name={name} count={group.length}>
          {group.map(p => (
            <PhraseRow
              key={p.phraseId}
              phrase={p}
              isPlaying={playingId === p.phraseId}
              onPlay={() => handlePlay(p)}
              onEdit={() => setEditing(p)}
              onDelete={() => setDeletingPhrase(p)}
            />
          ))}
        </LanguageGroup>
      ))}

      {editing && (
        <EditPhraseModal
          phrase={editing}
          onClose={() => setEditing(null)}
          onSaved={(updated) => {
            onUpdated(updated);
            setEditing(null);
          }}
        />
      )}

      {deletingPhrase && (
        <ConfirmDeleteModal
          phrase={deletingPhrase}
          onClose={() => setDeletingPhrase(null)}
          onDeleted={(phraseId) => {
            onDeleted(phraseId);
            setDeletingPhrase(null);
          }}
        />
      )}
    </Box>
  );
}

function CountBadge({ count, loading }: { count: number; loading: boolean }) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const label = loading ? '…' : `${count} phrase${count === 1 ? '' : 's'}`;

  if (isComic) {
    return (
      <Box sx={{
        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em',
        color: '#fff', backgroundColor: t.palette.text.primary,
        borderRadius: 999, padding: '3px 9px',
      }}>{label}</Box>
    );
  }
  return (
    <Box sx={{ fontSize: 14, color: t.palette.text.disabled, fontStyle: 'italic' }}>{label}</Box>
  );
}
