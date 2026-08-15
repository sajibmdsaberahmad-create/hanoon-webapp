'use client';

import { useEffect, useState } from 'react';

/**
 * CandleChart — simple lightweight candlestick chart component.
 * Uses SVG for rendering, no external dependencies.
 */

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  ts: number;
}

interface CandleChartProps {
  data: Candle[];
  height?: number;
  width?: number;
  symbol?: string;
}

export function CandleChart({ data, height = 150, width = 400, symbol }: CandleChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-hanoon-text-dim text-xs">
        No chart data
      </div>
    );
  }

  const [dimensions, setDimensions] = useState({ width, height });

  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById(`candle-${symbol || 'chart'}`);
      if (container) {
        setDimensions({
          width: container.clientWidth,
          height: Math.min(container.clientWidth * 0.5, height),
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [symbol, height]);

  const { width: w, height: h } = dimensions;
  const padding = 4;
  const bodyWidth = (w - padding * 2) / data.length - 1;

  const allHighs = data.map((d) => d.high);
  const allLows = data.map((d) => d.low);
  const maxPrice = Math.max(...allHighs);
  const minPrice = Math.min(...allLows);
  const priceRange = maxPrice - minPrice || 1;

  const scaleY = (price: number) =>
    h - ((price - minPrice) / priceRange) * (h - padding * 2) + padding;

  return (
    <div
      id={`candle-${symbol || 'chart'}`}
      className="w-full bg-hanoon-bg rounded border border-hanoon-border"
    >
      <svg width={w} height={h}>
        {data.map((candle, i) => {
          const x = padding + i * ((w - padding * 2) / data.length);
          const openY = scaleY(candle.open);
          const closeY = scaleY(candle.close);
          const highY = scaleY(candle.high);
          const lowY = scaleY(candle.low);
          const isGreen = candle.close >= candle.open;
          const color = isGreen ? '#00e676' : '#ff4466';
          const bodyTop = Math.min(openY, closeY);
          const bodyHeight = Math.abs(openY - closeY) || 1;

          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={x + bodyWidth / 2}
                y1={highY}
                x2={x + bodyWidth / 2}
                y2={lowY}
                stroke={color}
                strokeWidth={1}
              />
              {/* Body */}
              <rect
                x={x}
                y={bodyTop}
                width={bodyWidth}
                height={bodyHeight}
                fill={color}
                fillOpacity={isGreen ? 0.7 : 0.7}
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
}
