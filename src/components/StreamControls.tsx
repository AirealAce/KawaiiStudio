import React, { useState } from 'react';
import { Monitor, Camera, Mic, MicOff, Play, Square, Settings, Palette, Heart as Gear } from 'lucide-react';
import { KawaiiButton } from './KawaiiButton';
import { useSound } from '../hooks/useSound';

interface StreamControlsProps {
  isScreenSharing: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isRecording: boolean;
  onScreenShare: () => void;
  onCamera: () => void;
  onMicrophone: () => void;
  onRecord: () => void;
  onScreenshot: () => void;
  onFilters: () => void;
}

export const StreamControls: React.FC<StreamControlsProps> = ({
  isScreenSharing,
  isCameraOn,
  isMicOn,
  isRecording,
  onScreenShare,
  onCamera,
  onMicrophone,
  onRecord,
  onScreenshot,
  onFilters,
}) => {
  const { playSuccess, playError } = useSound();
  const [showMicSettings, setShowMicSettings] = useState(false);

  const handleScreenShare = () => {
    if (isScreenSharing) playError();
    else playSuccess();
    onScreenShare();
  };

  const handleCamera = () => {
    if (isCameraOn) playError();
    else playSuccess();
    onCamera();
  };

  const handleMicrophone = () => {
    if (isMicOn) playError();
    else playSuccess();
    onMicrophone();
  };

  const handleRecord = () => {
    if (isRecording) playError();
    else playSuccess();
    onRecord();
  };

  const handleScreenshot = () => {
    playSuccess();
    onScreenshot();
  };

  const handleFilters = () => {
    playSuccess();
    onFilters();
  };

  const handleMicSettings = () => {
    setShowMicSettings(true);
    playSuccess();
  };

  return (
    <div className="bg-white/30 backdrop-blur-kawaii rounded-2xl p-6 border-2 border-kawaii-pink-300 shadow-lg">
      <h2 className="font-kawaii font-bold text-2xl text-kawaii-purple-800 mb-6 text-center flex items-center justify-center gap-2">
        <span className="text-3xl">🎮</span>
        Stream Controls
        <span className="text-3xl">✨</span>
      </h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <KawaiiButton
          onClick={handleScreenShare}
          variant={isScreenSharing ? 'danger' : 'primary'}
          emoji="🖥️"
          className="h-16"
        >
          <div className="flex items-center gap-2">
            <Monitor size={20} />
            {isScreenSharing ? 'Stop Screen' : 'Share Screen'}
          </div>
        </KawaiiButton>
        
        <KawaiiButton
          onClick={handleCamera}
          variant={isCameraOn ? 'danger' : 'secondary'}
          emoji="📷"
          className="h-16"
        >
          <div className="flex items-center gap-2">
            <Camera size={20} />
            {isCameraOn ? 'Stop Camera' : 'Start Camera'}
          </div>
        </KawaiiButton>
        
        <div className="relative">
          <KawaiiButton
            onClick={handleMicrophone}
            variant={isMicOn ? 'danger' : 'success'}
            emoji="🎤"
            className="h-16 w-full"
          >
            <div className="flex items-center gap-2">
              {isMicOn ? <MicOff size={20} /> : <Mic size={20} />}
              {isMicOn ? 'Mute Mic' : 'Unmute Mic'}
            </div>
          </KawaiiButton>
          
          {/* Microphone Settings Gear Icon */}
          <button
            onClick={handleMicSettings}
            className="absolute -top-2 -right-2 w-8 h-8 bg-kawaii-purple-500 hover:bg-kawaii-purple-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110 border-2 border-white"
            title="Microphone Settings 🎤⚙️"
          >
            <Gear size={14} />
          </button>
        </div>
        
        <KawaiiButton
          onClick={handleRecord}
          variant={isRecording ? 'danger' : 'primary'}
          emoji={isRecording ? '⏹️' : '🔴'}
          className="h-16"
        >
          <div className="flex items-center gap-2">
            {isRecording ? <Square size={20} /> : <Play size={20} />}
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </div>
        </KawaiiButton>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <KawaiiButton
          onClick={handleScreenshot}
          variant="secondary"
          emoji="📸"
          size="sm"
        >
          <div className="flex items-center gap-2">
            <Camera size={16} />
            Screenshot
          </div>
        </KawaiiButton>
        
        <KawaiiButton
          onClick={handleFilters}
          variant="success"
          emoji="🌈"
          size="sm"
        >
          <div className="flex items-center gap-2">
            <Palette size={16} />
            Filters
          </div>
        </KawaiiButton>
      </div>
      
      <div className="text-center">
        <KawaiiButton
          onClick={() => {}}
          variant="secondary"
          emoji="⚙️"
          size="sm"
        >
          <div className="flex items-center gap-2">
            <Settings size={16} />
            Stream Settings
          </div>
        </KawaiiButton>
      </div>

      {/* Microphone Settings Modal */}
      {showMicSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-kawaii rounded-2xl p-8 border-4 border-kawaii-pink-300 shadow-2xl max-w-md w-full">
            <h3 className="font-kawaii font-bold text-2xl text-kawaii-purple-800 mb-6 text-center flex items-center justify-center gap-2">
              <span className="text-3xl">🎤</span>
              Microphone Settings
              <span className="text-3xl">⚙️</span>
            </h3>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block font-kawaii text-kawaii-purple-700 font-semibold mb-2">
                  Select Microphone 🎵
                </label>
                <select className="w-full p-3 rounded-xl border-2 border-kawaii-pink-300 font-kawaii bg-white/80 focus:border-kawaii-purple-400 focus:outline-none">
                  <option>Default Microphone 🎤</option>
                  <option>Built-in Microphone 📱</option>
                  <option>External USB Mic 🎙️</option>
                  <option>Bluetooth Headset 🎧</option>
                </select>
              </div>
              
              <div>
                <label className="block font-kawaii text-kawaii-purple-700 font-semibold mb-2">
                  Microphone Volume 🔊
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  defaultValue="75"
                  className="w-full h-2 bg-kawaii-pink-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-kawaii-purple-500 mt-1">
                  <span>🔇 Quiet</span>
                  <span>🔊 Loud</span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <input 
                  type="checkbox" 
                  id="noise-reduction"
                  className="w-4 h-4 text-kawaii-pink-500 rounded"
                />
                <label htmlFor="noise-reduction" className="font-kawaii text-kawaii-purple-700">
                  Enable Noise Reduction ✨
                </label>
              </div>
            </div>
            
            <div className="flex gap-3 justify-center">
              <KawaiiButton
                onClick={() => setShowMicSettings(false)}
                emoji="💾"
                variant="success"
                size="sm"
              >
                Save Settings
              </KawaiiButton>
              <KawaiiButton
                onClick={() => setShowMicSettings(false)}
                emoji="❌"
                variant="danger"
                size="sm"
              >
                Cancel
              </KawaiiButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};