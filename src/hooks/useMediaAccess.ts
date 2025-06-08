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
    screenAudioVolume: 80,
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
  
  // CRITICAL: Keep the original microphone stream separate and persistent
  const originalMicStreamRef = useRef<MediaStream | null>(null);
  const microphoneDeviceRef = useRef<string>('default');

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
      console.log('🎤 Starting microphone...');
      
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

      const originalStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('🎤 Got original microphone stream:', originalStream.id);
      
      // CRITICAL: Store the original stream for recording - NEVER replace this
      originalMicStreamRef.current = originalStream;
      microphoneDeviceRef.current = mediaState.selectedMicrophone;
      
      // Create a separate stream for preview/monitoring with volume control
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(originalStream);
      const gainNode = audioContext.createGain();
      const destination = audioContext.createMediaStreamDestination();
      
      source.connect(gainNode);
      gainNode.connect(analyser);
      gainNode.connect(destination);
      
      analyser.fftSize = 256;
      
      // Apply saved volume setting for monitoring only
      gainNode.gain.value = mediaState.microphoneVolume / 100;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      micGainNodeRef.current = gainNode;
      
      // Use the volume-controlled stream for preview/monitoring only
      const previewStream = destination.stream;
      
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
        microphoneStream: previewStream, // This is just for preview
      }));
      
      console.log('✅ Microphone started successfully');
      return previewStream;
    } catch (error) {
      console.error('Error starting microphone:', error);
      throw error;
    }
  }, [mediaState.selectedMicrophone, mediaState.microphoneVolume]);

  const stopMicrophone = useCallback(() => {
    console.log('🎤 Stopping microphone...');
    
    if (mediaState.microphoneStream) {
      mediaState.microphoneStream.getTracks().forEach(track => track.stop());
    }
    
    // CRITICAL: Don't stop the original stream if we're recording!
    if (originalMicStreamRef.current && !mediaState.isRecording) {
      console.log('🎤 Stopping original microphone stream');
      originalMicStreamRef.current.getTracks().forEach(track => track.stop());
      originalMicStreamRef.current = null;
    } else if (mediaState.isRecording) {
      console.log('🎤 Keeping original microphone stream for recording');
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
  }, [mediaState.microphoneStream, mediaState.isRecording]);

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
    console.log('🎬 Starting recording...');
    console.log('📊 Current state:', {
      screenSharing: mediaState.isScreenSharing,
      microphoneOn: mediaState.isMicOn,
      cameraOn: mediaState.isCameraOn,
      hasOriginalMicStream: !!originalMicStreamRef.current,
      hasScreenStream: !!mediaState.screenStream,
    });
    
    const combinedStream = new MediaStream();
    let trackCount = 0;
    
    // Add video tracks from screen (primary video source)
    if (mediaState.screenStream) {
      mediaState.screenStream.getVideoTracks().forEach(track => {
        console.log('📺 Adding screen video track:', track.label || 'Screen Video');
        combinedStream.addTrack(track);
        trackCount++;
      });
      
      // Add screen audio tracks
      mediaState.screenStream.getAudioTracks().forEach(track => {
        console.log('🔊 Adding screen audio track:', track.label || 'Screen Audio');
        combinedStream.addTrack(track);
        trackCount++;
      });
    }
    
    // CRITICAL: Add the ORIGINAL microphone stream for recording
    if (originalMicStreamRef.current) {
      originalMicStreamRef.current.getAudioTracks().forEach(track => {
        console.log('🎤 Adding microphone track:', {
          label: track.label || 'Microphone',
          enabled: track.enabled,
          readyState: track.readyState,
          muted: track.muted
        });
        
        // Ensure the track is enabled and not muted
        track.enabled = true;
        
        combinedStream.addTrack(track);
        trackCount++;
      });
    } else {
      console.error('❌ NO MICROPHONE STREAM AVAILABLE FOR RECORDING!');
      console.log('🔍 Debug info:', {
        isMicOn: mediaState.isMicOn,
        originalMicStreamExists: !!originalMicStreamRef.current,
        microphoneDevice: microphoneDeviceRef.current
      });
    }
    
    // Add camera video if no screen sharing (fallback)
    if (!mediaState.screenStream && mediaState.cameraStream) {
      mediaState.cameraStream.getVideoTracks().forEach(track => {
        console.log('📷 Adding camera video track:', track.label || 'Camera');
        combinedStream.addTrack(track);
        trackCount++;
      });
    }
    
    console.log(`🎵 Total tracks added: ${trackCount}`);
    console.log('🎵 Combined stream tracks:', combinedStream.getTracks().map(t => ({ 
      kind: t.kind, 
      label: t.label || `${t.kind} track`,
      enabled: t.enabled, 
      readyState: t.readyState,
      muted: t.muted
    })));
    
    if (combinedStream.getTracks().length > 0) {
      recordedChunksRef.current = [];
      
      // Use the most compatible codec
      const codecOptions = [
        'video/mp4;codecs=h264,aac',
        'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];
      
      let mimeType = 'video/webm'; // fallback
      for (const codec of codecOptions) {
        if (MediaRecorder.isTypeSupported(codec)) {
          mimeType = codec;
          console.log('✅ Using codec:', mimeType);
          break;
        }
      }
      
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps for high quality
        audioBitsPerSecond: 320000,  // 320 kbps for high quality audio
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log('📦 Recording chunk received:', event.data.size, 'bytes');
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('🛑 Recording stopped, processing...');
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        console.log('💾 Final recording blob size:', blob.size, 'bytes');
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Use appropriate file extension
        const extension = mimeType.includes('mp4') ? 'mp4' : 'webm';
        downloadFile(blob, `kawaii-recording-${timestamp}.${extension}`);
        recordedChunksRef.current = [];
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('❌ MediaRecorder error:', event);
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('🔴 Recording started successfully!');
      
      setMediaState(prev => ({
        ...prev,
        isRecording: true,
      }));
    } else {
      console.warn('⚠️ No streams available for recording');
    }
  }, [mediaState.screenStream, mediaState.cameraStream, mediaState.isMicOn, downloadFile]);

  const stopRecording = useCallback(() => {
    console.log('⏹️ Stopping recording...');
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
      
      setMediaState(prev => ({
        ...prev,
        isRecording: false,
      }));
      
      console.log('✅ Recording stopped successfully!');
    }
    
    // Clean up the original microphone stream only if microphone is off
    if (!mediaState.isMicOn && originalMicStreamRef.current) {
      console.log('🧹 Cleaning up original microphone stream after recording');
      originalMicStreamRef.current.getTracks().forEach(track => track.stop());
      originalMicStreamRef.current = null;
    }
  }, [mediaState.isMicOn]);

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