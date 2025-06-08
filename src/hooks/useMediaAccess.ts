import { useState, useRef, useCallback, useEffect } from 'react';

interface MediaState {
  isScreenSharing: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isRecording: boolean;
  screenStream: MediaStream | null;
  cameraStream: MediaStream | null;
  microphoneStream: MediaStream | null;
  audioLevel: number;
  microphoneVolume: number;
  screenAudioVolume: number;
  availableMicrophones: MediaDeviceInfo[];
  selectedMicrophone: string;
}

export const useMediaAccess = () => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isScreenSharing: false,
    isCameraOn: false,
    isMicOn: false,
    isRecording: false,
    screenStream: null,
    cameraStream: null,
    microphoneStream: null,
    audioLevel: 0,
    microphoneVolume: 75,
    screenAudioVolume: 80, // Increased default volume
    availableMicrophones: [],
    selectedMicrophone: 'default',
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const micGainNodeRef = useRef<GainNode | null>(null);
  const screenGainNodeRef = useRef<GainNode | null>(null);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedMicVolume = localStorage.getItem('kawaii-mic-volume');
    const savedScreenVolume = localStorage.getItem('kawaii-screen-volume');
    const savedMicrophone = localStorage.getItem('kawaii-selected-microphone');

    if (savedMicVolume || savedScreenVolume || savedMicrophone) {
      setMediaState(prev => ({
        ...prev,
        microphoneVolume: savedMicVolume ? parseInt(savedMicVolume) : 75,
        screenAudioVolume: savedScreenVolume ? parseInt(savedScreenVolume) : 80,
        selectedMicrophone: savedMicrophone || 'default',
      }));
    }

    // Get available microphones
    navigator.mediaDevices.enumerateDevices().then(devices => {
      const microphones = devices.filter(device => device.kind === 'audioinput');
      setMediaState(prev => ({
        ...prev,
        availableMicrophones: microphones,
      }));
    });
  }, []);

  const downloadFile = useCallback((blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const takeScreenshot = useCallback(() => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (mediaState.screenStream) {
      const video = document.createElement('video');
      video.srcObject = mediaState.screenStream;
      video.play();
      
      video.addEventListener('loadedmetadata', () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx?.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            downloadFile(blob, `kawaii-screenshot-${timestamp}.png`);
          }
        }, 'image/png');
      });
    }
  }, [mediaState.screenStream, downloadFile]);

  const startScreenCapture = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { 
          mediaSource: 'screen',
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 48000,
          channelCount: 2
        },
      });
      
      // Set up audio context for screen audio volume control
      if (stream.getAudioTracks().length > 0) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        const destination = audioContext.createMediaStreamDestination();
        
        source.connect(gainNode);
        gainNode.connect(destination);
        
        // Apply saved volume setting with higher gain
        gainNode.gain.value = (mediaState.screenAudioVolume / 100) * 2; // Double the gain for better volume
        screenGainNodeRef.current = gainNode;
        
        // Replace audio track with volume-controlled one
        const originalAudioTrack = stream.getAudioTracks()[0];
        stream.removeTrack(originalAudioTrack);
        destination.stream.getAudioTracks().forEach(track => {
          stream.addTrack(track);
        });
      }
      
      setMediaState(prev => ({
        ...prev,
        isScreenSharing: true,
        screenStream: stream,
      }));
      
      return stream;
    } catch (error) {
      console.error('Error starting screen capture:', error);
      throw error;
    }
  }, [mediaState.screenAudioVolume]);

  const stopScreenCapture = useCallback(() => {
    if (mediaState.screenStream) {
      mediaState.screenStream.getTracks().forEach(track => track.stop());
      setMediaState(prev => ({
        ...prev,
        isScreenSharing: false,
        screenStream: null,
      }));
    }
    if (screenGainNodeRef.current && screenGainNodeRef.current.context) {
      screenGainNodeRef.current.context.close();
      screenGainNodeRef.current = null;
    }
  }, [mediaState.screenStream]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false,
      });
      
      setMediaState(prev => ({
        ...prev,
        isCameraOn: true,
        cameraStream: stream,
      }));
      
      return stream;
    } catch (error) {
      console.error('Error starting camera:', error);
      throw error;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaState.cameraStream) {
      mediaState.cameraStream.getTracks().forEach(track => track.stop());
      setMediaState(prev => ({
        ...prev,
        isCameraOn: false,
        cameraStream: null,
      }));
    }
  }, [mediaState.cameraStream]);

  const startMicrophone = useCallback(async () => {
    try {
      const constraints = {
        audio: {
          deviceId: mediaState.selectedMicrophone !== 'default' ? { exact: mediaState.selectedMicrophone } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Set up audio visualization and volume control
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      const gainNode = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();
      
      source.connect(gainNode);
      gainNode.connect(analyser);
      gainNode.connect(destination);
      
      analyser.fftSize = 256;
      
      // Apply saved volume setting
      gainNode.gain.value = mediaState.microphoneVolume / 100;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      micGainNodeRef.current = gainNode;
      
      // Replace original stream with volume-controlled stream
      const originalTrack = stream.getAudioTracks()[0];
      stream.removeTrack(originalTrack);
      destination.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
      
      const updateAudioLevel = () => {
        if (analyserRef.current) {
          const bufferLength = analyserRef.current.frequencyBinCount;
          const dataArray = new Uint8Array(bufferLength);
          analyserRef.current.getByteFrequencyData(dataArray);
          
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          const normalized = average / 255;
          
          setMediaState(prev => ({
            ...prev,
            audioLevel: normalized,
          }));
        }
        animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
      };
      
      updateAudioLevel();
      
      setMediaState(prev => ({
        ...prev,
        isMicOn: true,
        microphoneStream: stream,
      }));
      
      return stream;
    } catch (error) {
      console.error('Error starting microphone:', error);
      throw error;
    }
  }, [mediaState.selectedMicrophone, mediaState.microphoneVolume]);

  const stopMicrophone = useCallback(() => {
    if (mediaState.microphoneStream) {
      mediaState.microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    audioContextRef.current = null;
    analyserRef.current = null;
    micGainNodeRef.current = null;
    
    setMediaState(prev => ({
      ...prev,
      isMicOn: false,
      microphoneStream: null,
      audioLevel: 0,
    }));
  }, [mediaState.microphoneStream]);

  const setMicrophoneVolume = useCallback((volume: number) => {
    setMediaState(prev => ({ ...prev, microphoneVolume: volume }));
    localStorage.setItem('kawaii-mic-volume', volume.toString());
    
    if (micGainNodeRef.current) {
      micGainNodeRef.current.gain.value = volume / 100;
    }
  }, []);

  const setScreenAudioVolume = useCallback((volume: number) => {
    setMediaState(prev => ({ ...prev, screenAudioVolume: volume }));
    localStorage.setItem('kawaii-screen-volume', volume.toString());
    
    if (screenGainNodeRef.current) {
      // Apply higher gain for better volume
      screenGainNodeRef.current.gain.value = (volume / 100) * 2;
    }
  }, []);

  const setSelectedMicrophone = useCallback((deviceId: string) => {
    setMediaState(prev => ({ ...prev, selectedMicrophone: deviceId }));
    localStorage.setItem('kawaii-selected-microphone', deviceId);
  }, []);

  const startRecording = useCallback(() => {
    // Create a new audio context for mixing audio streams
    const mixingContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const mixingDestination = mixingContext.createMediaStreamDestination();
    
    const combinedStream = new MediaStream();
    
    // Add video tracks from screen and camera
    if (mediaState.screenStream) {
      mediaState.screenStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
    }
    
    if (mediaState.cameraStream) {
      mediaState.cameraStream.getVideoTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
    }
    
    // Mix audio streams properly
    let hasAudio = false;
    
    // Add screen audio if available
    if (mediaState.screenStream && mediaState.screenStream.getAudioTracks().length > 0) {
      const screenAudioSource = mixingContext.createMediaStreamSource(mediaState.screenStream);
      const screenGain = mixingContext.createGain();
      screenGain.gain.value = (mediaState.screenAudioVolume / 100) * 2; // Higher gain for screen audio
      
      screenAudioSource.connect(screenGain);
      screenGain.connect(mixingDestination);
      hasAudio = true;
    }
    
    // Add microphone audio if available
    if (mediaState.microphoneStream && mediaState.microphoneStream.getAudioTracks().length > 0) {
      const micAudioSource = mixingContext.createMediaStreamSource(mediaState.microphoneStream);
      const micGain = mixingContext.createGain();
      micGain.gain.value = mediaState.microphoneVolume / 100;
      
      micAudioSource.connect(micGain);
      micGain.connect(mixingDestination);
      hasAudio = true;
    }
    
    // Add mixed audio track to combined stream
    if (hasAudio) {
      mixingDestination.stream.getAudioTracks().forEach(track => {
        combinedStream.addTrack(track);
      });
    }
    
    if (combinedStream.getTracks().length > 0) {
      recordedChunksRef.current = [];
      
      // Use a codec that supports both video and audio
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 2500000, // 2.5 Mbps for good quality
        audioBitsPerSecond: 128000,  // 128 kbps for good audio quality
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        const webmBlob = new Blob(recordedChunksRef.current, { type: mimeType });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Save as .mp4 extension for better compatibility
        downloadFile(webmBlob, `kawaii-recording-${timestamp}.mp4`);
        recordedChunksRef.current = [];
        
        // Clean up mixing context
        mixingContext.close();
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks for better reliability
      mediaRecorderRef.current = mediaRecorder;
      
      setMediaState(prev => ({
        ...prev,
        isRecording: true,
      }));
    } else {
      console.warn('No streams available for recording');
    }
  }, [mediaState.screenStream, mediaState.cameraStream, mediaState.microphoneStream, mediaState.screenAudioVolume, mediaState.microphoneVolume, downloadFile]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      
      setMediaState(prev => ({
        ...prev,
        isRecording: false,
      }));
    }
  }, []);

  return {
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
  };
};