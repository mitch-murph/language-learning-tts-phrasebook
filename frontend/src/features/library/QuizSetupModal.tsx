import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Checkbox from '@mui/material/Checkbox';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useTheme } from '@mui/material/styles';
import { colorForName } from '../../domain/languages';
import type { Phrase } from '../../api/client';

function groupByLang(phrases: Phrase[]): [string, Phrase[]][] {
  const map = new Map<string, Phrase[]>();
  for (const p of phrases) {
    if (!map.has(p.languageName)) map.set(p.languageName, []);
    map.get(p.languageName)!.push(p);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}

interface Props {
  phrases: Phrase[];
  title?: string;
  actionLabel?: string;
  onClose: () => void;
  onStart: (selected: Phrase[]) => void;
}

export default function QuizSetupModal({ phrases, title, actionLabel, onClose, onStart }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const groups = groupByLang(phrases);

  function toggle(id: string) {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleGroup(group: Phrase[]) {
    const ids = group.map(p => p.phraseId);
    const allOn = ids.every(id => selected.has(id));
    setSelected(prev => {
      const next = new Set(prev);
      if (allOn) ids.forEach(id => next.delete(id));
      else ids.forEach(id => next.add(id));
      return next;
    });
  }

  function handleStart() {
    const picks = phrases.filter(p => selected.has(p.phraseId));
    onStart([...picks].sort(() => Math.random() - 0.5));
  }

  const rowBaseSx = {
    display: 'flex', alignItems: 'center', gap: 1.5,
    px: 2, cursor: 'pointer', userSelect: 'none' as const,
    outline: 'none',
    '&:focus-visible': { outline: `2px solid ${t.palette.primary.main}`, outlineOffset: -2 },
  };

  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{title ?? 'Select phrases to quiz'}</DialogTitle>
      <DialogContent dividers sx={{ p: 0 }}>
        {groups.map(([name, group]) => {
          const ids = group.map(p => p.phraseId);
          const numOn = ids.filter(id => selected.has(id)).length;
          const allOn = numOn === ids.length;
          const someOn = numOn > 0 && !allOn;

          return (
            <Box key={name}>
              <Box
                tabIndex={0}
                role="checkbox"
                aria-checked={allOn ? true : someOn ? 'mixed' : false}
                aria-label={`Select all ${name}`}
                onClick={() => toggleGroup(group)}
                onKeyDown={e => {
                  if (e.key === ' ' || e.key === 'Enter') {
                    e.preventDefault();
                    toggleGroup(group);
                  }
                }}
                sx={{
                  ...rowBaseSx,
                  py: 0.75,
                  backgroundColor: t.palette.action.hover,
                  borderBottom: '1px solid', borderColor: 'divider',
                }}
              >
                <Checkbox
                  checked={allOn}
                  indeterminate={someOn}
                  size="small"
                  sx={{ p: 0 }}
                  tabIndex={-1}
                  aria-hidden
                />
                <Box sx={{
                  width: 8, height: 8, borderRadius: '50%',
                  backgroundColor: colorForName(name), flexShrink: 0,
                }} />
                <Box sx={{
                  flex: 1,
                  fontSize: 13,
                  fontWeight: isComic ? 800 : 600,
                  textTransform: isComic ? 'uppercase' : 'none',
                  letterSpacing: isComic ? '0.06em' : 'normal',
                }}>
                  {name}
                </Box>
                <Box sx={{ fontSize: 12, color: 'text.disabled' }}>
                  {numOn}/{ids.length}
                </Box>
              </Box>

              {group.map(p => (
                <Box
                  key={p.phraseId}
                  tabIndex={0}
                  role="checkbox"
                  aria-checked={selected.has(p.phraseId)}
                  aria-label={p.translation ? `${p.text} — ${p.translation}` : p.text}
                  onClick={() => toggle(p.phraseId)}
                  onKeyDown={e => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      toggle(p.phraseId);
                    }
                  }}
                  sx={{
                    ...rowBaseSx,
                    py: 1.25,
                    borderBottom: '1px solid', borderColor: 'divider',
                    '&:hover': { backgroundColor: t.palette.action.hover },
                  }}
                >
                  <Checkbox
                    checked={selected.has(p.phraseId)}
                    size="small"
                    sx={{ p: 0 }}
                    tabIndex={-1}
                    aria-hidden
                  />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ fontSize: 15, fontWeight: isComic ? 700 : 400, lineHeight: 1.3 }}>
                      {p.text}
                    </Box>
                    {p.translation && (
                      <Box sx={{ fontSize: 13, color: 'text.secondary', lineHeight: 1.3 }}>
                        {p.translation}
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          );
        })}
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" disabled={selected.size === 0} onClick={handleStart}>
          {(actionLabel ?? 'Start Quiz')} ({selected.size})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
