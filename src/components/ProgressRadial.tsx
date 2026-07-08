import { cn } from '../lib/utils';
import { useEffect, useState } from 'react';

interface ProgressRadialProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  colorClass?: string;
  label: string;
}

export function ProgressRadial({ 
  progress, 
  size = 180, 
  strokeWidth = 16,
  colorClass = 'text-gold',
  label
}: ProgressRadialProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    // Micro-animation for filling the gauge
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (animatedProgress / 100) * circumference;

  return (
    <div className="relative flex flex-col items-center justify-center group hover:-translate-y-1 transition-transform duration-300">
      <svg
        className="transform -rotate-90 transition-all duration-1000 ease-out drop-shadow-md"
        width={size}
        height={size}
      >
        {/* Background circle */}
        <circle
          className="text-gray-100"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress circle */}
        <circle
          className={cn("transition-all duration-1000 ease-out", colorClass)}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center text content */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-4xl font-mono font-bold text-navy">
          {Math.round(animatedProgress)}%
        </span>
      </div>
      <p className="mt-4 text-sm font-semibold text-gray-600 uppercase tracking-wider">{label}</p>
    </div>
  );
}
