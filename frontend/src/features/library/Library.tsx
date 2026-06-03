import { useEffect, useMemo, useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import RepeatIcon from '@mui/icons-material/Repeat';
import { getAudioUrl, type Phrase } from '../../api/client';
import { playPhraseFromUrls, type Mode, type PlayController } from '../../playback/player';
import ModeSelector from '../compose/ModeSelector';
import PhraseRow from './PhraseRow';
import LanguageGroup from './LanguageGroup';
import EditPhraseModal from './EditPhraseModal';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import QuizSetupModal from './QuizSetupModal';
import QuizModal from './QuizModal';
import ExportModal from './ExportModal';

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
  const [mode, setMode] = useState<Mode>('normal');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [stageLabel, setStageLabel] = useState('');
  const [loop, setLoop] = useState(false);
  const loopRef = useRef(false);
  const [editing, setEditing] = useState<Phrase | null>(null);
  const [deletingPhrase, setDeletingPhrase] = useState<Phrase | null>(null);
  const [quizSetupOpen, setQuizSetupOpen] = useState(false);
  const [quizPhrases, setQuizPhrases] = useState<Phrase[] | null>(null);
  const [exportSetupOpen, setExportSetupOpen] = useState(false);
  const [exportPhrases, setExportPhrases] = useState<Phrase[] | null>(null);
  const playRef = useRef<PlayController | null>(null);

  const knownTags = useMemo(
    () => [...new Set(phrases.flatMap(p => p.tags ?? []))].sort(),
    [phrases],
  );

  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredPhrases = selectedTags.length === 0
    ? phrases
    : phrases.filter(p => p.tags?.some(tag => selectedTags.includes(tag)));

  function toggleTagFilter(tag: string) {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  }

  useEffect(() => () => { playRef.current?.stop(); }, []);

  function toggleLoop() {
    const next = !loopRef.current;
    loopRef.current = next;
    setLoop(next);
  }

  function handlePlay(p: Phrase) {
    if (playingId === p.phraseId) {
      playRef.current?.stop();
      playRef.current = null;
      setPlayingId(null);
      setStageLabel('');
      return;
    }
    playRef.current?.stop();
    setPlayingId(p.phraseId);
    setStageLabel('');

    function startPlay() {
      const ctl = playPhraseFromUrls({
        normalUrl: getAudioUrl(p.normalS3Key),
        slowUrl: getAudioUrl(p.slowS3Key),
        mode,
        onStage: ({ index, total }) => {
          if (mode === 'drill') setStageLabel(`${index}/${total}`);
        },
      });
      playRef.current = ctl;
      ctl.done.finally(() => {
        if (playRef.current !== ctl) return;
        setStageLabel('');
        if (loopRef.current) {
          setTimeout(() => {
            if (playRef.current !== ctl) return;
            if (loopRef.current) {
              startPlay();
            } else {
              playRef.current = null;
              setPlayingId(prev => (prev === p.phraseId ? null : prev));
            }
          }, 3000);
        } else {
          playRef.current = null;
          setPlayingId(prev => (prev === p.phraseId ? null : prev));
        }
      });
    }

    startPlay();
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: isComic ? '8px' : '10px' }}>
          {phrases.length > 0 && (
            <>
              <QuizButton label="Export" onClick={() => setExportSetupOpen(true)} isComic={isComic} />
              <QuizButton label="Quiz" onClick={() => setQuizSetupOpen(true)} isComic={isComic} />
            </>
          )}
          <CountBadge count={phrases.length} loading={loading} />
        </Box>
      </Box>

      <Box sx={{ mb: isComic ? '10px' : '14px', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: isComic ? '10px' : '20px' }}>
        <ModeSelector value={mode} onChange={setMode} />
        <Box sx={{
          width: '1px', height: isComic ? '20px' : '16px', flexShrink: 0,
          backgroundColor: isComic ? t.palette.text.primary : '#ddd',
        }} />
        <LoopPill active={loop} onClick={toggleLoop} />
        {knownTags.length > 0 && (
          <>
            <Box sx={{
              width: '1px', height: isComic ? '20px' : '16px', flexShrink: 0,
              backgroundColor: isComic ? t.palette.text.primary : '#ddd',
            }} />
            {knownTags.map(tag => {
              const active = selectedTags.includes(tag);
              return (
                <Box
                  key={tag}
                  component="button"
                  type="button"
                  onClick={() => toggleTagFilter(tag)}
                  sx={isComic ? {
                    fontSize: 11, fontWeight: 700,
                    padding: '3px 10px',
                    border: `2px solid ${t.palette.text.primary}`,
                    borderRadius: 999,
                    cursor: 'pointer', fontFamily: 'inherit',
                    backgroundColor: active ? t.palette.text.primary : 'transparent',
                    color: active ? '#fff' : t.palette.text.primary,
                    transition: 'background-color 0.1s',
                  } : {
                    fontSize: 12, fontStyle: 'italic',
                    padding: '2px 9px',
                    border: `1px solid ${active ? t.palette.text.primary : '#ccc'}`,
                    borderRadius: 999,
                    cursor: 'pointer', fontFamily: 'inherit',
                    backgroundColor: active ? t.palette.text.primary : 'transparent',
                    color: active ? '#fff' : t.palette.text.secondary,
                    transition: 'all 0.1s',
                    '&:hover': { borderColor: t.palette.text.primary, color: active ? '#fff' : t.palette.text.primary },
                  }}
                >
                  {tag}
                </Box>
              );
            })}
          </>
        )}
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

      {groupByLanguageName(filteredPhrases).map(([name, group]) => (
        <LanguageGroup key={name.toLowerCase()} name={name} count={group.length}>
          {group.map(p => (
            <PhraseRow
              key={p.phraseId}
              phrase={p}
              isPlaying={playingId === p.phraseId}
              stageLabel={playingId === p.phraseId ? stageLabel : undefined}
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
          knownTags={knownTags}
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

      {quizSetupOpen && (
        <QuizSetupModal
          phrases={phrases}
          onClose={() => setQuizSetupOpen(false)}
          onStart={selected => {
            setQuizSetupOpen(false);
            setQuizPhrases(selected);
          }}
        />
      )}

      {quizPhrases && (
        <QuizModal
          phrases={quizPhrases}
          onClose={() => setQuizPhrases(null)}
        />
      )}

      {exportSetupOpen && (
        <QuizSetupModal
          phrases={phrases}
          title="Select phrases to export"
          actionLabel="Export"
          onClose={() => setExportSetupOpen(false)}
          onStart={selected => {
            setExportSetupOpen(false);
            setExportPhrases(selected);
          }}
        />
      )}

      {exportPhrases && (
        <ExportModal
          phrases={exportPhrases}
          onClose={() => setExportPhrases(null)}
        />
      )}
    </Box>
  );
}

function LoopPill({ active, onClick }: { active: boolean; onClick: () => void }) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={isComic ? {
        fontSize: 12, fontWeight: 700, padding: '6px 10px',
        border: `2.5px solid ${t.palette.text.primary}`,
        borderRadius: 999, cursor: 'pointer', fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        backgroundColor: active ? t.palette.text.primary : t.palette.background.paper,
        color: active ? '#fff' : t.palette.text.primary,
      } : {
        fontSize: 16, fontStyle: 'italic',
        border: 'none', background: 'transparent', padding: 0, cursor: 'pointer',
        fontFamily: 'inherit',
        display: 'inline-flex', alignItems: 'center', gap: '4px',
        color: active ? t.palette.text.primary : t.palette.text.disabled,
        '&:hover': { color: t.palette.text.secondary },
      }}
    >
      <RepeatIcon sx={{ fontSize: isComic ? 14 : 16 }} />
      Loop
    </Box>
  );
}

function QuizButton({ label, onClick, isComic }: { label: string; onClick: () => void; isComic: boolean }) {
  const t = useTheme();
  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={isComic ? {
        background: 'transparent', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
        color: t.palette.text.primary, padding: '3px 8px',
        border: `2px solid ${t.palette.text.primary}`, borderRadius: 1,
        '&:hover': { backgroundColor: t.palette.text.primary, color: '#fff' },
      } : {
        background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        fontSize: 13, fontStyle: 'italic', color: t.palette.text.disabled, padding: '2px 6px',
        '&:hover': { color: t.palette.text.primary },
      }}
    >
      {label}
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
