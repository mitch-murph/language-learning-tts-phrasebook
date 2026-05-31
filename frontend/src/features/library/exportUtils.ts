import JSZip from 'jszip';
import { getAudioUrl, type Phrase } from '../../api/client';
import type { Mode } from '../../playback/player';

const DRILL_STEP_GAP_SEC = 2;
const MP3_BITRATE = 128;
const MP3_BLOCK_SIZE = 1152; // samples per LAME frame

function sanitizeFilename(s: string): string {
  return s
    .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
    .trim()
    .slice(0, 80) || 'phrase';
}

function uniqueName(base: string, used: Set<string>): string {
  if (!used.has(base)) { used.add(base); return base; }
  let n = 2;
  while (used.has(`${base}-${n}`)) n++;
  const unique = `${base}-${n}`;
  used.add(unique);
  return unique;
}

async function fetchBytes(url: string): Promise<ArrayBuffer> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch audio (${res.status})`);
  return res.arrayBuffer();
}

async function decodeAudio(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  return ctx.decodeAudioData(await fetchBytes(url));
}

function floatToInt16(float32: Float32Array): Int16Array {
  const out = new Int16Array(float32.length);
  for (let i = 0; i < float32.length; i++) {
    const s = Math.max(-1, Math.min(1, float32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

async function audioBufferToMp3(buffer: AudioBuffer): Promise<Uint8Array> {
  const { Mp3Encoder } = await import('@breezystack/lamejs');
  const encoder = new Mp3Encoder(1, buffer.sampleRate, MP3_BITRATE);
  const pcm = floatToInt16(buffer.getChannelData(0));
  const chunks: Uint8Array[] = [];

  for (let i = 0; i < pcm.length; i += MP3_BLOCK_SIZE) {
    const encoded = encoder.encodeBuffer(pcm.subarray(i, i + MP3_BLOCK_SIZE));
    if (encoded.length > 0) chunks.push(encoded);
  }
  const flushed = encoder.flush();
  if (flushed.length > 0) chunks.push(flushed);

  const total = chunks.reduce((acc, c) => acc + c.length, 0);
  const result = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { result.set(c, off); off += c.length; }
  return result;
}

// Renders the drill sequence (normal → gap → slow → gap → normal) for one phrase
async function renderDrill(ctx: AudioContext, phrase: Phrase): Promise<AudioBuffer> {
  const normalBuf = await decodeAudio(ctx, getAudioUrl(phrase.normalS3Key));
  const slowBuf = await decodeAudio(ctx, getAudioUrl(phrase.slowS3Key));
  const sequence = [normalBuf, slowBuf, normalBuf];

  const totalSec = sequence.reduce((s, b) => s + b.duration, 0) + DRILL_STEP_GAP_SEC * 2;
  const offline = new OfflineAudioContext(1, Math.ceil(totalSec * 44100), 44100);

  let offsetSec = 0;
  for (let i = 0; i < sequence.length; i++) {
    const src = offline.createBufferSource();
    src.buffer = sequence[i];
    src.connect(offline.destination);
    src.start(offsetSec);
    offsetSec += sequence[i].duration;
    if (i < sequence.length - 1) offsetSec += DRILL_STEP_GAP_SEC;
  }

  return offline.startRendering();
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function downloadZip(
  phrases: Phrase[],
  mode: Mode,
  onProgress: (done: number, total: number) => void,
) {
  const zip = new JSZip();
  const used = new Set<string>();
  const ctx = mode === 'drill' ? new AudioContext() : null;

  for (let pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi];
    const name = uniqueName(sanitizeFilename(phrase.translation || phrase.text), used);

    if (mode === 'normal') {
      zip.file(`${name}.mp3`, await fetchBytes(getAudioUrl(phrase.normalS3Key)));
    } else if (mode === 'slow') {
      zip.file(`${name}.mp3`, await fetchBytes(getAudioUrl(phrase.slowS3Key)));
    } else {
      const rendered = await renderDrill(ctx!, phrase);
      const mp3 = await audioBufferToMp3(rendered);
      zip.file(`${name}.mp3`, mp3.buffer as ArrayBuffer);
    }

    onProgress(pi + 1, phrases.length);
  }

  ctx?.close();
  const blob = await zip.generateAsync({ type: 'blob' });
  triggerDownload(blob, 'phrases.zip');
}

export async function downloadCombined(
  phrases: Phrase[],
  mode: Mode,
  phraseGapSec: number,
  onProgress: (done: number, total: number, stage: 'fetch' | 'encode') => void,
) {
  const ctx = new AudioContext();

  type PhraseBufs = { bufs: AudioBuffer[]; stepGap: number };
  const phraseData: PhraseBufs[] = [];

  for (let pi = 0; pi < phrases.length; pi++) {
    const phrase = phrases[pi];
    const nUrl = getAudioUrl(phrase.normalS3Key);
    const sUrl = getAudioUrl(phrase.slowS3Key);

    if (mode === 'normal') {
      phraseData.push({ bufs: [await decodeAudio(ctx, nUrl)], stepGap: 0 });
    } else if (mode === 'slow') {
      phraseData.push({ bufs: [await decodeAudio(ctx, sUrl)], stepGap: 0 });
    } else {
      const normalBuf = await decodeAudio(ctx, nUrl);
      const slowBuf = await decodeAudio(ctx, sUrl);
      phraseData.push({ bufs: [normalBuf, slowBuf, normalBuf], stepGap: DRILL_STEP_GAP_SEC });
    }

    onProgress(pi + 1, phrases.length, 'fetch');
  }

  ctx.close();

  let totalSec = 0;
  for (let pi = 0; pi < phraseData.length; pi++) {
    const { bufs, stepGap } = phraseData[pi];
    for (let bi = 0; bi < bufs.length; bi++) {
      totalSec += bufs[bi].duration;
      if (bi < bufs.length - 1) totalSec += stepGap;
    }
    if (pi < phraseData.length - 1) totalSec += phraseGapSec;
  }

  const sampleRate = 44100;
  const offline = new OfflineAudioContext(1, Math.ceil(totalSec * sampleRate), sampleRate);
  let offsetSec = 0;

  for (let pi = 0; pi < phraseData.length; pi++) {
    const { bufs, stepGap } = phraseData[pi];
    for (let bi = 0; bi < bufs.length; bi++) {
      const src = offline.createBufferSource();
      src.buffer = bufs[bi];
      src.connect(offline.destination);
      src.start(offsetSec);
      offsetSec += bufs[bi].duration;
      if (bi < bufs.length - 1) offsetSec += stepGap;
    }
    if (pi < phraseData.length - 1) offsetSec += phraseGapSec;
  }

  onProgress(0, 1, 'encode');
  const rendered = await offline.startRendering();
  const mp3 = await audioBufferToMp3(rendered);
  onProgress(1, 1, 'encode');

  triggerDownload(new Blob([mp3.buffer as ArrayBuffer], { type: 'audio/mpeg' }), 'phrases.mp3');
}
