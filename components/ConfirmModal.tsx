
import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-xl font-bold text-slate-800">{title}</h2>
            <p className="text-slate-500 mt-2">{message}</p>
        </div>
        <div className="p-4 bg-slate-50 grid grid-cols-2 gap-3">
            <button
                type="button"
                onClick={onClose}
                className="py-2 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-100 transition-colors"
            >
                Abbrechen
            </button>
            <button
                type="button"
                onClick={onConfirm}
                className="py-2 px-4 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 transition-all"
            >
                Bestätigen
            </button>
        </div>
      </div>
    </div>
  );
};
