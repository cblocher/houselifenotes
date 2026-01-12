import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Home } from 'lucide-react';

export function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const hasMinLength = password.length >= 6;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\\/]/.test(password);
  const isPasswordValid = hasMinLength && hasSpecialChar;
  const passwordsMatch = password === confirmPassword && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }

    if (!passwordsMatch) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-emerald-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex items-center justify-center mb-8">
              <div className="p-3 rounded-xl bg-emerald-500">
                <Home className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
              Password Updated
            </h1>
            <p className="text-center text-slate-600 mb-8">
              Your password has been successfully updated. You can now sign in with your new password.
            </p>

            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Go to Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-amber-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center justify-center mb-8">
            <div className="p-3 rounded-xl bg-amber-500">
              <Home className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">
            Set New Password
          </h1>
          <p className="text-center text-slate-600 mb-8">
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
              <div className="mt-2 space-y-1">
                <div className="flex items-center text-sm">
                  <span className={`mr-2 ${hasMinLength ? 'text-amber-600' : 'text-slate-400'}`}>
                    {hasMinLength ? '✓' : '○'}
                  </span>
                  <span className={hasMinLength ? 'text-amber-600' : 'text-slate-600'}>
                    At least 6 characters
                  </span>
                </div>
                <div className="flex items-center text-sm">
                  <span className={`mr-2 ${hasSpecialChar ? 'text-amber-600' : 'text-slate-400'}`}>
                    {hasSpecialChar ? '✓' : '○'}
                  </span>
                  <span className={hasSpecialChar ? 'text-amber-600' : 'text-slate-600'}>
                    One special character (!@#$%^&*...)
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                placeholder="••••••••"
              />
              {confirmPassword.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center text-sm">
                    <span className={`mr-2 ${passwordsMatch ? 'text-amber-600' : 'text-slate-400'}`}>
                      {passwordsMatch ? '✓' : '○'}
                    </span>
                    <span className={passwordsMatch ? 'text-amber-600' : 'text-slate-600'}>
                      Passwords match
                    </span>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !isPasswordValid || !passwordsMatch}
              className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
