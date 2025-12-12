import { useEffect } from 'react';

// Allow JSX to understand the custom element
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'agent-id'?: string;
      };
    }
  }
}

function App() {
  useEffect(() => {
    const existing = document.getElementById('elevenlabs-convai-script');
    if (existing) return;

    const script = document.createElement('script');
    script.id = 'elevenlabs-convai-script';
    script.src = 'https://unpkg.com/@elevenlabs/convai-widget-embed';
    script.async = true;
    script.type = 'text/javascript';
    document.body.appendChild(script);
  }, []);

  return (
    <>
      <div className="container">
        <h1>🎙️ AI Voice Agent</h1>
        <p className="subtitle">Test your Eleven Labs conversational AI agent connected to n8n</p>

        <div className="status-card">
          <div className="status-item">
            <span className="status-label">Agent ID</span>
            <span className="status-value">agent_8001kc354fk...nn629fe5</span>
          </div>
          <div className="status-item">
            <span className="status-label">Backend</span>
            <span className="status-value">n8n + OpenAI</span>
          </div>
          <div className="status-item">
            <span className="status-label">Status</span>
            <span className="status-value ready">● Ready</span>
          </div>
        </div>

        <div className="instructions">
          <h3>📋 How to test:</h3>
          <ol>
            <li>
              Click the <strong>microphone widget</strong> (bottom right)
            </li>
            <li>Allow microphone access when prompted</li>
            <li>Start speaking to the AI agent</li>
            <li>Wait for the AI to respond with voice</li>
          </ol>
        </div>

        <div className="widget-container">
          <elevenlabs-convai agent-id="agent_8001kc354fk2e7pbgy6knn629fe5"></elevenlabs-convai>
        </div>

        <span className="pulse-hint">👇 Widget should appear in the bottom right corner</span>
      </div>

      <footer>Powered by Eleven Labs + n8n</footer>
    </>
  );
}

export default App;
