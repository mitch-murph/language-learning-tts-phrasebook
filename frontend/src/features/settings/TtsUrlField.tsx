import TextField from '@mui/material/TextField';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export default function TtsUrlField({ value, onChange }: Props) {
  return (
    <TextField
      label="TTS Proxy URL (including ?token=…)"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder="https://cxl-services.appspot.com/proxy?url=…&token=…"
      spellCheck={false}
      fullWidth
      helperText="The OAuth2 token is short-lived. Update this when audio stops working."
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
}
