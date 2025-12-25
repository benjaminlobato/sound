import { useEffect, useCallback } from 'react';
import './Keyboard.css';

// Note frequencies for one octave starting at C4 (Middle C)
const NOTES = [
  { note: 'C4', frequency: 261.63, key: 'a', isBlack: false },
  { note: 'C#4', frequency: 277.18, key: 'w', isBlack: true },
  { note: 'D4', frequency: 293.66, key: 's', isBlack: false },
  { note: 'D#4', frequency: 311.13, key: 'e', isBlack: true },
  { note: 'E4', frequency: 329.63, key: 'd', isBlack: false },
  { note: 'F4', frequency: 349.23, key: 'f', isBlack: false },
  { note: 'F#4', frequency: 369.99, key: 't', isBlack: true },
  { note: 'G4', frequency: 392.0, key: 'g', isBlack: false },
  { note: 'G#4', frequency: 415.3, key: 'y', isBlack: true },
  { note: 'A4', frequency: 440.0, key: 'h', isBlack: false },
  { note: 'A#4', frequency: 466.16, key: 'u', isBlack: true },
  { note: 'B4', frequency: 493.88, key: 'j', isBlack: false },
  { note: 'C5', frequency: 523.25, key: 'k', isBlack: false },
];

interface KeyboardProps {
  onNoteStart: (noteId: string, frequency: number) => void;
  onNoteStop: (noteId: string, frequency: number) => void;
  activeNotes: Set<string>;
}

export function Keyboard({ onNoteStart, onNoteStop, activeNotes }: KeyboardProps) {
  // Handle keyboard input
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.repeat) return;
      const note = NOTES.find((n) => n.key === e.key.toLowerCase());
      if (note) {
        onNoteStart(note.note, note.frequency);
      }
    },
    [onNoteStart]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const note = NOTES.find((n) => n.key === e.key.toLowerCase());
      if (note) {
        onNoteStop(note.note, note.frequency);
      }
    },
    [onNoteStop]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Separate white and black keys for proper rendering
  const whiteKeys = NOTES.filter((n) => !n.isBlack);
  const blackKeys = NOTES.filter((n) => n.isBlack);

  // Calculate black key positions based on white key index
  const getBlackKeyPosition = (note: string) => {
    const positions: Record<string, number> = {
      'C#4': 0,
      'D#4': 1,
      'F#4': 3,
      'G#4': 4,
      'A#4': 5,
    };
    return positions[note] ?? 0;
  };

  return (
    <div className="keyboard">
      <div className="keys-container">
        {/* White keys */}
        {whiteKeys.map((note) => (
          <button
            key={note.note}
            className={`key white-key ${activeNotes.has(note.note) ? 'active' : ''}`}
            onMouseDown={() => onNoteStart(note.note, note.frequency)}
            onMouseUp={() => onNoteStop(note.note, note.frequency)}
            onMouseLeave={() => onNoteStop(note.note, note.frequency)}
            onTouchStart={(e) => {
              e.preventDefault();
              onNoteStart(note.note, note.frequency);
            }}
            onTouchEnd={() => onNoteStop(note.note, note.frequency)}
          >
            <span className="key-label">{note.note}</span>
            <span className="key-hint">{note.key.toUpperCase()}</span>
          </button>
        ))}
        {/* Black keys overlay */}
        {blackKeys.map((note) => (
          <button
            key={note.note}
            className={`key black-key ${activeNotes.has(note.note) ? 'active' : ''}`}
            style={{
              left: `calc(${getBlackKeyPosition(note.note)} * (100% / 8) + (100% / 8) - 20px)`,
            }}
            onMouseDown={() => onNoteStart(note.note, note.frequency)}
            onMouseUp={() => onNoteStop(note.note, note.frequency)}
            onMouseLeave={() => onNoteStop(note.note, note.frequency)}
            onTouchStart={(e) => {
              e.preventDefault();
              onNoteStart(note.note, note.frequency);
            }}
            onTouchEnd={() => onNoteStop(note.note, note.frequency)}
          >
            <span className="key-hint">{note.key.toUpperCase()}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
