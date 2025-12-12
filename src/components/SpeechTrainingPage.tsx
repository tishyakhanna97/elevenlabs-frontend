import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Loader2, ArrowLeft } from 'lucide-react';

interface SpeechTrainingPageProps {
  contextId: string;
  contextData: any;
  onBack: () => void;
}

export default function SpeechTrainingPage({ contextId, contextData, onBack }: SpeechTrainingPageProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAvatarSpeaking, setIsAvatarSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<Array<{ speaker: 'user' | 'avatar'; text: string }>>([]);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    startInitialGreeting();
  }, []);

  const startInitialGreeting = () => {
    setIsAvatarSpeaking(true);
    setTranscript([{ speaker: 'avatar', text: 'Hello! I\'m your speech training coach. I\'m here to help you prepare for your speech. Let\'s start by having you introduce your topic.' }]);
    setTimeout(() => setIsAvatarSpeaking(false), 3000);
  };

  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await sendAudioToAPI(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions.');
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const sendAudioToAPI = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('context_id', contextId);
      if (sessionId) {
        formData.append('session_id', sessionId);
      }

      const response = await fetch('/api/speech', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();

        if (data.transcription) {
          setTranscript(prev => [...prev, { speaker: 'user', text: data.transcription }]);
        }

        if (data.audioUrl) {
          await playAvatarResponse(data.audioUrl, data.responseText);
        } else if (data.responseText) {
          setTranscript(prev => [...prev, { speaker: 'avatar', text: data.responseText }]);
        }
      } else {
        alert('Failed to process audio. Please try again.');
      }
    } catch (error) {
      console.error('Error sending audio to API:', error);
      alert('Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const playAvatarResponse = async (audioUrl: string, responseText: string) => {
    if (isMuted) {
      setTranscript(prev => [...prev, { speaker: 'avatar', text: responseText }]);
      return;
    }

    setIsAvatarSpeaking(true);
    setTranscript(prev => [...prev, { speaker: 'avatar', text: responseText }]);

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.onended = () => setIsAvatarSpeaking(false);
      try {
        await audioRef.current.play();
      } catch (error) {
        console.error('Error playing audio:', error);
        setIsAvatarSpeaking(false);
      }
    }
  };

  const handleEndSession = () => {
    onBack();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="max-w-6xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <button
            onClick={handleEndSession}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>End Session</span>
          </button>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span>{isMuted ? 'Unmute' : 'Mute'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div className={`w-64 h-64 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center transition-all duration-300 ${
                  isAvatarSpeaking ? 'scale-105 shadow-2xl' : 'scale-100 shadow-xl'
                }`}>
                  <div className="w-56 h-56 rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center">
                    <div className="text-6xl">👤</div>
                  </div>
                </div>
                {isAvatarSpeaking && (
                  <>
                    <div className="absolute inset-0 w-64 h-64 rounded-full bg-blue-500 opacity-25 animate-ping"></div>
                    <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Speech Coach</h2>
                <p className="text-gray-600">
                  {isAvatarSpeaking ? 'Speaking...' : isProcessing ? 'Thinking...' : 'Ready to listen'}
                </p>
              </div>

              <div className="w-full pt-4">
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                  </div>
                ) : isRecording ? (
                  <button
                    onClick={handleStopRecording}
                    className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all flex items-center justify-center gap-2"
                  >
                    <MicOff className="w-6 h-6" />
                    Stop Speaking
                  </button>
                ) : (
                  <button
                    onClick={handleStartRecording}
                    disabled={isAvatarSpeaking}
                    className="w-full py-4 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Mic className="w-6 h-6" />
                    Start Speaking
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Conversation</h3>
            <div className="flex-1 overflow-y-auto space-y-4 max-h-[600px]">
              {transcript.map((entry, index) => (
                <div
                  key={index}
                  className={`flex ${entry.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-3 rounded-lg ${
                      entry.speaker === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white'
                        : 'bg-gray-100 text-gray-900'
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">
                      {entry.speaker === 'user' ? 'You' : 'Coach'}
                    </p>
                    <p>{entry.text}</p>
                  </div>
                </div>
              ))}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-900 px-4 py-3 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
