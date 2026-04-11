import { useState, useEffect } from 'react';

// Deterministic pseudo-random number from string seed
function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate a "live listeners" count for a guide
// - Deterministic: same guide + same time slot = same number
// - Changes every ~5 minutes
// - Range: 18-182
// - No API calls, no DB queries, zero performance impact
function getListenerCount(guideId: string): number {
  const timeSlot = Math.floor(Date.now() / 300000); // 5-minute slots
  const seed = `${guideId}_${timeSlot}`;
  const hash = hashCode(seed);
  return 18 + (hash % 165); // 18 to 182
}

export function useLiveListeners(guideId: string): number {
  const [count, setCount] = useState(() => getListenerCount(guideId));

  useEffect(() => {
    setCount(getListenerCount(guideId));

    // Update every 5 minutes
    const interval = setInterval(() => {
      setCount(getListenerCount(guideId));
    }, 300000);

    return () => clearInterval(interval);
  }, [guideId]);

  return count;
}
