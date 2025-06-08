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

  const startGenderFilter = useCallback(async (
    originalStream: MediaStream,
    filterType: 'feminine' | 'masculine',
    useAI: boolean = true
  ) => {
    try {
      console.log(`🎭 Starting ${filterType} gender filter...`);
      setFilterState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      const config: TransformationConfig = {
        targetGender: filterType === 'feminine' ? 'female' : 'male',
        intensity: 85, // High intensity for noticeable changes
        features: {
          hair: true,
          makeup: filterType === 'feminine',
          facialStructure: true,
          bodyShape: true,
        },
      };

      const transformedStream = await genderTransformAPI.createTransformationStream(
        originalStream,
        config
      );
      
      streamRef.current = transformedStream;
      
      setFilterState(prev => ({
        ...prev,
        isProcessing: false,
        transformedStream,
        error: null,
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
  }, []);

  const stopGenderFilter = useCallback(() => {
    console.log('🛑 Stopping gender filter...');
    
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