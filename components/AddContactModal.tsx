
import React, { useState } from 'react';
import { X, User as UserIcon, Mail } from 'lucide-react';
import { Contact } from '../types';

interface AddContactModalProps {
  onClose: () => void;
  onSave: (contact: Omit<Contact, 'id' | 'createdByUserId'>) => void;
}

export const AddContactModal: React.FC<AddContactModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, email });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Neuer Kontakt</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border rounded-lg" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">E-Mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pl-10 p-3 bg-slate-50 border rounded-lg" required />
            </div>
          </div>
          <div className="pt-2">
            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium">
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
