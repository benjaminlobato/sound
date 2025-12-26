import { useRef, useEffect, useState } from 'react';
import { Module } from './Module';
import './PondVisualizer.css';

interface PondVisualizerProps {
  frequencies: number[];
}

const GRID_WIDTH = 400;
const GRID_HEIGHT = 150;
const DAMPING = 0.99;
const WAVE_SPEED = 0.5;

export function PondVisualizer({ frequencies }: PondVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationIdRef = useRef<number | null>(null);
  const currentRef = useRef<Float32Array | null>(null);
  const previousRef = useRef<Float32Array | null>(null);
  const timeRef = useRef(0);
  const [isRunning, setIsRunning] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize grids
    if (!currentRef.current) {
      currentRef.current = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
      previousRef.current = new Float32Array(GRID_WIDTH * GRID_HEIGHT);
    }

    const current = currentRef.current;
    const previous = previousRef.current!;

    // Set canvas size to match container
    const container = canvas.parentElement;
    const containerWidth = container?.clientWidth || 600;
    canvas.width = containerWidth;
    canvas.height = Math.floor(containerWidth * (GRID_HEIGHT / GRID_WIDTH));

    const imageData = ctx.createImageData(GRID_WIDTH, GRID_HEIGHT);

    const simulate = () => {
      if (!isRunning) {
        animationIdRef.current = requestAnimationFrame(simulate);
        return;
      }

      timeRef.current += 1 / 60;

      // Apply disturbances from active frequencies
      const centerX = Math.floor(GRID_WIDTH / 2);
      const centerY = Math.floor(GRID_HEIGHT / 2);

      frequencies.forEach((freq, index) => {
        // Spread multiple notes in a small area around center
        const angle = (index / Math.max(frequencies.length, 1)) * Math.PI * 2;
        const radius = frequencies.length > 1 ? 10 : 0;
        const x = Math.floor(centerX + Math.cos(angle) * radius);
        const y = Math.floor(centerY + Math.sin(angle) * radius);

        // Create oscillating disturbance based on frequency
        const amplitude = 2.0;
        const value = Math.sin(timeRef.current * freq * 0.05) * amplitude;

        // Apply to a small area for smoother waves
        for (let dy = -2; dy <= 2; dy++) {
          for (let dx = -2; dx <= 2; dx++) {
            const px = x + dx;
            const py = y + dy;
            if (px >= 0 && px < GRID_WIDTH && py >= 0 && py < GRID_HEIGHT) {
              const dist = Math.sqrt(dx * dx + dy * dy);
              const falloff = Math.max(0, 1 - dist / 3);
              current[py * GRID_WIDTH + px] += value * falloff;
            }
          }
        }
      });

      // Wave equation simulation
      const next = new Float32Array(GRID_WIDTH * GRID_HEIGHT);

      for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
          const i = y * GRID_WIDTH + x;

          // Laplacian (sum of neighbors minus 4 times center)
          const laplacian =
            current[i - 1] +
            current[i + 1] +
            current[i - GRID_WIDTH] +
            current[i + GRID_WIDTH] -
            4 * current[i];

          // Wave equation: next = 2*current - previous + c²*laplacian
          next[i] = (2 * current[i] - previous[i] + WAVE_SPEED * WAVE_SPEED * laplacian) * DAMPING;
        }
      }

      // Swap buffers
      previous.set(current);
      current.set(next);

      // Render to canvas with lighting
      // Light direction (from top-left)
      const lightX = -0.7;
      const lightY = -0.7;
      const lightZ = 1.0;
      const lightLen = Math.sqrt(lightX * lightX + lightY * lightY + lightZ * lightZ);
      const lx = lightX / lightLen;
      const ly = lightY / lightLen;
      const lz = lightZ / lightLen;

      for (let y = 1; y < GRID_HEIGHT - 1; y++) {
        for (let x = 1; x < GRID_WIDTH - 1; x++) {
          const i = y * GRID_WIDTH + x;

          // Calculate gradient (surface normal)
          const dx = (current[i + 1] - current[i - 1]) * 2;
          const dy = (current[i + GRID_WIDTH] - current[i - GRID_WIDTH]) * 2;

          // Normal vector (pointing up, tilted by gradient)
          const nx = -dx;
          const ny = -dy;
          const nz = 1.0;
          const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);

          // Diffuse lighting (dot product of normal and light)
          const diffuse = Math.max(0, (nx * lx + ny * ly + nz * lz) / nLen);

          // Specular highlight (simplified - based on how aligned normal is with view)
          const specular = Math.pow(Math.max(0, nz / nLen), 20) * diffuse * 0.8;

          // Base water color (deeper blue-green)
          const baseR = 20;
          const baseG = 60;
          const baseB = 120;

          // Apply lighting
          const r = Math.min(255, Math.floor(baseR + diffuse * 60 + specular * 255));
          const g = Math.min(255, Math.floor(baseG + diffuse * 100 + specular * 255));
          const b = Math.min(255, Math.floor(baseB + diffuse * 80 + specular * 200));

          const pi = i * 4;
          imageData.data[pi] = r;
          imageData.data[pi + 1] = g;
          imageData.data[pi + 2] = b;
          imageData.data[pi + 3] = 255;
        }
      }

      // Fill edges
      for (let x = 0; x < GRID_WIDTH; x++) {
        const topI = x * 4;
        const bottomI = ((GRID_HEIGHT - 1) * GRID_WIDTH + x) * 4;
        imageData.data[topI] = 20;
        imageData.data[topI + 1] = 60;
        imageData.data[topI + 2] = 120;
        imageData.data[topI + 3] = 255;
        imageData.data[bottomI] = 20;
        imageData.data[bottomI + 1] = 60;
        imageData.data[bottomI + 2] = 120;
        imageData.data[bottomI + 3] = 255;
      }
      for (let y = 0; y < GRID_HEIGHT; y++) {
        const leftI = (y * GRID_WIDTH) * 4;
        const rightI = (y * GRID_WIDTH + GRID_WIDTH - 1) * 4;
        imageData.data[leftI] = 20;
        imageData.data[leftI + 1] = 60;
        imageData.data[leftI + 2] = 120;
        imageData.data[leftI + 3] = 255;
        imageData.data[rightI] = 20;
        imageData.data[rightI + 1] = 60;
        imageData.data[rightI + 2] = 120;
        imageData.data[rightI + 3] = 255;
      }

      // Scale up the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = GRID_WIDTH;
      tempCanvas.height = GRID_HEIGHT;
      const tempCtx = tempCanvas.getContext('2d')!;
      tempCtx.putImageData(imageData, 0, 0);

      ctx.imageSmoothingEnabled = true;
      ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);

      animationIdRef.current = requestAnimationFrame(simulate);
    };

    simulate();

    return () => {
      if (animationIdRef.current !== null) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, [frequencies, isRunning]);

  const handleClear = () => {
    if (currentRef.current && previousRef.current) {
      currentRef.current.fill(0);
      previousRef.current.fill(0);
    }
  };

  return (
    <Module title="Pond" defaultExpanded={true}>
      <div className="pond-controls">
        <button
          className={isRunning ? 'active' : ''}
          onClick={() => setIsRunning(!isRunning)}
        >
          {isRunning ? 'Pause' : 'Play'}
        </button>
        <button onClick={handleClear}>
          Clear
        </button>
      </div>
      <div className="pond-container">
        <canvas ref={canvasRef} className="pond-canvas" />
      </div>
    </Module>
  );
}
