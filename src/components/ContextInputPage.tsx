import { useState, useRef } from 'react';
import { Mic, MicOff, Type, Loader2, LogOut } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ContextInputPageProps {
  onContextSubmit: (contextId: string, contextData: any) => void;
}

export default function ContextInputPage({ onContextSubmit }: ContextInputPageProps) {
  const { user, signOut } = useAuth();
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contextText, setContextText] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

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
        await sendVoiceToAPI(audioBlob);
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

  const sendVoiceToAPI = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);

      const response = await fetch('/api/context', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setContextText(data.transcription || '');
      } else {
        alert('Failed to process voice input. Please try again.');
      }
    } catch (error) {
      console.error('Error sending voice to API:', error);
      alert('Error processing voice input. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!contextText.trim()) {
      alert('Please provide context for your speech.');
      return;
    }

    setIsProcessing(true);
    try {
      const { data: contextData, error } = await supabase
        .from('speech_contexts')
        .insert({
          user_id: user?.id,
          context_data: { rawInput: contextText },
          input_mode: inputMode,
        })
        .select()
        .maybeSingle();

      if (error) throw error;

      if (contextData) {
        onContextSubmit(contextData.id, contextData.context_data);
      }
    } catch (error) {
      console.error('Error saving context:', error);
      alert('Failed to save context. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Speech Context</h1>
            <p className="text-gray-600 mt-1">Tell us about your upcoming speech</p>
          </div>
          <button
            onClick={() => signOut()}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setInputMode('text')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                inputMode === 'text'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Type className="w-5 h-5" />
              Text Input
            </button>
            <button
              onClick={() => setInputMode('voice')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                inputMode === 'voice'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Mic className="w-5 h-5" />
              Voice Input
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                Tell us about the speech you want to make
              </h2>
              <p className="text-gray-600 text-sm mb-4">
                Include details about your audience, the context, what you hope to achieve, the tone,
                the length, and the language.
              </p>
            </div>

            {inputMode === 'text' ? (
              <textarea
                value={contextText}
                onChange={(e) => setContextText(e.target.value)}
                placeholder="Example: I'm preparing a keynote speech for a tech conference with 500 attendees. The audience consists of software engineers and tech executives. I want to inspire them about the future of AI, using an optimistic but grounded tone. The speech should be about 15 minutes long in English."
                className="w-full h-64 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-64 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
                {isProcessing ? (
                  <div className="text-center space-y-4">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto" />
                    <p className="text-gray-600">Processing your voice input...</p>
                  </div>
                ) : isRecording ? (
                  <div className="text-center space-y-4">
                    <div className="relative">
                      <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                        <Mic className="w-12 h-12 text-white" />
                      </div>
                      <div className="absolute inset-0 w-24 h-24 bg-red-500 rounded-full animate-ping opacity-25"></div>
                    </div>
                    <p className="text-gray-900 font-medium">Recording...</p>
                    <button
                      onClick={handleStopRecording}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-all"
                    >
                      <MicOff className="w-5 h-5 inline mr-2" />
                      Stop Recording
                    </button>
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                      <Mic className="w-12 h-12 text-white" />
                    </div>
                    <p className="text-gray-600">Click to start recording</p>
                    <button
                      onClick={handleStartRecording}
                      className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all"
                    >
                      Start Recording
                    </button>
                  </div>
                )}
                {contextText && !isRecording && !isProcessing && (
                  <div className="mt-4 p-4 bg-white rounded-lg max-w-xl">
                    <p className="text-sm text-gray-700">{contextText}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4">
            <button
              onClick={handleSubmit}
              disabled={isProcessing || !contextText.trim()}
              className="px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue to Training'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
