/**
 * Haptic feedback utilities for iOS-like touch interactions
 * Falls back gracefully on unsupported devices
 */

export const haptics = {
  light: () => {
    if (navigator.vibrate) {
      navigator.vibrate(10);
    }
  },
  
  medium: () => {
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  },
  
  heavy: () => {
    if (navigator.vibrate) {
      navigator.vibrate(30);
    }
  },
  
  selection: () => {
    if (navigator.vibrate) {
      navigator.vibrate(5);
    }
  },
  
  success: () => {
    if (navigator.vibrate) {
      navigator.vibrate([10, 50, 10]);
    }
  },
  
  error: () => {
    if (navigator.vibrate) {
      navigator.vibrate([20, 100, 20]);
    }
  }
};
