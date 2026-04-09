import { useState, useEffect } from 'react';

interface AudioProgress {
  completedChapters: number[];
  lastPlayed: number;
  timestamp: number;
}

interface UseAudioProgressProps {
  guideId: string;
}

export const useAudioProgress = ({ guideId }: UseAudioProgressProps) => {
  const [completedChapters, setCompletedChapters] = useState<number[]>([]);

  const storageKey = `audioGuide_${guideId}_progress`;

  // Load progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const progress: AudioProgress = JSON.parse(stored);
        setCompletedChapters(progress.completedChapters || []);
      }
    } catch (error) {
      console.error('Error loading audio progress:', error);
    }
  }, [storageKey]);

  // Mark chapter as completed
  const markChapterCompleted = (chapterIndex: number) => {
    if (!completedChapters.includes(chapterIndex)) {
      const newCompleted = [...completedChapters, chapterIndex];
      setCompletedChapters(newCompleted);
      
      try {
        const progress: AudioProgress = {
          completedChapters: newCompleted,
          lastPlayed: chapterIndex,
          timestamp: Date.now()
        };
        localStorage.setItem(storageKey, JSON.stringify(progress));
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  };

  // Check if chapter is completed
  const isChapterCompleted = (chapterIndex: number) => {
    return completedChapters.includes(chapterIndex);
  };

  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(true);

  return {
    completedChapters,
    autoAdvanceEnabled,
    markChapterCompleted,
    isChapterCompleted,
    setAutoAdvance: setAutoAdvanceEnabled,
  };
};