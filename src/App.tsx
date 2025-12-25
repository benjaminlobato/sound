import { useState, useCallback } from 'react';
import { useAudioEngine } from './hooks/useAudioEngine';
import { Keyboard } from './components/Keyboard';
import { WaveformVisualizer } from './components/WaveformVisualizer';
import './App.css';

function App() {
  const { resumeContext, startNote, stopNote, getAnalyser } = useAudioEngine();
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set());
  const [isStarted, setIsStarted] = useState(false);

  const handleStart = async () => {
    await resumeContext();
    setIsStarted(true);
  };

  const handleNoteStart = useCallback(
    (noteId: string, frequency: number) => {
      resumeContext();
      startNote(noteId, frequency);
      setActiveNotes((prev) => new Set(prev).add(noteId));
    },
    [resumeContext, startNote]
  );

  const handleNoteStop = useCallback(
    (noteId: string) => {
      stopNote(noteId);
      setActiveNotes((prev) => {
        const next = new Set(prev);
        next.delete(noteId);
        return next;
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
          <WaveformVisualizer getAnalyser={getAnalyser} />
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
