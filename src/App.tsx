import { useEffect } from 'react';
import { Mic, SignalHigh, Settings, Clock3, Bot, Shield } from 'lucide-react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'elevenlabs-convai': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
        'agent-id'?: string;
      };
    }
  }
}

const AGENT_ID = 'agent_8001kc354fk2e7pbgy6knn629fe5';

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

  const openWidget = () => {
    const api =
      (window as any).ElevenLabsConvai ||
      (window as any).ElevenLabs ||
      (window as any).convai ||
      (window as any).Convai;

    if (api?.open) {
      api.open();
      return;
    }

    const widget = document.querySelector('elevenlabs-convai') as HTMLElement & { shadowRoot?: ShadowRoot };
    const trigger = widget?.shadowRoot?.querySelector('button');
    if (trigger instanceof HTMLElement) {
      trigger.click();
    }
  };

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <span>SpeechTrainer</span>
        </div>
        <div className="nav-actions">
          <div className="pill">
            <SignalHigh size={16} /> Connection: Excellent
          </div>
          <div className="pill" aria-label="settings">
            <Settings size={16} />
          </div>
        </div>
      </nav>

      <main className="main">
        <div className="status-badge">
          <span className="dot" style={{ width: 10, height: 10, background: '#5be294', borderRadius: '999px' }} />
          AI Coach Online
        </div>
        <h1>Let's Practice Speaking</h1>
        <p className="lead">Refine your pronunciation and fluency. No login required, just pure practice.</p>

        <div className="mic-wrap">
          <div className="mic-button" aria-label="Start speaking" role="button" tabIndex={0} onClick={openWidget}>
            <Mic />
          </div>
        </div>

        <div className="ready">Ready to listen...</div>
        <div className="subtext">Click the circle above to begin your session</div>

        <div className="divider" />
      </main>

      <section className="features">
        <div className="feature">
          <div className="icon-circle">
            <Clock3 size={18} />
          </div>
          <div>
            <div className="feature-title">Unlimited</div>
            <div className="feature-copy">Practice Time</div>
          </div>
        </div>
        <div className="feature">
          <div className="icon-circle" style={{ background: 'rgba(88,196,255,0.12)', color: '#58c4ff' }}>
            <Bot size={18} />
          </div>
          <div>
            <div className="feature-title">Instant</div>
            <div className="feature-copy">AI Feedback</div>
          </div>
        </div>
        <div className="feature">
          <div className="icon-circle" style={{ background: 'rgba(147, 112, 255, 0.12)', color: '#a78bfa' }}>
            <Shield size={18} />
          </div>
          <div>
            <div className="feature-title">Private</div>
            <div className="feature-copy">No Data Stored</div>
          </div>
        </div>
      </section>

      <div style={{ textAlign: 'center', paddingBottom: 20 }}>
        <elevenlabs-convai agent-id={AGENT_ID}></elevenlabs-convai>
        <p className="widget-hint">Widget appears in the bottom-right corner.</p>
      </div>

      <footer className="footer">© 2024 SpeechTrainer AI. All rights reserved.</footer>
    </div>
  );
}

export default App;
