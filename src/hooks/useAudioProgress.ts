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
  const [autoAdvanceEnabled, setAutoAdvanceEnabled] = useState(false);

  const storageKey = `audioGuide_${guideId}_progress`;
  const settingsKey = `audioGuide_settings`;

  // Load progress from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const progress: AudioProgress = JSON.parse(stored);
        setCompletedChapters(progress.completedChapters || []);
      }

      const settings = localStorage.getItem(settingsKey);
      if (settings) {
        const parsedSettings = JSON.parse(settings);
        setAutoAdvanceEnabled(parsedSettings.autoAdvanceEnabled || false);
      }
    } catch (error) {
      console.error('Error loading audio progress:', error);
    }
  }, [storageKey, settingsKey]);

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

  // Update auto-advance preference
  const setAutoAdvance = (enabled: boolean) => {
    setAutoAdvanceEnabled(enabled);
    try {
      const settings = {
        autoAdvanceEnabled: enabled
      };
      localStorage.setItem(settingsKey, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  return {
    completedChapters,
    autoAdvanceEnabled,
    markChapterCompleted,
    isChapterCompleted,
    setAutoAdvance
  };
};