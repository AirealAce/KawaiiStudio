import { useState, useRef, useCallback, useEffect } from 'react';
import { genderTransformAPI, TransformationConfig } from '../services/genderTransformAPI';

interface GenderFilterState {
  isProcessing: boolean;
  error: string | null;
  transformedStream: MediaStream | null;
  apiStatus: { available: boolean; provider: string; error?: string } | null;
  isAPIChecking: boolean;
}

export const useGenderFilter = () => {
  const [filterState, setFilterState] = useState<GenderFilterState>({
    isProcessing: false,
    error: null,
    transformedStream: null,
    apiStatus: null,
    isAPIChecking: false,
  });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check API availability on mount
  useEffect(() => {
    const checkAPIs = async () => {
      setFilterState(prev => ({ ...prev, isAPIChecking: true }));
      
      try {
        const status = await genderTransformAPI.checkAPIStatus();
        setFilterState(prev => ({ 
          ...prev, 
          apiStatus: status,
          isAPIChecking: false,
        }));
      } catch (error) {
        setFilterState(prev => ({ 
          ...prev, 
          apiStatus: { 
            available: false, 
            provider: 'none', 
            error: `API check failed: ${error}` 
          },
          isAPIChecking: false,
        }));
      }
    };

    checkAPIs();
  }, []);

  // Initialize canvas for video processing
  const initializeCanvas = useCallback(() => {
    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
      contextRef.current = canvasRef.current.getContext('2d');
    }
    return canvasRef.current && contextRef.current;
  }, []);

  // Real AI transformation using available APIs
  const applyAITransformation = useCallback(async (
    originalStream: MediaStream,
    filterType: 'feminine' | 'masculine'
  ): Promise<MediaStream> => {
    console.log(`🤖 Applying real AI ${filterType} transformation...`);
    
    if (!filterState.apiStatus?.available) {
      throw new Error('No AI transformation APIs are available. Please configure API keys.');
    }

    const config: TransformationConfig = {
      targetGender: filterType === 'feminine' ? 'female' : 'male',
      intensity: 85, // High intensity for noticeable changes
      features: {
        hair: true,        // Change hair style/length
        makeup: filterType === 'feminine', // Add makeup for feminine
        facialStructure: true, // Modify facial features
        bodyShape: true,   // Adjust body proportions
      },
    };

    try {
      const transformedStream = await genderTransformAPI.createTransformationStream(
        originalStream,
        config
      );
      
      console.log(`✅ Real AI ${filterType} transformation applied successfully`);
      return transformedStream;
      
    } catch (error) {
      console.error('AI transformation failed:', error);
      throw new Error(`AI transformation failed: ${error}`);
    }
  }, [filterState.apiStatus]);

  // Enhanced CSS-based transformation (fallback)
  const applyEnhancedFilter = useCallback((
    originalStream: MediaStream,
    filterType: 'feminine' | 'masculine'
  ): MediaStream => {
    console.log(`🎭 Applying enhanced CSS ${filterType} filter as fallback...`);
    
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
          // Feminine enhancements - more dramatic
          ctx.scale(-1, 0.95); // Mirror and compress vertically for slimmer face
          ctx.translate(-canvas.width, 0);
          
          // Apply stronger feminine color adjustments
          ctx.filter = 'contrast(1.2) brightness(1.1) saturate(1.3) hue-rotate(10deg) blur(0.5px)';
        } else {
          // Masculine enhancements - more dramatic
          ctx.scale(-1, 1.05); // Mirror and stretch vertically for broader face
          ctx.translate(-canvas.width, 0);
          
          // Apply stronger masculine color adjustments
          ctx.filter = 'contrast(1.3) brightness(0.9) saturate(0.8) hue-rotate(-10deg) blur(0.1px)';
        }
        
        // Draw the video frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Add stronger overlay effects
        if (filterType === 'feminine') {
          // Strong pink glow overlay for feminine look
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
          );
          gradient.addColorStop(0, 'rgba(255, 182, 193, 0.25)');
          gradient.addColorStop(0.5, 'rgba(255, 192, 203, 0.15)');
          gradient.addColorStop(1, 'transparent');
          
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add soft highlight for "makeup" effect
          ctx.globalCompositeOperation = 'screen';
          ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.fillRect(0, canvas.height * 0.3, canvas.width, canvas.height * 0.4);
        } else {
          // Strong blue overlay for masculine look
          const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height) / 2
          );
          gradient.addColorStop(0, 'rgba(135, 206, 235, 0.25)');
          gradient.addColorStop(0.5, 'rgba(173, 216, 230, 0.15)');
          gradient.addColorStop(1, 'transparent');
          
          ctx.globalCompositeOperation = 'overlay';
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Add shadow for more defined features
          ctx.globalCompositeOperation = 'multiply';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
          ctx.fillRect(0, canvas.height * 0.6, canvas.width, canvas.height * 0.4);
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

  const startGenderFilter = useCallback(async (
    originalStream: MediaStream,
    filterType: 'feminine' | 'masculine',
    useAI: boolean = true
  ) => {
    try {
      setFilterState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      let transformedStream: MediaStream;
      
      // Try AI transformation first if available and requested
      if (useAI && filterState.apiStatus?.available) {
        try {
          transformedStream = await applyAITransformation(originalStream, filterType);
          console.log('✅ Using real AI transformation');
        } catch (aiError) {
          console.warn('AI transformation failed, falling back to CSS filters:', aiError);
          transformedStream = applyEnhancedFilter(originalStream, filterType);
          setFilterState(prev => ({ 
            ...prev, 
            error: `AI transformation unavailable: ${aiError}. Using enhanced CSS filters.` 
          }));
        }
      } else {
        // Use enhanced CSS filters
        transformedStream = applyEnhancedFilter(originalStream, filterType);
        if (!filterState.apiStatus?.available) {
          setFilterState(prev => ({ 
            ...prev, 
            error: 'AI APIs not configured. Using enhanced CSS filters. For real transformation, add API keys.' 
          }));
        }
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
  }, [applyAITransformation, applyEnhancedFilter, filterState.apiStatus]);

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
    
    setFilterState(prev => ({
      ...prev,
      isProcessing: false,
      error: null,
      transformedStream: null,
    }));
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