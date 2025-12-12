import { useState } from 'react';
import ContextInputPage from './components/ContextInputPage';
import SpeechTrainingPage from './components/SpeechTrainingPage';

type AppState = 'context' | 'training';

function App() {
  const [appState, setAppState] = useState<AppState>('context');
  const [currentContextId, setCurrentContextId] = useState<string | null>(null);
  const [currentContextData, setCurrentContextData] = useState<any>(null);

  const handleContextSubmit = (contextId: string, contextData: any) => {
    setCurrentContextId(contextId);
    setCurrentContextData(contextData);
    setAppState('training');
  };

  const handleBackToContext = () => {
    setAppState('context');
    setCurrentContextId(null);
    setCurrentContextData(null);
  };

  if (appState === 'context') {
    return <ContextInputPage onContextSubmit={handleContextSubmit} />;
  }

  if (appState === 'training' && currentContextId && currentContextData) {
    return (
      <SpeechTrainingPage
        contextId={currentContextId}
        contextData={currentContextData}
        onBack={handleBackToContext}
      />
    );
  }

  return <ContextInputPage onContextSubmit={handleContextSubmit} />;
}

export default App;
