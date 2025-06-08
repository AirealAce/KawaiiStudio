import React from 'react';
import { KawaiiButton } from './KawaiiButton';
import { X, CheckCircle, Palette, Sparkles } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-kawaii rounded-2xl p-8 border-4 border-kawaii-pink-300 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-kawaii font-bold text-2xl text-kawaii-purple-800 flex items-center gap-2">
            <span className="text-3xl">🎨</span>
            Gender Transformation Info
            <span className="text-3xl">✨</span>
          </h3>
          <button
            onClick={onClose}
            className="text-kawaii-purple-400 hover:text-kawaii-purple-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Current Status */}
        <div className="mb-6 p-4 rounded-xl border-2 border-green-200 bg-green-50">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle size={20} className="text-green-500" />
            <span className="font-kawaii font-semibold text-kawaii-purple-800">
              ✅ CSS Enhanced Filters Active
            </span>
          </div>
          <p className="text-sm text-green-600 font-kawaii">
            Advanced CSS filters with canvas processing are ready to use! No API keys required.
          </p>
        </div>

        {/* How It Works */}
        <div className="space-y-6">
          <div className="p-4 rounded-xl border-2 border-kawaii-pink-200 bg-kawaii-pink-50">
            <h4 className="font-kawaii font-bold text-lg text-kawaii-purple-800 flex items-center gap-2 mb-3">
              <Palette size={20} />
              How Gender Transformation Works
            </h4>
            
            <div className="space-y-3 text-sm text-kawaii-purple-600 font-kawaii">
              <div className="flex items-start gap-2">
                <span className="text-lg">👩</span>
                <div>
                  <strong>Feminine Filter:</strong> Applies soft pink tones, brightens complexion, 
                  adds subtle makeup effects, and creates a slimmer facial appearance through 
                  advanced CSS transforms and canvas processing.
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <span className="text-lg">👨</span>
                <div>
                  <strong>Masculine Filter:</strong> Adds cooler blue tones, enhances contrast, 
                  creates stronger jawline definition, and applies broader facial proportions 
                  for a more masculine appearance.
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-kawaii-blue-200 bg-kawaii-blue-50">
            <h4 className="font-kawaii font-bold text-lg text-kawaii-purple-800 flex items-center gap-2 mb-3">
              <Sparkles size={20} />
              Features Included
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-kawaii-purple-600 font-kawaii">
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Real-time video processing
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Color tone adjustments
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Facial proportion changes
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Makeup simulation effects
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                Smooth transitions
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-500">✅</span>
                No external dependencies
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border-2 border-kawaii-purple-200 bg-kawaii-purple-50">
            <h4 className="font-kawaii font-bold text-lg text-kawaii-purple-800 mb-3">
              🎮 How to Use
            </h4>
            
            <ol className="list-decimal list-inside space-y-2 text-sm text-kawaii-purple-600 font-kawaii">
              <li>Turn on your camera using the "Start Camera" button</li>
              <li>Choose your desired gender filter (Feminine or Masculine)</li>
              <li>The transformation will be applied in real-time to your video</li>
              <li>Use "None" to return to your natural appearance</li>
              <li>All filters work during recording and streaming!</li>
            </ol>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-center mt-6">
          <KawaiiButton
            onClick={onClose}
            emoji="✨"
            variant="primary"
          >
            Start Transforming!
          </KawaiiButton>
        </div>
      </div>
    </div>
  );
};