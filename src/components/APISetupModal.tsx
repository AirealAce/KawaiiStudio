import React, { useState } from 'react';
import { KawaiiButton } from './KawaiiButton';
import { X, Key, ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';

interface APISetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiStatus: { available: boolean; provider: string; error?: string } | null;
}

export const APISetupModal: React.FC<APISetupModalProps> = ({
  isOpen,
  onClose,
  apiStatus,
}) => {
  const [apiKeys, setApiKeys] = useState({
    akool: '',
    deepar: '',
    faceapp: '',
  });

  const [showKeys, setShowKeys] = useState({
    akool: false,
    deepar: false,
    faceapp: false,
  });

  if (!isOpen) return null;

  const handleSaveKeys = () => {
    // Save to localStorage (in production, use secure storage)
    if (apiKeys.akool) localStorage.setItem('VITE_AKOOL_API_KEY', apiKeys.akool);
    if (apiKeys.deepar) localStorage.setItem('VITE_DEEPAR_LICENSE_KEY', apiKeys.deepar);
    if (apiKeys.faceapp) localStorage.setItem('VITE_FACEAPP_API_KEY', apiKeys.faceapp);
    
    // Reload page to apply new keys
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-kawaii rounded-2xl p-8 border-4 border-kawaii-pink-300 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-kawaii font-bold text-2xl text-kawaii-purple-800 flex items-center gap-2">
            <span className="text-3xl">🤖</span>
            AI Gender Transformation Setup
            <span className="text-3xl">⚙️</span>
          </h3>
          <button
            onClick={onClose}
            className="text-kawaii-purple-400 hover:text-kawaii-purple-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 rounded-xl border-2 border-kawaii-blue-200 bg-kawaii-blue-50">
          <div className="flex items-center gap-2 mb-2">
            {apiStatus?.available ? (
              <CheckCircle size={20} className="text-green-500" />
            ) : (
              <AlertCircle size={20} className="text-red-500" />
            )}
            <span className="font-kawaii font-semibold text-kawaii-purple-800">
              Current Status: {apiStatus?.available ? `✅ ${apiStatus.provider} Active` : '❌ No AI APIs Available'}
            </span>
          </div>
          {apiStatus?.error && (
            <p className="text-sm text-red-600 font-kawaii">{apiStatus.error}</p>
          )}
        </div>

        {/* API Provider Options */}
        <div className="space-y-6">
          {/* AKOOL */}
          <div className="p-4 rounded-xl border-2 border-kawaii-pink-200 bg-kawaii-pink-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-kawaii font-bold text-lg text-kawaii-purple-800 flex items-center gap-2">
                <span className="text-xl">🎭</span>
                AKOOL Live Face Swap
                <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-full">RECOMMENDED</span>
              </h4>
              <a
                href="https://akool.com/apps/faceswap/live"
                target="_blank"
                rel="noopener noreferrer"
                className="text-kawaii-blue-500 hover:text-kawaii-blue-700"
              >
                <ExternalLink size={16} />
              </a>
            </div>
            
            <p className="text-sm text-kawaii-purple-600 mb-3 font-kawaii">
              ✨ Real-time gender swap with hair, makeup, and facial structure changes
            </p>
            
            <div className="space-y-2">
              <label className="block font-kawaii text-kawaii-purple-700 font-semibold">
                API Key:
              </label>
              <div className="flex gap-2">
                <input
                  type={showKeys.akool ? 'text' : 'password'}
                  value={apiKeys.akool}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, akool: e.target.value }))}
                  placeholder="Enter your AKOOL API key..."
                  className="flex-1 p-3 rounded-xl border-2 border-kawaii-pink-300 font-kawaii bg-white/80 focus:border-kawaii-purple-400 focus:outline-none"
                />
                <button
                  onClick={() => setShowKeys(prev => ({ ...prev, akool: !prev.akool }))}
                  className="px-3 py-2 bg-kawaii-purple-500 text-white rounded-xl hover:bg-kawaii-purple-600 transition-colors"
                >
                  {showKeys.akool ? '🙈' : '👁️'}
                </button>
              </div>
              <p className="text-xs text-kawaii-purple-500 font-kawaii">
                💡 Get your free API key at <a href="https://akool.com" target="_blank" className="text-kawaii-blue-500 underline">akool.com</a>
              </p>
            </div>
          </div>

          {/* DeepAR */}
          <div className="p-4 rounded-xl border-2 border-kawaii-blue-200 bg-kawaii-blue-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-kawaii font-bold text-lg text-kawaii-purple-800 flex items-center gap-2">
                <span className="text-xl">🔮</span>
                DeepAR Web SDK
              </h4>
              <a
                href="https://developer.deepar.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-kawaii-blue-500 hover:text-kawaii-blue-700"
              >
                <ExternalLink size={16} />
              </a>
            </div>
            
            <p className="text-sm text-kawaii-purple-600 mb-3 font-kawaii">
              🎪 Real-time AR effects with gender transformation filters
            </p>
            
            <div className="space-y-2">
              <label className="block font-kawaii text-kawaii-purple-700 font-semibold">
                License Key:
              </label>
              <div className="flex gap-2">
                <input
                  type={showKeys.deepar ? 'text' : 'password'}
                  value={apiKeys.deepar}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, deepar: e.target.value }))}
                  placeholder="Enter your DeepAR license key..."
                  className="flex-1 p-3 rounded-xl border-2 border-kawaii-blue-300 font-kawaii bg-white/80 focus:border-kawaii-purple-400 focus:outline-none"
                />
                <button
                  onClick={() => setShowKeys(prev => ({ ...prev, deepar: !prev.deepar }))}
                  className="px-3 py-2 bg-kawaii-purple-500 text-white rounded-xl hover:bg-kawaii-purple-600 transition-colors"
                >
                  {showKeys.deepar ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>

          {/* FaceApp */}
          <div className="p-4 rounded-xl border-2 border-kawaii-purple-200 bg-kawaii-purple-50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-kawaii font-bold text-lg text-kawaii-purple-800 flex items-center gap-2">
                <span className="text-xl">📱</span>
                FaceApp API
              </h4>
              <a
                href="https://www.faceapp.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-kawaii-blue-500 hover:text-kawaii-blue-700"
              >
                <ExternalLink size={16} />
              </a>
            </div>
            
            <p className="text-sm text-kawaii-purple-600 mb-3 font-kawaii">
              🎨 High-quality gender swap and beauty filters
            </p>
            
            <div className="space-y-2">
              <label className="block font-kawaii text-kawaii-purple-700 font-semibold">
                API Key:
              </label>
              <div className="flex gap-2">
                <input
                  type={showKeys.faceapp ? 'text' : 'password'}
                  value={apiKeys.faceapp}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, faceapp: e.target.value }))}
                  placeholder="Enter your FaceApp API key..."
                  className="flex-1 p-3 rounded-xl border-2 border-kawaii-purple-300 font-kawaii bg-white/80 focus:border-kawaii-purple-400 focus:outline-none"
                />
                <button
                  onClick={() => setShowKeys(prev => ({ ...prev, faceapp: !prev.faceapp }))}
                  className="px-3 py-2 bg-kawaii-purple-500 text-white rounded-xl hover:bg-kawaii-purple-600 transition-colors"
                >
                  {showKeys.faceapp ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 rounded-xl border-2 border-kawaii-pink-200 bg-gradient-to-r from-kawaii-pink-50 to-kawaii-purple-50">
          <h4 className="font-kawaii font-bold text-kawaii-purple-800 mb-2 flex items-center gap-2">
            <span className="text-lg">💡</span>
            How to Get API Keys:
          </h4>
          <ol className="list-decimal list-inside space-y-1 text-sm text-kawaii-purple-600 font-kawaii">
            <li><strong>AKOOL:</strong> Sign up at akool.com → Dashboard → API Keys → Generate new key</li>
            <li><strong>DeepAR:</strong> Register at developer.deepar.ai → Create project → Get license key</li>
            <li><strong>FaceApp:</strong> Contact FaceApp for business API access</li>
          </ol>
          
          <div className="mt-3 p-3 bg-yellow-100 border-2 border-yellow-300 rounded-xl">
            <p className="text-xs text-yellow-800 font-kawaii">
              ⚠️ <strong>Note:</strong> Without API keys, only enhanced CSS filters will be available. 
              For real hair changes, makeup, and body transformation, AI APIs are required.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-center mt-6">
          <KawaiiButton
            onClick={handleSaveKeys}
            emoji="💾"
            variant="success"
            disabled={!apiKeys.akool && !apiKeys.deepar && !apiKeys.faceapp}
          >
            Save & Apply Keys
          </KawaiiButton>
          <KawaiiButton
            onClick={onClose}
            emoji="❌"
            variant="secondary"
          >
            Close
          </KawaiiButton>
        </div>
      </div>
    </div>
  );
};