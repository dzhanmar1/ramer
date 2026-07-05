import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConstructorView } from './components/constructor/ConstructorView';
import { AuthView } from './components/auth/AuthView';
import { DashboardView } from './components/dashboard/DashboardView';
import { SettingsView } from './components/settings/SettingsView';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div className="h-screen flex items-center justify-center">Загрузка...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={!session ? <AuthView /> : <Navigate to="/" />} 
        />
        <Route 
          path="/" 
          element={session ? <DashboardView /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/calc" 
          element={session ? <ConstructorView /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/settings" 
          element={session ? <SettingsView /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;
