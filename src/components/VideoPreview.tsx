import React, { useEffect, useRef } from 'react';
import { useFullscreen } from '../hooks/useFullscreen';
import { useSound } from '../hooks/useSound';

interface VideoPreviewProps {
  stream: MediaStream | null;
  title: string;
  emoji: string;
  isActive: boolean;
  className?: string;
  genderFilter?: 'none' | 'feminine' | 'masculine';
}

export const VideoPreview: React.FC<VideoPreviewProps> = ({
  stream,
  title,
  emoji,
  isActive,
  className = '',
  genderFilter = 'none',
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { toggleFullscreen } = useFullscreen();
  const { playClick } = useSound();

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const handleDoubleClick = () => {
    if (containerRef.current) {
      playClick();
      toggleFullscreen(containerRef.current);
    }
  };

  const getFilterIndicator = () => {
    if (title !== 'Camera' || genderFilter === 'none') return null;
    
    const filterInfo = {
      feminine: { emoji: '👩', label: 'Feminine', color: 'from-pink-400 to-purple-500' },
      masculine: { emoji: '👨', label: 'Masculine', color: 'from-blue-400 to-indigo-500' }
    };
    
    const info = filterInfo[genderFilter];
    if (!info) return null;
    
    return (
      <div className={`absolute top-16 left-4 z-10 bg-gradient-to-r ${info.color} text-white rounded-full px-3 py-1 text-xs font-kawaii font-semibold animate-pulse shadow-lg`}>
        <span className="flex items-center gap-1">
          <span>{info.emoji}</span>
          {info.label} Filter Active
        </span>
      </div>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`relative rounded-2xl overflow-hidden bg-gradient-to-br from-kawaii-pink-100 to-kawaii-purple-100 border-4 border-kawaii-pink-300 shadow-lg cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] ${className}`}
      onDoubleClick={handleDoubleClick}
      title="Double-click for fullscreen! 🌟"
    >
      <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 border-2 border-kawaii-pink-300">
        <span className="font-kawaii font-semibold text-kawaii-purple-800 flex items-center gap-2">
          <span className="text-lg">{emoji}</span>
          {title}
        </span>
      </div>
      
      {getFilterIndicator()}
      
      <div className="absolute top-4 right-4 z-10 bg-kawaii-pink-500/80 backdrop-blur-sm rounded-full px-2 py-1 text-white text-xs font-kawaii font-semibold animate-pulse">
        Double-click for fullscreen! ✨
      </div>
      
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover transition-all duration-500"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-kawaii-pink-50 to-kawaii-purple-50">
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce-cute">{emoji}</div>
            <p className="font-kawaii text-kawaii-purple-600 text-lg font-semibold">
              {isActive ? 'Starting...' : 'Not Connected'}
            </p>
            <p className="font-kawaii text-kawaii-purple-400 text-sm mt-2">
              {isActive ? '✨ Preparing your stream!' : '💖 Click to activate!'}
            </p>
            <p className="font-kawaii text-kawaii-pink-500 text-xs mt-2 animate-pulse">
              Double-click for fullscreen! 🌟
            </p>
          </div>
        </div>
      )}
      
      {isActive && (
        <div className="absolute bottom-4 right-4 z-10">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse-pink shadow-lg"></div>
        </div>
      )}
    </div>
  );
};