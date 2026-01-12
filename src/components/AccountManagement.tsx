import React, { useState, useEffect } from 'react';
import { User, Lock, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AccountManagementProps {
  userEmail: string;
  onAccountDeleted: () => void;
  onHasUnsavedChanges?: (hasChanges: boolean) => void;
}

export function AccountManagement({ userEmail, onAccountDeleted, onHasUnsavedChanges }: AccountManagementProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const hasMinLength = newPassword.length >= 6;
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

  useEffect(() => {
    const hasUnsavedPassword = newPassword.length > 0 || confirmPassword.length > 0;
    const hasUnsavedDelete = showDeleteConfirm && deleteConfirmText.length > 0;
    onHasUnsavedChanges?.(hasUnsavedPassword || hasUnsavedDelete);
  }, [newPassword, confirmPassword, showDeleteConfirm, deleteConfirmText]);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!hasMinLength || !hasSpecialChar) {
      setPasswordError('Password does not meet requirements');
      return;
    }

    if (!passwordsMatch) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setPasswordSuccess('Changes saved');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      setPasswordError(error instanceof Error ? error.message : 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No user found');
      }

      const { error: deleteError } = await supabase.rpc('delete_user_account');

      if (deleteError) throw deleteError;

      await supabase.auth.signOut();
      onAccountDeleted();
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : 'Failed to delete account');
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-slate-100 p-2 rounded-lg">
            <User className="w-5 h-5 text-slate-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Account Information</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <div className="px-4 py-3 bg-slate-50 rounded-lg text-slate-800 border border-slate-200">
              {userEmail}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-2 rounded-lg">
            <Lock className="w-5 h-5 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Change Password</h2>
        </div>

        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-slate-700 mb-2">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Enter new password"
            />
            {newPassword && (
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

          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-slate-700 mb-2">
              Confirm New Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              placeholder="Confirm new password"
            />
            {confirmPassword && (
              <div className="mt-2">
                <div className="flex items-center text-sm">
                  <span className={`mr-2 ${passwordsMatch ? 'text-blue-600' : 'text-slate-400'}`}>
                    {passwordsMatch ? '✓' : '○'}
                  </span>
                  <span className={passwordsMatch ? 'text-blue-600' : 'text-slate-600'}>
                    Passwords match
                  </span>
                </div>
              </div>
            )}
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {passwordSuccess}
            </div>
          )}

          <button
            type="submit"
            disabled={isChangingPassword || !newPassword || !confirmPassword}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-red-100 p-2 rounded-lg">
            <Trash2 className="w-5 h-5 text-red-600" />
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Delete Account</h2>
        </div>

        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-red-800">
                <p className="font-semibold mb-1">Warning: This action cannot be undone</p>
                <p>Deleting your account will permanently remove all your data including house details, maintenance records, and cost tracking information.</p>
              </div>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition"
            >
              Delete My Account
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label htmlFor="delete-confirm" className="block text-sm font-medium text-slate-700 mb-2">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </label>
                <input
                  id="delete-confirm"
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition"
                  placeholder="Type DELETE"
                />
              </div>

              {deleteError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {deleteError}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                    setDeleteError('');
                  }}
                  className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText !== 'DELETE'}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeletingAccount ? 'Deleting...' : 'Confirm Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
