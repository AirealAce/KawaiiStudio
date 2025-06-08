import React from 'react';

interface AudioVisualizerProps {
  audioLevel: number;
  isActive: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioLevel,
  isActive,
}) => {
  const bars = Array.from({ length: 8 }, (_, i) => {
    const height = isActive ? Math.max(10, audioLevel * 100 * (Math.random() * 0.5 + 0.5)) : 10;
    return (
      <div
        key={i}
        className={`w-2 bg-gradient-to-t from-kawaii-pink-500 to-kawaii-purple-400 rounded-full transition-all duration-150 ${
          isActive ? 'animate-pulse-pink' : 'opacity-30'
        }`}
        style={{ height: `${height}%` }}
      />
    );
  });

  return (
    <div className="relative bg-white/20 backdrop-blur-kawaii rounded-2xl p-6 border-2 border-kawaii-pink-300 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-kawaii font-bold text-kawaii-purple-800 flex items-center gap-2">
          <span className="text-xl">🎤</span>
          Microphone
        </h3>
        <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
      </div>
      
      <div className="flex items-end justify-center space-x-1 h-20">
        {bars}
      </div>
      
      <div className="mt-4 text-center">
        <p className="font-kawaii text-sm text-kawaii-purple-600">
          {isActive ? `Level: ${Math.round(audioLevel * 100)}% 💖` : 'Click to activate! ✨'}
        </p>
      </div>
    </div>
  );
};