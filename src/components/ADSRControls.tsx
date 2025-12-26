import { Module } from './Module';
import './ADSRControls.css';

export interface ADSRValues {
  attack: number;
  decay: number;
  sustain: number;
  release: number;
}

interface ADSRControlsProps {
  values: ADSRValues;
  onChange: (values: ADSRValues) => void;
}

export function ADSRControls({ values, onChange }: ADSRControlsProps) {
  const handleChange = (param: keyof ADSRValues, value: number) => {
    onChange({ ...values, [param]: value });
  };

  return (
    <Module title="ADSR Envelope">
      <div className="adsr-controls">
        <div className="adsr-slider">
          <label>
            <span className="adsr-label">Attack</span>
            <span className="adsr-value">{values.attack.toFixed(2)}s</span>
          </label>
          <input
            type="range"
            min="0.01"
            max="2"
            step="0.01"
            value={values.attack}
            onChange={(e) => handleChange('attack', parseFloat(e.target.value))}
          />
        </div>

        <div className="adsr-slider">
          <label>
            <span className="adsr-label">Decay</span>
            <span className="adsr-value">{values.decay.toFixed(2)}s</span>
          </label>
          <input
            type="range"
            min="0.01"
            max="2"
            step="0.01"
            value={values.decay}
            onChange={(e) => handleChange('decay', parseFloat(e.target.value))}
          />
        </div>

        <div className="adsr-slider">
          <label>
            <span className="adsr-label">Sustain</span>
            <span className="adsr-value">{Math.round(values.sustain * 100)}%</span>
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={values.sustain}
            onChange={(e) => handleChange('sustain', parseFloat(e.target.value))}
          />
        </div>

        <div className="adsr-slider">
          <label>
            <span className="adsr-label">Release</span>
            <span className="adsr-value">{values.release.toFixed(2)}s</span>
          </label>
          <input
            type="range"
            min="0.01"
            max="3"
            step="0.01"
            value={values.release}
            onChange={(e) => handleChange('release', parseFloat(e.target.value))}
          />
        </div>
      </div>
    </Module>
  );
}
