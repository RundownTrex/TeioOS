/**
 * Browser-side audio conversion for offline server dictation.
 *
 * MediaRecorder produces compressed WebM/Opus (Chromium) or Ogg/Opus (Firefox).
 * The exam server's offline recogniser expects mono 16-bit PCM WAV, so the
 * recording is decoded and resampled here with the Web Audio API. This keeps
 * heavyweight codec dependencies (ffmpeg) off the exam server.
 */

export const DICTATION_SAMPLE_RATE = 16000;

/**
 * Decode a compressed recording and resample it to mono PCM.
 * @param {Blob} blob - Recording produced by MediaRecorder.
 * @param {number} [targetRate=16000] - Output sample rate in Hz.
 * @returns {Promise<Float32Array>} Mono samples in the range [-1, 1].
 */
export async function decodeToMonoPcm(blob, targetRate = DICTATION_SAMPLE_RATE) {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  if (!AudioCtx || !OfflineCtx) {
    throw new Error('Web Audio API is unavailable in this browser.');
  }

  const encoded = await blob.arrayBuffer();
  const decodeCtx = new AudioCtx();
  let decoded;
  try {
    decoded = await decodeCtx.decodeAudioData(encoded);
  } finally {
    decodeCtx.close().catch(() => {});
  }

  // Rendering through a single-channel OfflineAudioContext both downmixes
  // to mono and resamples to the target rate.
  const frameCount = Math.max(1, Math.ceil(decoded.duration * targetRate));
  const offline = new OfflineCtx(1, frameCount, targetRate);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start(0);
  const rendered = await offline.startRendering();
  return rendered.getChannelData(0);
}

/**
 * Encode mono float samples as a 16-bit PCM WAV file.
 * @param {Float32Array} samples - Mono samples in the range [-1, 1].
 * @param {number} [sampleRate=16000] - Sample rate of `samples` in Hz.
 * @returns {Blob} `audio/wav` blob.
 */
export function encodeWav(samples, sampleRate = DICTATION_SAMPLE_RATE) {
  const bytesPerSample = 2;
  const dataSize = samples.length * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset, text) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // audio format: PCM
  view.setUint16(22, 1, true); // channels: mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * bytesPerSample, true); // byte rate
  view.setUint16(32, bytesPerSample, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++, offset += 2) {
    const clamped = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Convert a MediaRecorder recording into a server-ready 16 kHz mono WAV blob.
 * @param {Blob} blob - Recording produced by MediaRecorder.
 * @returns {Promise<Blob>} `audio/wav` blob.
 */
export async function recordingToWav(blob) {
  const samples = await decodeToMonoPcm(blob, DICTATION_SAMPLE_RATE);
  return encodeWav(samples, DICTATION_SAMPLE_RATE);
}
