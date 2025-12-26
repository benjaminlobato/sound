import { useRef, useEffect, useCallback, type MutableRefObject } from 'react';
import type { ADSRValues } from '../components/ADSRControls';

interface ActiveOscillator {
  oscillator: OscillatorNode;
  gainNode: GainNode;
}

export function useAudioEngine(adsrRef: MutableRefObject<ADSRValues>) {
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
    const adsr = adsrRef.current;
    if (!ctx || !analyser) return;

    // Don't restart if already playing
    if (activeOscillators.current.has(noteId)) return;

    // Create oscillator
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);

    // Create gain node for envelope
    const gainNode = ctx.createGain();
    const now = ctx.currentTime;
    const peakLevel = 0.3;
    const sustainLevel = peakLevel * adsr.sustain;

    // ADSR envelope
    gainNode.gain.setValueAtTime(0, now);
    // Attack: ramp to peak
    gainNode.gain.linearRampToValueAtTime(peakLevel, now + adsr.attack);
    // Decay: ramp to sustain level
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + adsr.attack + adsr.decay);

    // Connect: oscillator -> gain -> analyser -> destination
    oscillator.connect(gainNode);
    gainNode.connect(analyser);

    oscillator.start();
    activeOscillators.current.set(noteId, { oscillator, gainNode });
  }, [adsrRef]);

  // Stop a note
  const stopNote = useCallback((noteId: string) => {
    const ctx = audioContextRef.current;
    const active = activeOscillators.current.get(noteId);
    const adsr = adsrRef.current;
    if (!ctx || !active) return;

    const { oscillator, gainNode } = active;

    // Release: ramp down from current value
    gainNode.gain.cancelScheduledValues(ctx.currentTime);
    gainNode.gain.setValueAtTime(gainNode.gain.value, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + adsr.release);

    // Stop oscillator after release
    oscillator.stop(ctx.currentTime + adsr.release);
    activeOscillators.current.delete(noteId);
  }, [adsrRef]);

  // Get analyser for visualization
  const getAnalyser = useCallback(() => analyserRef.current, []);

  return {
    resumeContext,
    startNote,
    stopNote,
    getAnalyser,
  };
}
