
import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storage';
import { X, User as UserIcon, Mail, Lock, Trash2 } from 'lucide-react';

interface ProfileModalProps {
  onClose: () => void;
  currentUser: User;
  onUpdate: () => void;
  onDelete: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ onClose, currentUser, onUpdate, onDelete }) => {
  const [name, setName] = useState(currentUser.name);
  const [email, setEmail] = useState(currentUser.email);
  const [password, setPassword] = useState('');

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const updatedUser: User = {
      ...currentUser,
      name,
      email,
    };
    if (password) {
      updatedUser.password = password;
    }
    await storageService.updateUser(updatedUser);
    onUpdate();
    onClose();
  };

  const handleDelete = async () => {
      if (window.confirm('Möchten Sie Ihr Profil wirklich endgültig löschen? Alle Ihre Daten gehen verloren.')) {
        await storageService.deleteUser(currentUser.id);
        onDelete();
        onClose();
      }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Profil bearbeiten</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <form onSubmit={handleUpdate} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">E-Mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border rounded-lg" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Neues Kennwort (optional)</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border rounded-lg" placeholder="Leer lassen, um es nicht zu ändern" />
            </div>
          </div>
          <div className="pt-4 flex justify-between items-center">
            <button type="submit" className="bg-slate-900 text-white py-2 px-4 rounded-lg font-medium">Speichern</button>
            <button type="button" onClick={handleDelete} className="text-red-500 hover:text-red-700 text-sm font-medium flex items-center gap-1">
              <Trash2 className="w-4 h-4" /> Profil löschen
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
