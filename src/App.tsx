import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import ContextInputPage from './components/ContextInputPage';
import SpeechTrainingPage from './components/SpeechTrainingPage';
import { Loader2 } from 'lucide-react';

type AppState = 'context' | 'training';

function AppContent() {
  const { user, loading } = useAuth();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

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

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
