import { useRef, useEffect, useCallback } from 'react';

interface ActiveOscillator {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export function useAudioEngine() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const activeOscillators = useRef<Map<string, ActiveOscillator>>(new Map());

  // Initialize audio context on mount (client-side only)
  useEffect(() => {
    // Guard against SSR - only run in browser
    if (typeof window === 'undefined') return;

    const ctx = new AudioContext();
    audioContextRef.current = ctx;

    // Create analyser node for visualization
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.connect(ctx.destination);
    analyserRef.current = analyser;

    return () => {
      // Cleanup: stop all oscillators and close context
      activeOscillators.current.forEach(({ oscillator }) => {
        oscillator.stop();
      });
      activeOscillators.current.clear();
      ctx.close();
    };
  }, []);

  // Resume audio context (required after user interaction)
  const resumeContext = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      await audioContextRef.current.resume();
    }
  }, []);

  // Start a note at a given frequency
  const startNote = useCallback((noteId: string, frequency: number) => {
    const ctx = audioContextRef.current;
    const analyser = analyserRef.current;
    if (!ctx || !analyser) return;

    // Don't restart if already playing
    if (activeOscillators.current.has(noteId)) return;

    // Create oscillator
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Create gain node for envelope
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    // Attack: ramp up quickly
    gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.02);

    // Connect: oscillator -> gain -> analyser -> destination
    oscillator.connect(gainNode);
    gainNode.connect(analyser);

    oscillator.start();
    activeOscillators.current.set(noteId, { oscillator, gainNode });
  }, []);

  // Stop a note
  const stopNote = useCallback((noteId: string) => {
    const ctx = audioContextRef.current;
    const active = activeOscillators.current.get(noteId);
    if (!ctx || !active) return;

    const { oscillator, gainNode } = active;

    // Release: ramp down to prevent click
    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

    // Stop oscillator after release
    oscillator.stop(ctx.currentTime + 0.1);
    activeOscillators.current.delete(noteId);
  }, []);

  // Get analyser for visualization
  const getAnalyser = useCallback(() => analyserRef.current, []);

  return {
    resumeContext,
    startNote,
    stopNote,
    getAnalyser,
  };
}
