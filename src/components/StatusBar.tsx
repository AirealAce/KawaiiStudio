import React from 'react';
import { Wifi, WifiOff, Heart } from 'lucide-react';

interface StatusBarProps {
  isConnected: boolean;
  viewerCount: number;
  streamDuration: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  isConnected,
  viewerCount,
  streamDuration,
}) => {
  return (
    <div className="bg-gradient-to-r from-kawaii-pink-500 to-kawaii-purple-600 text-white p-4 rounded-2xl shadow-lg border-2 border-kawaii-pink-400">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <Wifi size={20} className="text-green-300" />
            ) : (
              <WifiOff size={20} className="text-red-300" />
            )}
            <span className="font-kawaii font-semibold">
              {isConnected ? 'LIVE 🔴' : 'OFFLINE 💤'}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Heart size={20} className="text-pink-300 animate-pulse" />
            <span className="font-kawaii font-semibold">{viewerCount} viewers</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="font-kawaii text-sm opacity-90">Stream Time</p>
            <p className="font-kawaii font-bold text-lg">{streamDuration}</p>
          </div>
          <div className="text-2xl animate-bounce-cute">✨</div>
        </div>
      </div>
    </div>
  );
};