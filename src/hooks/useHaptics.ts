export function useHaptics() {
  const trigger = (pattern: number | number[] = 15) => {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Safe fallback if permission denied
      }
    }
  };

  return {
    light: () => trigger(10),
    medium: () => trigger(25),
    heavy: () => trigger(45),
    success: () => trigger([15, 50, 20]),
    warning: () => trigger([30, 80, 30]),
    error: () => trigger([40, 60, 40, 60, 40]),
  };
}
