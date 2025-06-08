import { useState, useRef, useCallback } from 'react';

interface MediaState {
  isScreenSharing: boolean;
  isCameraOn: boolean;
  isMicOn: boolean;
  isRecording: boolean;
  screenStream: MediaStream | null;
  cameraStream: MediaStream | null;
  audioLevel: number;
}

export const useMediaAccess = () => {
  const [mediaState, setMediaState] = useState<MediaState>({
    isScreenSharing: false,
    isCameraOn: false,
    isMicOn: false,
    isRecording: false,
    screenStream: null,
    cameraStream: null,
    audioLevel: 0,
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

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
        video: { mediaSource: 'screen' },
        audio: true,
      });
      
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
  }, []);

  const stopScreenCapture = useCallback(() => {
    if (mediaState.screenStream) {
      mediaState.screenStream.getTracks().forEach(track => track.stop());
      setMediaState(prev => ({
        ...prev,
        isScreenSharing: false,
        screenStream: null,
      }));
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
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false,
      });
      
      // Set up audio visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
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
      }));
      
      return stream;
    } catch (error) {
      console.error('Error starting microphone:', error);
      throw error;
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    setMediaState(prev => ({
      ...prev,
      isMicOn: false,
      audioLevel: 0,
    }));
  }, []);

  const startRecording = useCallback(() => {
    const streams: MediaStream[] = [];
    if (mediaState.screenStream) streams.push(mediaState.screenStream);
    if (mediaState.cameraStream) streams.push(mediaState.cameraStream);
    
    if (streams.length > 0) {
      const combinedStream = new MediaStream();
      streams.forEach(stream => {
        stream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      });
      
      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(combinedStream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        downloadFile(blob, `kawaii-recording-${timestamp}.webm`);
        recordedChunksRef.current = [];
      };
      
      mediaRecorder.start(1000); // Record in 1-second chunks
      mediaRecorderRef.current = mediaRecorder;
      
      setMediaState(prev => ({
        ...prev,
        isRecording: true,
      }));
    }
  }, [mediaState.screenStream, mediaState.cameraStream, downloadFile]);

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
  };
};