import { useState, useCallback, useRef, useEffect } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { Keyboard } from './components/Keyboard';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import { PondVisualizer } from './components/PondVisualizer';
import { ADSRControls, type ADSRValues } from './components/ADSRControls';
import './App.css';

const DEFAULT_ADSR: ADSRValues = {
  attack: 0.02,
  decay: 0.1,
  sustain: 0.7,
  release: 0.3,
};

function App() {
  const [adsr, setAdsr] = useState<ADSRValues>(DEFAULT_ADSR);
  const adsrRef = useRef<ADSRValues>(DEFAULT_ADSR);

  // Keep ref in sync with state
  useEffect(() => {
    adsrRef.current = adsr;
  }, [adsr]);

  const { resumeContext, startNote, stopNote, getAnalyser } = useAudioEngine(adsrRef);
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [activeFrequencies, setActiveFrequencies] = useState<number[]>([]);

  const handleNoteStart = useCallback(
    (noteId: string, frequency: number) => {
      resumeContext();
      startNote(noteId, frequency);
      setActiveNotes((prev) => new Set(prev).add(noteId));
      setActiveFrequencies((prev) => [...prev, frequency]);
    },
    [resumeContext, startNote]
  );

  const handleNoteStop = useCallback(
    (noteId: string, frequency: number) => {
      stopNote(noteId);
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
      });
      setActiveFrequencies((prev) => {
        const idx = prev.indexOf(frequency);
        if (idx > -1) {
          const next = [...prev];
          next.splice(idx, 1);
          return next;
        }
        return prev;
      });
    },
    [stopNote]
  );

  return (
    <div className="app">
      <header className="header">
        <h1>Sound Lab</h1>
      </header>

      <main className="main">
        <WaveformVisualizer
          frequencies={activeFrequencies}
          getAnalyser={getAnalyser}
        />
        <PondVisualizer frequencies={activeFrequencies} />
        <ADSRControls values={adsr} onChange={setAdsr} />
        <Keyboard
          onNoteStart={handleNoteStart}
          onNoteStop={handleNoteStop}
          activeNotes={activeNotes}
        />
        <div className="instructions">
          <p>Use your keyboard (A-K for white keys, W-U for black keys) or click/tap the keys</p>
        </div>
      </main>
    </div>
  );
}

export default App;
