import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home } from 'lucide-react';

export function AuthForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { signUp, signIn, resetPassword } = useAuth();

  const hasMinLength = password.length >= 6;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\\/]/.test(password);
  const isPasswordValid = hasMinLength && hasSpecialChar;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp && !isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    setLoading(true);

    try {
      const { error } = isSignUp
        ? await signUp(email, password)
        : await signIn(email, password);

      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await resetPassword(email);

      if (error) {
        setError(error.message);
      } else {
        setResetEmailSent(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getBackgroundColor = () => {
    if (isForgotPassword) return 'from-amber-50 to-amber-100';
    if (isSignUp) return 'from-blue-50 to-blue-100';
    return 'from-slate-50 to-slate-100';
  };

  const getAccentColor = () => {
    if (isForgotPassword) return 'bg-amber-500';
    if (isSignUp) return 'bg-blue-500';
    return 'bg-emerald-500';
  };

  const getSubtitle = () => {
    if (isForgotPassword) return 'Enter your email to receive a password reset link';
    if (isSignUp) return 'Create your account to get started';
    return 'Track your home maintenance and protect your investment';
  };

  if (resetEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="p-3 rounded-xl bg-emerald-500">
                <Home className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
              Check Your Email
            </h1>
            <p className="text-center text-slate-600 mb-8">
              We've sent a password reset link to <strong>{email}</strong>. Please check your inbox and follow the instructions to reset your password.
            </p>

            <button
              onClick={() => {
                setResetEmailSent(false);
                setIsForgotPassword(false);
                setEmail('');
                setError('');
              }}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br flex items-center justify-center p-4 ${getBackgroundColor()}`}>
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className={`p-3 rounded-xl ${getAccentColor()}`}>
              <Home className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
            {isForgotPassword ? 'Reset Password' : 'Home Life Notes'}
          </h1>
          <p className="text-center text-slate-600 mb-8">
            {getSubtitle()}
          </p>

          <form onSubmit={isForgotPassword ? handlePasswordReset : handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:border-transparent transition ${
                  isForgotPassword
                    ? 'focus:ring-amber-500'
                    : isSignUp
                    ? 'focus:ring-blue-500'
                    : 'focus:ring-emerald-500'
                }`}
                placeholder="you@example.com"
              />
            </div>

            {!isForgotPassword && (
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:border-transparent transition ${
                    isSignUp
                      ? 'focus:ring-blue-500'
                      : 'focus:ring-emerald-500'
                  }`}
                  placeholder="••••••••"
                />
                {isSignUp && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center text-sm">
                      <span className={`mr-2 ${hasMinLength ? 'text-blue-600' : 'text-slate-400'}`}>
                        {hasMinLength ? '✓' : '○'}
                      </span>
                      <span className={hasMinLength ? 'text-blue-600' : 'text-slate-600'}>
                        At least 6 characters
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <span className={`mr-2 ${hasSpecialChar ? 'text-blue-600' : 'text-slate-400'}`}>
                        {hasSpecialChar ? '✓' : '○'}
                      </span>
                      <span className={hasSpecialChar ? 'text-blue-600' : 'text-slate-600'}>
                        One special character (!@#$%^&*...)
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed ${
                isForgotPassword
                  ? 'bg-amber-500 hover:bg-amber-600'
                  : isSignUp
                  ? 'bg-blue-500 hover:bg-blue-600'
                  : 'bg-emerald-500 hover:bg-emerald-600'
              }`}
            >
              {loading ? 'Please wait...' : isForgotPassword ? 'Send Reset Link' : isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          {!isForgotPassword && !isSignUp && (
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsForgotPassword(true);
                  setError('');
                }}
                className="text-sm font-medium text-amber-600 hover:text-amber-700 transition"
              >
                Forgot password?
              </button>
            </div>
          )}

          <div className="mt-6 text-center">
            {isForgotPassword ? (
              <button
                onClick={() => {
                  setIsForgotPassword(false);
                  setError('');
                }}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition"
              >
                Back to Sign In
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError('');
                }}
                className={`text-sm font-medium transition ${
                  isSignUp
                    ? 'text-blue-600 hover:text-blue-700'
                    : 'text-emerald-600 hover:text-emerald-700'
                }`}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
