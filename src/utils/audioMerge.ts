/**
 * Get duration of an audio file or blob using HTMLAudioElement.
 */
export function getAudioDuration(source: File | Blob): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const url = URL.createObjectURL(source);
    audio.addEventListener('loadedmetadata', () => {
      resolve(Math.round(audio.duration));
      URL.revokeObjectURL(url);
    });
    audio.addEventListener('error', () => {
      resolve(0);
      URL.revokeObjectURL(url);
    });
    audio.src = url;
  });
}

/**
 * Merge multiple audio files (MP3) into a single blob by binary concatenation.
 * MP3 is a frame-based format — each frame is independently decodable,
 * so concatenating raw bytes produces a valid playable file.
 * Works perfectly for speech audio (no audible glitch at join points).
 *
 * @param files - Array of File objects (MP3s) in playback order
 * @returns Merged blob + total duration in seconds
 */
export async function mergeAudioFiles(files: File[]): Promise<{ blob: Blob; duration: number }> {
  // Single file — no merge needed
  if (files.length === 1) {
    const duration = await getAudioDuration(files[0]);
    return { blob: files[0], duration };
  }

  // Read all files as ArrayBuffer
  const buffers = await Promise.all(files.map(f => f.arrayBuffer()));

  // Concatenate binary data
  const totalLength = buffers.reduce((sum, b) => sum + b.byteLength, 0);
  const merged = new Uint8Array(totalLength);
  let offset = 0;
  for (const buf of buffers) {
    merged.set(new Uint8Array(buf), offset);
    offset += buf.byteLength;
  }

  const blob = new Blob([merged], { type: 'audio/mpeg' });
  const duration = await getAudioDuration(blob);
  return { blob, duration };
}
