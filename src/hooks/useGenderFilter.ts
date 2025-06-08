import { useState, useRef, useCallback, useEffect } from 'react';

interface GenderFilterState {
  isProcessing: boolean;
  error: string | null;
  transformedStream: MediaStream | null;
}

export const useGenderFilter = () => {
  const [filterState, setFilterState] = useState<GenderFilterState>({
    isProcessing: false,
    error: null,
    transformedStream: null,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize canvas for video processing
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      contextRef.current = canvasRef.current.getContext('2d');
    }
    return canvasRef.current && contextRef.current;
  }, []);

  // Enhanced CSS-based transformation with better effects
  const applyEnhancedFilter = useCallback((
    originalStream: MediaStream,
    filterType: 'feminine' | 'masculine'
  ): MediaStream => {
    console.log(`🎭 Applying enhanced ${filterType} filter...`);
    
    if (!initializeCanvas()) {
      console.error('Failed to initialize canvas');
      return originalStream;
    }

    const canvas = canvasRef.current!;
    const ctx = contextRef.current!;
    
    // Create video element to process frames
    const video = document.createElement('video');
    video.srcObject = originalStream;
    video.muted = true;
    video.playsInline = true;
    video.play();

    // Set up canvas stream
    const outputStream = canvas.captureStream(30); // 30 FPS
    
    const processFrame = () => {
      if (video.readyState >= 2) { // HAVE_CURRENT_DATA
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformation matrix for mirroring and scaling
        ctx.save();
        
        if (filterType === 'feminine') {
          // Feminine enhancements
          ctx.scale(-1, 0.98); // Mirror and slightly compress vertically
          ctx.translate(-canvas.width, 0);
          
          // Apply feminine color adjustments
          ctx.filter = 'contrast(1.1) brightness(1.05) saturate(1.15) hue-rotate(5deg) blur(0.3px)';
        } else {
          // Masculine enhancements
          ctx.scale(-1, 1.02); // Mirror and slightly stretch vertically
          ctx.translate(-canvas.width, 0);
          
          // Apply masculine color adjustments
          ctx.filter = 'contrast(1.15) brightness(0.95) saturate(0.9) hue-rotate(-5deg) blur(0.2px)';
        }
        
        // Draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add overlay effects
        if (filterType === 'feminine') {
          // Soft pink glow overlay
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
          );
          gradient.addColorStop(0, 'rgba(255, 182, 193, 0.1)');
          gradient.addColorStop(0.7, 'rgba(255, 182, 193, 0.05)');
          gradient.addColorStop(1, 'transparent');
          
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        } else {
          // Cool blue overlay
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
          );
          gradient.addColorStop(0, 'rgba(135, 206, 235, 0.1)');
          gradient.addColorStop(0.7, 'rgba(135, 206, 235, 0.05)');
          gradient.addColorStop(1, 'transparent');
          
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.restore();
      }
      
      animationFrameRef.current = requestAnimationFrame(processFrame);
    };
    
    video.addEventListener('loadedmetadata', () => {
      processFrame();
    });
    
    return outputStream;
  }, [initializeCanvas]);

  // Future: This is where you would integrate with AI APIs like AKOOL
  const applyAIFilter = useCallback(async (
    originalStream: MediaStream,
    filterType: 'feminine' | 'masculine'
  ): Promise<MediaStream> => {
    console.log(`🤖 AI Filter requested: ${filterType}`);
    
    // Placeholder for AI API integration
    // This is where you would:
    // 1. Connect to AKOOL or similar API
    // 2. Send video frames for processing
    // 3. Receive transformed frames
    // 4. Return the transformed stream
    
    setFilterState(prev => ({ ...prev, error: 'AI filters require API integration. Using enhanced CSS filters for now.' }));
    
    // For now, fall back to enhanced CSS filters
    return applyEnhancedFilter(originalStream, filterType);
  }, [applyEnhancedFilter]);

  const startGenderFilter = useCallback(async (
    originalStream: MediaStream,
    filterType: 'feminine' | 'masculine',
    useAI: boolean = false
  ) => {
    try {
      setFilterState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      let transformedStream: MediaStream;
      
      if (useAI) {
        transformedStream = await applyAIFilter(originalStream, filterType);
      } else {
        transformedStream = applyEnhancedFilter(originalStream, filterType);
      }
      
      streamRef.current = transformedStream;
      
      setFilterState(prev => ({
        ...prev,
        isProcessing: false,
        transformedStream,
      }));
      
      console.log(`✅ ${filterType} filter applied successfully`);
      
    } catch (error) {
      console.error('Gender filter error:', error);
      setFilterState(prev => ({
        ...prev,
        isProcessing: false,
        error: `Failed to apply ${filterType} filter: ${error}`,
      }));
    }
  }, [applyEnhancedFilter, applyAIFilter]);

  const stopGenderFilter = useCallback(() => {
    console.log('🛑 Stopping gender filter...');
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    setFilterState({
      isProcessing: false,
      error: null,
      transformedStream: null,
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopGenderFilter();
    };
  }, [stopGenderFilter]);

  return {
    filterState,
    startGenderFilter,
    stopGenderFilter,
  };
};