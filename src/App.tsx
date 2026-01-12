import { useEffect, useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { Dashboard } from './components/Dashboard';
import { ResetPassword } from './components/ResetPassword';

function App() {
  const { user, loading } = useAuth();
  const [isPasswordReset, setIsPasswordReset] = useState(false);

  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');

    if (type === 'recovery') {
      setIsPasswordReset(true);
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-600">Loading...</div>
      </div>
    );
  }

  if (isPasswordReset) {
    return <ResetPassword />;
  }

  return user ? <Dashboard /> : <AuthForm />;
}

export default App;
