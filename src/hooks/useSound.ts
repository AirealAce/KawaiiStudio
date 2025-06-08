import { useCallback } from 'react';
import { Howl } from 'howler';

interface SoundEffects {
  playHover: () => void;
  playClick: () => void;
  playSuccess: () => void;
  playError: () => void;
  playNotification: () => void;
}

const createSoundEffect = (frequency: number, duration: number = 200, type: OscillatorType = 'sine'): (() => void) => {
  return () => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    oscillator.frequency.value = frequency;
    oscillator.type = type;
    
    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + duration / 1000);
    
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + duration / 1000);
  };
};

export const useSound = (): SoundEffects => {
  const playHover = useCallback(createSoundEffect(800, 100, 'sine'), []);
  const playClick = useCallback(createSoundEffect(1000, 150, 'triangle'), []);
  const playSuccess = useCallback(() => {
    const context = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    // Play a cute success melody
    [523, 659, 784].forEach((freq, index) => {
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      
      oscillator.frequency.value = freq;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.1, context.currentTime + index * 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + index * 0.1 + 0.2);
      
      oscillator.start(context.currentTime + index * 0.1);
      oscillator.stop(context.currentTime + index * 0.1 + 0.2);
    });
  }, []);
  
  const playError = useCallback(createSoundEffect(200, 300, 'square'), []);
  const playNotification = useCallback(createSoundEffect(660, 200, 'sine'), []);

  return {
    playHover,
    playClick,
    playSuccess,
    playError,
    playNotification,
  };
};