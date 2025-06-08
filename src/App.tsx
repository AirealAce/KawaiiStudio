import React, { useState, useEffect } from 'react';
import { VideoPreview } from './components/VideoPreview';
import { AudioVisualizer } from './components/AudioVisualizer';
import { StreamControls } from './components/StreamControls';
import { StatusBar } from './components/StatusBar';
import { KawaiiButton } from './components/KawaiiButton';
import { useMediaAccess } from './hooks/useMediaAccess';
import { useSound } from './hooks/useSound';
import { Sparkles, Heart, Star, AlertCircle, X } from 'lucide-react';

function App() {
  const {
    mediaState,
    startScreenCapture,
    stopScreenCapture,
    startCamera,
    stopCamera,
    startMicrophone,
    stopMicrophone,
    startRecording,
    stopRecording,
    takeScreenshot,
    setMicrophoneVolume,
    setScreenAudioVolume,
    setSelectedMicrophone,
    setGenderFilter,
  } = useMediaAccess();

  const { playSuccess, playError, playNotification } = useSound();
  const [streamDuration, setStreamDuration] = useState('00:00:00');
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [viewerCount] = useState(Math.floor(Math.random() * 1000) + 50);
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (mediaState.isRecording && !startTime) {
      setStartTime(new Date());
    } else if (!mediaState.isRecording && startTime) {
      setStartTime(null);
      setStreamDuration('00:00:00');
    }
  }, [mediaState.isRecording, startTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (startTime) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = now.getTime() - startTime.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        setStreamDuration(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [startTime]);

  const showError = (message: string) => {
    setErrorMessage(message);
    setTimeout(() => setErrorMessage(null), 5000);
  };

  const handleScreenShare = async () => {
    try {
      if (mediaState.isScreenSharing) {
        stopScreenCapture();
      } else {
        await startScreenCapture();
        playSuccess();
      }
    } catch (error: any) {
      playError();
      console.error('Screen share error:', error);
      
      // Provide user-friendly error messages
      if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
        showError('🚫 Screen sharing permission was denied. Please click "Allow" when prompted to share your screen! 💖');
      } else if (error.name === 'NotSupportedError') {
        showError('😅 Screen sharing is not supported in this browser. Try using Chrome, Firefox, or Edge! ✨');
      } else if (error.name === 'AbortError') {
        showError('🌸 Screen sharing was cancelled. No worries, try again when you\'re ready! 🎀');
      } else {
        showError('💔 Oops! Something went wrong with screen sharing. Please try again! 🌟');
      }
    }
  };

  const handleCamera = async () => {
    try {
      if (mediaState.isCameraOn) {
        stopCamera();
      } else {
        await startCamera();
        playSuccess();
      }
    } catch (error: any) {
      playError();
      console.error('Camera error:', error);
      
      if (error.name === 'NotAllowedError') {
        showError('📷 Camera permission was denied. Please allow camera access to use this feature! 💖');
      } else if (error.name === 'NotFoundError') {
        showError('😅 No camera found! Make sure your camera is connected and try again! ✨');
      } else {
        showError('💔 Camera error occurred. Please check your camera and try again! 🌟');
      }
    }
  };

  const handleMicrophone = async () => {
    try {
      if (mediaState.isMicOn) {
        stopMicrophone();
      } else {
        await startMicrophone();
        playSuccess();
      }
    } catch (error: any) {
      playError();
      console.error('Microphone error:', error);
      
      if (error.name === 'NotAllowedError') {
        showError('🎤 Microphone permission was denied. Please allow microphone access! 💖');
      } else if (error.name === 'NotFoundError') {
        showError('😅 No microphone found! Make sure your microphone is connected! ✨');
      } else {
        showError('💔 Microphone error occurred. Please check your microphone and try again! 🌟');
      }
    }
  };

  const handleRecord = () => {
    if (mediaState.isRecording) {
      stopRecording();
      playNotification();
    } else {
      startRecording();
      playSuccess();
    }
  };

  const handleScreenshot = () => {
    takeScreenshot();
    playSuccess();
  };

  const handleFilters = () => {
    setShowFiltersModal(true);
    playNotification();
  };

  const handleGenderFilter = async (filter: 'none' | 'feminine' | 'masculine') => {
    try {
      await setGenderFilter(filter);
      playSuccess();
    } catch (error) {
      console.error('Gender filter error:', error);
      playError();
      showError('💔 Failed to apply gender filter. Please try again! 🌟');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-kawaii-pink-200 via-kawaii-purple-200 to-kawaii-blue-200 font-kawaii p-4">
      {/* Error Toast */}
      {errorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-white/95 backdrop-blur-kawaii rounded-2xl p-4 border-2 border-kawaii-pink-400 shadow-2xl max-w-md animate-bounce-cute">
          <div className="flex items-start gap-3">
            <AlertCircle size={24} className="text-kawaii-pink-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-kawaii-purple-800 font-semibold text-sm leading-relaxed">
                {errorMessage}
              </p>
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-kawaii-purple-400 hover:text-kawaii-purple-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {/* Floating decorations */}
      <div className="fixed top-10 left-10 text-4xl animate-float">🌸</div>
      <div className="fixed top-20 right-20 text-3xl animate-bounce-cute">🎀</div>
      <div className="fixed bottom-20 left-20 text-3xl animate-wiggle">🐱</div>
      <div className="fixed bottom-10 right-10 text-4xl animate-float">✨</div>
      
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-kawaii-pink-600 to-kawaii-purple-600 mb-4 animate-glow">
          🌟 Kawaii 人 Studio 🌟
        </h1>
        <p className="text-xl text-kawaii-purple-700 font-semibold flex items-center justify-center gap-2">
          <Heart size={24} className="text-kawaii-pink-500 animate-pulse" />
          The cutest streaming app for adorable streamers!
          <Heart size={24} className="text-kawaii-pink-500 animate-pulse" />
        </p>
        <div className="flex items-center justify-center gap-4 mt-4">
          <Sparkles size={20} className="text-kawaii-purple-500 animate-pulse" />
          <span className="text-kawaii-purple-600 font-semibold">Made with 💖 for streamers who love kawaii!</span>
          <Star size={20} className="text-kawaii-pink-500 animate-pulse" />
        </div>
      </div>

      {/* Status Bar */}
      <div className="mb-6">
        <StatusBar
          isConnected={mediaState.isRecording}
          viewerCount={viewerCount}
          streamDuration={streamDuration}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Screen Preview */}
        <div className="lg:col-span-2">
          <VideoPreview
            stream={mediaState.screenStream}
            title="Screen Share"
            emoji="🖥️"
            isActive={mediaState.isScreenSharing}
            className="h-80 lg:h-96"
          />
        </div>

        {/* Controls */}
        <div>
          <StreamControls
            isScreenSharing={mediaState.isScreenSharing}
            isCameraOn={mediaState.isCameraOn}
            isMicOn={mediaState.isMicOn}
            isRecording={mediaState.isRecording}
            onScreenShare={handleScreenShare}
            onCamera={handleCamera}
            onMicrophone={handleMicrophone}
            onRecord={handleRecord}
            onScreenshot={handleScreenshot}
            onFilters={handleFilters}
            mediaState={mediaState}
            setMicrophoneVolume={setMicrophoneVolume}
            setScreenAudioVolume={setScreenAudioVolume}
            setSelectedMicrophone={setSelectedMicrophone}
            genderFilter={mediaState.genderFilter}
            setGenderFilter={handleGenderFilter}
          />
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Camera Preview */}
        <VideoPreview
          stream={mediaState.transformedCameraStream || mediaState.cameraStream}
          title="Camera"
          emoji="📷"
          isActive={mediaState.isCameraOn}
          className="h-64"
          genderFilter={mediaState.genderFilter}
        />

        {/* Audio Visualizer */}
        <AudioVisualizer
          audioLevel={mediaState.audioLevel}
          isActive={mediaState.isMicOn}
        />
      </div>

      {/* Quick Actions */}
      <div className="mt-8 text-center">
        <div className="bg-white/20 backdrop-blur-kawaii rounded-2xl p-6 border-2 border-kawaii-pink-300 shadow-lg inline-block">
          <h3 className="font-kawaii font-bold text-kawaii-purple-800 mb-4 flex items-center justify-center gap-2">
            <span className="text-2xl">🚀</span>
            Quick Actions
            <span className="text-2xl">💫</span>
          </h3>
          <div className="flex gap-4 flex-wrap justify-center">
            <KawaiiButton
              onClick={() => playNotification()}
              emoji="🎉"
              size="sm"
            >
              Test Sounds
            </KawaiiButton>
            <KawaiiButton
              onClick={handleScreenshot}
              emoji="📸"
              size="sm"
              variant="secondary"
            >
              Screenshot
            </KawaiiButton>
            <KawaiiButton
              onClick={() => playNotification()}
              emoji="💌"
              size="sm"
              variant="success"
            >
              Share Stream
            </KawaiiButton>
          </div>
        </div>
      </div>

      {/* Filters Modal */}
      {showFiltersModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/90 backdrop-blur-kawaii rounded-2xl p-8 border-4 border-kawaii-pink-300 shadow-2xl max-w-md w-full">
            <h3 className="font-kawaii font-bold text-2xl text-kawaii-purple-800 mb-6 text-center flex items-center justify-center gap-2">
              <span className="text-3xl">🌈</span>
              Kawaii Filters
              <span className="text-3xl">✨</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <KawaiiButton emoji="🐱" size="sm" variant="primary">Cat Ears</KawaiiButton>
              <KawaiiButton emoji="🌸" size="sm" variant="secondary">Sakura</KawaiiButton>
              <KawaiiButton emoji="🎀" size="sm" variant="success">Bow Tie</KawaiiButton>
              <KawaiiButton emoji="✨" size="sm" variant="primary">Sparkles</KawaiiButton>
              <KawaiiButton emoji="💖" size="sm" variant="secondary">Hearts</KawaiiButton>
              <KawaiiButton emoji="🦄" size="sm" variant="success">Unicorn</KawaiiButton>
            </div>

            {/* Gender Bender Filter Section */}
            {mediaState.isCameraOn && (
              <div className="mb-6">
                <h4 className="font-kawaii font-bold text-lg text-kawaii-purple-800 mb-4 text-center flex items-center justify-center gap-2">
                  <span className="text-2xl">⚧️</span>
                  Gender Bender
                  <span className="text-2xl">🌈</span>
                </h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <KawaiiButton
                    onClick={() => {
                      handleGenderFilter('none');
                    }}
                    variant={mediaState.genderFilter === 'none' ? 'primary' : 'secondary'}
                    emoji="🚫"
                    size="sm"
                    className="w-full"
                  >
                    No Filter (Natural)
                  </KawaiiButton>
                  
                  <KawaiiButton
                    onClick={() => {
                      handleGenderFilter('feminine');
                    }}
                    variant={mediaState.genderFilter === 'feminine' ? 'primary' : 'secondary'}
                    emoji="👩"
                    size="sm"
                    className="w-full bg-gradient-to-r from-pink-400 to-purple-500 hover:from-pink-500 hover:to-purple-600"
                    disabled={mediaState.isFilterProcessing}
                  >
                    {mediaState.isFilterProcessing && mediaState.genderFilter === 'feminine' ? 'Processing...' : 'Feminine Enhancement'}
                  </KawaiiButton>
                  
                  <KawaiiButton
                    onClick={() => {
                      handleGenderFilter('masculine');
                    }}
                    variant={mediaState.genderFilter === 'masculine' ? 'primary' : 'secondary'}
                    emoji="👨"
                    size="sm"
                    className="w-full bg-gradient-to-r from-blue-400 to-indigo-500 hover:from-blue-500 hover:to-indigo-600"
                    disabled={mediaState.isFilterProcessing}
                  >
                    {mediaState.isFilterProcessing && mediaState.genderFilter === 'masculine' ? 'Processing...' : 'Masculine Enhancement'}
                  </KawaiiButton>
                </div>
                
                <div className="bg-gradient-to-r from-pink-50 to-blue-50 p-3 rounded-xl border-2 border-gradient-to-r from-pink-200 to-blue-200 mt-4">
                  <p className="font-kawaii text-kawaii-purple-700 text-xs text-center">
                    💡 <strong>Current:</strong> Enhanced CSS filters with real-time processing! For AI-powered transformations, integrate with AKOOL or similar APIs. 🎭✨
                  </p>
                </div>
              </div>
            )}
            
            <div className="text-center">
              <KawaiiButton
                onClick={() => setShowFiltersModal(false)}
                emoji="❌"
                variant="danger"
                size="sm"
              >
                Close
              </KawaiiButton>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-8 text-center">
        <p className="text-kawaii-purple-600 font-semibold flex items-center justify-center gap-2">
          <span className="text-lg">🌈</span>
          Stream with love, create with joy!
          <span className="text-lg">🦄</span>
        </p>
        <p className="text-kawaii-purple-500 text-sm mt-2">
          Perfect for kawaii streamers who want to spread happiness! ✨💖🎀
        </p>
        <p className="text-kawaii-pink-500 text-xs mt-2 animate-pulse">
          Double-click any video for fullscreen! Press ESC to exit! 🌟
        </p>
      </div>
    </div>
  );
}

export default App;