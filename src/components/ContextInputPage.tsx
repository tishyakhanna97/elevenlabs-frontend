import { useState, useRef } from "react";
import { Mic, MicOff, Type, Loader2 } from "lucide-react";

interface ContextInputPageProps {
  onContextSubmit: (contextId: string, contextData: any) => void;
}

export default function ContextInputPage({
  onContextSubmit,
}: ContextInputPageProps) {
  const [inputMode, setInputMode] = useState<"text" | "voice">("text");
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [contextText, setContextText] = useState("");
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState(
    "Hello! This is a test message from the Speech Training app."
  );
  const [testConversationId, setTestConversationId] = useState("");
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
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await sendVoiceToAPI(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      alert("Unable to access microphone. Please check permissions.");
    }
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsTesting(true);
    setTestResult(null);

    try {
      const payload: Record<string, any> = {
        // matches `message` arg in Python
        message:
          testMessage ||
          "Hello! This is a test message from the Speech Training app.",

        // acts like `additional_data` in Python
        test: true,
        user_id: "test_user_123",
        session_id: "session_abc",
        metadata: {
          client: "web",
          app_version: "1.0.0",
          timestamp: new Date().toISOString(),
        },
      };

      // matches optional `conversation_id` arg in Python
      if (testConversationId.trim()) {
        payload.conversation_id = testConversationId.trim();
      }

      const response = await fetch(
        "https://mattferoz.app.n8n.cloud/webhook/eleven-labs-conversation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTestResult({
          success: true,
          message: `Connection successful! Response: ${JSON.stringify(
            data,
            null,
            2
          )}`,
        });
      } else {
        const text = await response.text().catch(() => "");
        setTestResult({
          success: false,
          message: `Connection failed with status: ${response.status}${
            text ? `, body: ${text}` : ""
          }`,
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: `Connection error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    } finally {
      setIsTesting(false);
    }
  };

  const sendVoiceToAPI = async (audioBlob: Blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio", audioBlob);

      const response = await fetch(
        "https://mattferoz.app.n8n.cloud/webhook/eleven-labs-conversation",
        {
          method: "POST",
          body: formData,
        }
      );

      if (response.ok) {
        const data = await response.json();
        setContextText(data.transcription || "");
      } else {
        alert("Failed to process voice input. Please try again.");
      }
    } catch (error) {
      console.error("Error sending voice to API:", error);
      alert("Error processing voice input. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async () => {
    if (!contextText.trim()) {
      alert("Please provide context for your speech.");
      return;
    }

    setIsProcessing(true);
    try {
      const tempContextId = `temp_${Date.now()}`;
      const contextData = { rawInput: contextText };

      onContextSubmit(tempContextId, contextData);
    } catch (error) {
      console.error("Error processing context:", error);
      alert("Failed to process context. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Speech Context
              </h1>
              <p className="text-gray-600 mt-1">
                Tell us about your upcoming speech
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-[2fr,1fr,auto] items-end">
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Test message
              </label>
              <input
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Enter a test prompt to send to the webhook"
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1">
                Conversation ID (optional)
              </label>
              <input
                value={testConversationId}
                onChange={(e) => setTestConversationId(e.target.value)}
                placeholder="e.g. test-123"
                className="px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
            <button
              onClick={handleTestWebhook}
              disabled={isTesting}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 h-[42px] mt-6"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                "Send Test"
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`mt-4 p-4 rounded-lg border ${
                testResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-lg">
                  {testResult.success ? "✅" : "❌"}
                </span>
                <div className="flex-1">
                  <p
                    className={`text-sm font-medium mb-1 ${
                      testResult.success ? "text-green-800" : "text-red-800"
                    }`}
                  >
                    {testResult.success
                      ? "Webhook Test Successful"
                      : "Webhook Test Failed"}
                  </p>
                  <pre
                    className={`text-xs whitespace-pre-wrap ${
                      testResult.success ? "text-green-700" : "text-red-700"
                    }`}
                  >
                    {testResult.message}
                  </pre>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setInputMode("text")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                inputMode === "text"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              <Type className="w-5 h-5" />
              Text Input
            </button>
            <button
              onClick={() => setInputMode("voice")}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                inputMode === "voice"
                  ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
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
                Include details about your audience, the context, what you hope
                to achieve, the tone, the length, and the language.
              </p>
            </div>

            {inputMode === "text" ? (
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
                    <p className="text-gray-600">
                      Processing your voice input...
                    </p>
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
                "Continue to Training"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
