'use client';

import React, { useRef, useEffect, useState } from 'react';

interface CanvasRulerProps {
  zoom: number;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  orientation: 'horizontal' | 'vertical';
  rulerSize?: number;
}

export function CanvasRuler({ zoom, scrollRef, orientation, rulerSize = 20 }: CanvasRulerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollPos, setScrollPos] = useState(0);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      setScrollPos(orientation === 'horizontal' ? el.scrollLeft : el.scrollTop);
    };
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [scrollRef, orientation]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const parent = canvas.parentElement;
    const length = orientation === 'horizontal' ? parent?.clientWidth || 800 : parent?.clientHeight || 600;
    const dpr = window.devicePixelRatio || 1;

    if (orientation === 'horizontal') {
      canvas.width = length * dpr;
      canvas.height = rulerSize * dpr;
      canvas.style.width = `${length}px`;
      canvas.style.height = `${rulerSize}px`;
    } else {
      canvas.width = rulerSize * dpr;
      canvas.height = length * dpr;
      canvas.style.width = `${rulerSize}px`;
      canvas.style.height = `${length}px`;
    }

    ctx.scale(dpr, dpr);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, orientation === 'horizontal' ? length : rulerSize, orientation === 'horizontal' ? rulerSize : length);

    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#6b7280';
    ctx.font = '9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const step = 100 * zoom;
    const offset = -scrollPos % step;

    if (orientation === 'horizontal') {
      for (let x = offset; x < length; x += step) {
        const worldX = Math.round((x + scrollPos) / zoom);
        ctx.beginPath();
        ctx.moveTo(x, rulerSize - 8);
        ctx.lineTo(x, rulerSize);
        ctx.stroke();
        ctx.fillText(String(worldX), x, rulerSize / 2 - 2);

        for (let i = 1; i < 5; i++) {
          const subX = x + (step / 5) * i;
          if (subX < length) {
            ctx.beginPath();
            ctx.moveTo(subX, rulerSize - 4);
            ctx.lineTo(subX, rulerSize);
            ctx.stroke();
          }
        }
      }
    } else {
      ctx.textAlign = 'left';
      for (let y = offset; y < length; y += step) {
        const worldY = Math.round((y + scrollPos) / zoom);
        ctx.beginPath();
        ctx.moveTo(rulerSize - 8, y);
        ctx.lineTo(rulerSize, y);
        ctx.stroke();

        ctx.save();
        ctx.translate(rulerSize / 2 - 2, y);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(String(worldY), 0, 0);
        ctx.restore();

        for (let i = 1; i < 5; i++) {
          const subY = y + (step / 5) * i;
          if (subY < length) {
            ctx.beginPath();
            ctx.moveTo(rulerSize - 4, subY);
            ctx.lineTo(rulerSize, subY);
            ctx.stroke();
          }
        }
      }
    }
  }, [zoom, scrollPos, orientation, rulerSize]);

  if (orientation === 'horizontal') {
    return (
      <div className="h-5 bg-neutral-800 border-b border-neutral-700 relative overflow-hidden" style={{ marginLeft: rulerSize }}>
        <canvas ref={canvasRef} />
      </div>
    );
  }

  return (
    <div className="w-5 bg-neutral-800 border-r border-neutral-700 relative overflow-hidden" style={{ marginTop: rulerSize }}>
      <canvas ref={canvasRef} className="absolute top-0 left-0" />
    </div>
  );
}
