/**
 * Calculate the duration of an audio file in seconds
 */
export const getAudioDuration = (file: File): Promise<number> => {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    const url = URL.createObjectURL(file);

    audio.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(Math.round(audio.duration));
    });

    audio.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load audio file'));
    });

    audio.src = url;
  });
};

/**
 * Format duration in seconds to MM:SS format
 */
export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
