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
  const originalMicStreamRef = useRef<MediaStream | null>(null);
  const originalScreenStreamRef = useRef<MediaStream | null>(null);

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
      
      // Store original stream for recording
      originalScreenStreamRef.current = stream.clone();
      
      // Set up audio context for screen audio volume control (for preview only)
      if (stream.getAudioTracks().length > 0) {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const source = audioContext.createMediaStreamSource(stream);
        const gainNode = audioContext.createGain();
        const destination = audioContext.createMediaStreamDestination();
        
        source.connect(gainNode);
        gainNode.connect(destination);
        
        // Apply saved volume setting
        gainNode.gain.value = mediaState.screenAudioVolume / 100;
        screenGainNodeRef.current = gainNode;
        
        // Replace audio track with volume-controlled one for preview
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
    if (originalScreenStreamRef.current) {
      originalScreenStreamRef.current.getTracks().forEach(track => track.stop());
      originalScreenStreamRef.current = null;
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

      const originalStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // Store the original, unprocessed stream for recording
      originalMicStreamRef.current = originalStream.clone();
      
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
      
      return previewStream;
    } catch (error) {
      console.error('Error starting microphone:', error);
      throw error;
    }
  }, [mediaState.selectedMicrophone, mediaState.microphoneVolume]);

  const stopMicrophone = useCallback(() => {
    if (mediaState.microphoneStream) {
      mediaState.microphoneStream.getTracks().forEach(track => track.stop());
    }
    if (originalMicStreamRef.current) {
      originalMicStreamRef.current.getTracks().forEach(track => track.stop());
      originalMicStreamRef.current = null;
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
      screenGainNodeRef.current.gain.value = volume / 100;
    }
  }, []);

  const setSelectedMicrophone = useCallback((deviceId: string) => {
    setMediaState(prev => ({ ...prev, selectedMicrophone: deviceId }));
    localStorage.setItem('kawaii-selected-microphone', deviceId);
  }, []);

  const createCombinedStream = useCallback(() => {
    const combinedStream = new MediaStream();
    
    // Priority 1: Screen video (if available)
    if (originalScreenStreamRef.current) {
      const videoTracks = originalScreenStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        console.log('Adding screen video track to recording');
        combinedStream.addTrack(videoTracks[0]); // Only add the first video track
      }
    }
    // Priority 2: Camera video (only if no screen video)
    else if (mediaState.cameraStream) {
      const videoTracks = mediaState.cameraStream.getVideoTracks();
      if (videoTracks.length > 0) {
        console.log('Adding camera video track to recording');
        combinedStream.addTrack(videoTracks[0]); // Only add the first video track
      }
    }
    
    // Add screen audio (original, unprocessed)
    if (originalScreenStreamRef.current) {
      const audioTracks = originalScreenStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        console.log('Adding screen audio track to recording');
        combinedStream.addTrack(track);
      });
    }
    
    // Add microphone audio (original, unprocessed)
    if (originalMicStreamRef.current) {
      const audioTracks = originalMicStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        console.log('Adding microphone audio track to recording');
        combinedStream.addTrack(track);
      });
    }
    
    console.log('Combined stream tracks:', combinedStream.getTracks().map(t => ({ 
      kind: t.kind, 
      label: t.label,
      id: t.id.slice(0, 8) + '...'
    })));
    
    return combinedStream;
  }, [mediaState.cameraStream]);

  const startRecording = useCallback(() => {
    const combinedStream = createCombinedStream();
    
    if (combinedStream.getTracks().length === 0) {
      console.warn('No streams available for recording');
      return;
    }
    
    recordedChunksRef.current = [];
    
    // Prioritize H.264 + AAC for maximum compatibility
    const codecOptions = [
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2', // H.264 Baseline + AAC-LC (best compatibility)
      'video/mp4;codecs=avc1.4D401E,mp4a.40.2', // H.264 Main + AAC-LC
      'video/mp4;codecs=avc1.64001E,mp4a.40.2', // H.264 High + AAC-LC
      'video/mp4', // Generic MP4
      'video/webm;codecs=vp9,opus', // VP9 + Opus (good quality)
      'video/webm;codecs=vp8,opus', // VP8 + Opus (fallback)
      'video/webm' // Generic WebM
    ];
    
    let selectedMimeType = 'video/webm'; // Ultimate fallback
    for (const codec of codecOptions) {
      if (MediaRecorder.isTypeSupported(codec)) {
        selectedMimeType = codec;
        console.log('Selected codec:', codec);
        break;
      }
    }
    
    try {
      const options: MediaRecorderOptions = {
        mimeType: selectedMimeType,
      };
      
      // Add bitrate settings for supported codecs
      if (selectedMimeType.includes('mp4') || selectedMimeType.includes('h264')) {
        options.videoBitsPerSecond = 5000000; // 5 Mbps for H.264
        options.audioBitsPerSecond = 128000;  // 128 kbps for AAC
      } else if (selectedMimeType.includes('webm')) {
        options.videoBitsPerSecond = 3000000; // 3 Mbps for WebM
        options.audioBitsPerSecond = 128000;  // 128 kbps for Opus
      }
      
      const mediaRecorder = new MediaRecorder(combinedStream, options);
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
          console.log('Recorded chunk:', event.data.size, 'bytes');
        }
      };
      
      mediaRecorder.onstop = () => {
        console.log('Recording stopped, processing', recordedChunksRef.current.length, 'chunks');
        
        if (recordedChunksRef.current.length === 0) {
          console.error('No recorded chunks available');
          return;
        }
        
        const blob = new Blob(recordedChunksRef.current, { type: selectedMimeType });
        console.log('Final blob size:', blob.size, 'bytes, type:', blob.type);
        
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        // Use appropriate file extension
        const extension = selectedMimeType.includes('mp4') ? 'mp4' : 'webm';
        const filename = `kawaii-recording-${timestamp}.${extension}`;
        
        downloadFile(blob, filename);
        recordedChunksRef.current = [];
        
        console.log('Recording saved as:', filename);
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorder error:', event);
      };
      
      // Start recording with 1-second chunks for better reliability
      mediaRecorder.start(1000);
      mediaRecorderRef.current = mediaRecorder;
      
      console.log('Recording started with codec:', selectedMimeType);
      
      setMediaState(prev => ({
        ...prev,
        isRecording: true,
      }));
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  }, [createCombinedStream, downloadFile]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      console.log('Stopping recording...');
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