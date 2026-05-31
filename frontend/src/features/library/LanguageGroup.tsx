import { type ReactNode, useState } from 'react';
import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import Typography from '@mui/material/Typography';
import { useTheme } from '@mui/material/styles';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { colorForName } from '../../domain/languages';

interface Props {
  name: string;
  count: number;
  children: ReactNode;
}

export default function LanguageGroup({ name, count, children }: Props) {
  const t = useTheme();
  const isComic = t.appName === 'comic';
  const [open, setOpen] = useState(true);

  return (
    <Box sx={{ mt: isComic ? '22px' : '30px' }}>
      <Box
        onClick={() => setOpen(o => !o)}
        sx={isComic ? {
          display: 'flex', alignItems: 'center', gap: '10px',
          padding: '6px 13px',
          backgroundColor: t.palette.text.primary, color: '#fff',
          borderRadius: 1.5,
          transform: 'rotate(-0.8deg)',
          cursor: 'pointer', userSelect: 'none',
        } : {
          display: 'flex', alignItems: 'baseline', gap: '10px',
          pb: '6px', borderBottom: '1px solid #d2d2d2',
          mb: '4px',
          cursor: 'pointer', userSelect: 'none',
        }}
      >
        <Box sx={{
          width: isComic ? 11 : 7,
          height: isComic ? 11 : 7,
          borderRadius: '50%',
          backgroundColor: colorForName(name),
          flexShrink: 0,
          ...(isComic ? { border: '1.5px solid #fff' } : { alignSelf: 'center' }),
        }} />
        <Typography variant="h3" sx={isComic ? { color: '#fff' } : undefined}>
          {name}
        </Typography>
        <Box sx={{
          marginLeft: 'auto',
          display: 'flex', alignItems: 'center', gap: '4px',
          ...(isComic
            ? { fontSize: 10, fontWeight: 700, textTransform: 'uppercase', opacity: 0.85 }
            : { fontSize: 12, color: t.palette.text.disabled, fontStyle: 'italic' }),
        }}>
          {count}
          <ExpandMoreIcon sx={{
            fontSize: 16,
            transition: 'transform 0.2s ease',
            transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            ...(isComic ? { opacity: 0.85 } : { color: t.palette.text.disabled }),
          }} />
        </Box>
      </Box>
      <Collapse in={open}>
        {children}
      </Collapse>
    </Box>
  );
}
