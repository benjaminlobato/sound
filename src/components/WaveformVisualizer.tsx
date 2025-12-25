import { useRef, useEffect, useState } from 'react';
import { Module } from './Module';
import './WaveformVisualizer.css';

interface WaveformVisualizerProps {
  frequencies: number[];
  getAnalyser: () => AnalyserNode | null;
}

export function WaveformVisualizer({ frequencies, getAnalyser }: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const [mode, setMode] = useState<'static' | 'live'>('static');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const drawGrid = (width: number, height: number) => {
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      for (let i = 0; i < 10; i++) {
        const x = (width / 10) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
    };

    const drawStatic = (width: number, height: number) => {
      if (frequencies.length > 0) {
        const duration = 0.015;
        const sampleRate = 44100;
        const samplesToShow = Math.floor(duration * sampleRate);

        ctx.beginPath();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10;

        const sliceWidth = width / samplesToShow;

        for (let i = 0; i < samplesToShow; i++) {
          const t = i / sampleRate;

          let value = 0;
          for (const freq of frequencies) {
            value += Math.sin(2 * Math.PI * freq * t);
          }
          value /= frequencies.length;

          const y = height / 2 - value * height * 0.35;
          const x = i * sliceWidth;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        drawFlatLine(width, height);
      }
    };

    const drawLive = (width: number, height: number) => {
      const analyser = getAnalyser();

      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteTimeDomainData(dataArray);

        ctx.beginPath();
        ctx.strokeStyle = '#a855f7';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#a855f7';
        ctx.shadowBlur = 10;

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        drawFlatLine(width, height);
      }
    };

    const drawFlatLine = (width: number, height: number) => {
      ctx.beginPath();
      ctx.strokeStyle = '#4a4a5a';
      ctx.lineWidth = 2;
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
    };

    const draw = () => {
      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.fillStyle = '#0f0f1a';
      ctx.fillRect(0, 0, width, height);

      drawGrid(width, height);

      if (mode === 'static') {
        drawStatic(width, height);
      } else {
        drawLive(width, height);
      }

      animationIdRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [frequencies, getAnalyser, mode]);

  return (
    <Module title="Waveform">
      <div className="visualizer-controls">
        <button
          className={mode === 'static' ? 'active' : ''}
          onClick={() => setMode('static')}
        >
          Static
        </button>
        <button
          className={mode === 'live' ? 'active' : ''}
          onClick={() => setMode('live')}
        >
          Live
        </button>
      </div>
      <div className="visualizer-container">
        <canvas ref={canvasRef} className="waveform-canvas" />
      </div>
    </Module>
  );
}
