import { useState, useCallback } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { Keyboard } from './components/Keyboard';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import './App.css';

function App() {
  const { resumeContext, startNote, stopNote, getAnalyser } = useAudioEngine();
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [activeFrequencies, setActiveFrequencies] = useState<number[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [vizMode, setVizMode] = useState<'static' | 'live'>('static');

  const handleStart = async () => {
    await resumeContext();
    setIsStarted(true);
  };

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
        <p className="subtitle">Learn music synthesis by creating sound</p>
      </header>

      {!isStarted ? (
        <button className="start-button" onClick={handleStart}>
          Click to Start
        </button>
      ) : (
        <main className="main">
          <div className="viz-controls">
            <button
              className={`viz-toggle ${vizMode === 'static' ? 'active' : ''}`}
              onClick={() => setVizMode('static')}
            >
              Static
            </button>
            <button
              className={`viz-toggle ${vizMode === 'live' ? 'active' : ''}`}
              onClick={() => setVizMode('live')}
            >
              Live
            </button>
          </div>
          <WaveformVisualizer
            frequencies={activeFrequencies}
            getAnalyser={getAnalyser}
            mode={vizMode}
          />
          <Keyboard
            onNoteStart={handleNoteStart}
            onNoteStop={handleNoteStop}
            activeNotes={activeNotes}
          />
          <div className="instructions">
            <p>Use your keyboard (A-K for white keys, W-U for black keys) or click/tap the keys</p>
          </div>
        </main>
      )}
    </div>
  );
}

export default App;
