import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemName: string;
  itemType?: string;
}

const STORAGE_KEY = 'hideDeleteConfirmation';

export function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  itemName,
  itemType = 'item'
}: DeleteConfirmationModalProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    onConfirm();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">
                Delete {itemType}?
              </h3>
              <p className="text-sm text-slate-600 mb-3">
                You are about to permanently delete <span className="font-semibold">{itemName}</span>.
                This action cannot be undone and all associated data will be removed from the database.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-4 flex items-center space-x-2">
          <input
            type="checkbox"
            id="dontShowAgain"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
          />
          <label htmlFor="dontShowAgain" className="text-sm text-slate-600 cursor-pointer">
            Don't show this warning again
          </label>
        </div>

        <div className="flex space-x-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            Delete Permanently
          </button>
        </div>
      </div>
    </div>
  );
}

export function shouldShowDeleteConfirmation(): boolean {
  return localStorage.getItem(STORAGE_KEY) !== 'true';
}
