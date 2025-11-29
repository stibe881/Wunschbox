
import React, { useState } from 'react';
import { Child, User, Gender } from '../types';
import { storageService } from '../services/storage';
import { X, Plus, Trash2, Calendar, Baby, User as UserIcon } from 'lucide-react';

interface ChildManagerProps {
  onClose: () => void;
  currentUser: User;
  onUpdate: () => void;
}

const calculateAge = (birthDate: string): string => {
  if (!birthDate) return '';
  const birth = new Date(birthDate);
  const now = new Date();
  
  let years = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    years--;
  }

  if (years < 1) {
      // Show months
      const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      return `${months} Monate`;
  }
  return `${years} Jahre`;
};

export const ChildManager: React.FC<ChildManagerProps> = ({ onClose, currentUser, onUpdate }) => {
  const [children, setChildren] = useState<Child[]>(storageService.getChildren());
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newGender, setNewGender] = useState<Gender>('MALE');

  const handleAddChild = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newBirthDate) return;

    const child: Child = {
        id: crypto.randomUUID(),
        name: newName,
        birthDate: newBirthDate,
        gender: newGender,
        createdByUserId: currentUser.id
    };

    storageService.saveChild(child);
    setChildren(storageService.getChildren());
    setNewName('');
    setNewBirthDate('');
    setNewGender('MALE');
    onUpdate();
  };

  const handleDeleteChild = (id: string) => {
      if (window.confirm('Möchtest du dieses Kind wirklich löschen?')) {
          storageService.deleteChild(id);
          setChildren(storageService.getChildren());
          onUpdate();
      }
  };

  const getGenderIcon = (gender: Gender) => {
      if (gender === 'MALE') return '👦';
      if (gender === 'FEMALE') return '👧';
      return '👶';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-pink-100 rounded-lg text-pink-600">
                <Baby className="w-5 h-5" />
             </div>
             <h2 className="text-lg font-bold text-slate-800">Meine Kinder</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
            {/* List */}
            <div className="space-y-3 mb-8">
                {children.length === 0 ? (
                    <p className="text-center text-slate-400 py-4 italic">Noch keine Kinder erfasst.</p>
                ) : (
                    children.map(child => (
                        <div key={child.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    {child.name} <span className="text-base" title={child.gender}>{getGenderIcon(child.gender)}</span>
                                </h3>
                                <div className="flex items-center gap-2 text-slate-500 text-xs mt-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>{new Date(child.birthDate).toLocaleDateString('de-CH')}</span>
                                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-medium">{calculateAge(child.birthDate)}</span>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteChild(child.id)}
                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))
                )}
            </div>

            {/* Add Form */}
            <div className="border-t border-slate-100 pt-6">
                <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">Kind hinzufügen</h4>
                <form onSubmit={handleAddChild} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                        <input 
                            type="text" 
                            required
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none text-slate-800"
                            placeholder="Vorname"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Geburtsdatum</label>
                        <input 
                            type="date" 
                            required
                            value={newBirthDate}
                            onChange={e => setNewBirthDate(e.target.value)}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none text-slate-800"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Geschlecht</label>
                        <div className="flex gap-2">
                            {[
                                { val: 'MALE', label: 'Junge', icon: '👦' },
                                { val: 'FEMALE', label: 'Mädchen', icon: '👧' },
                                { val: 'OTHER', label: 'Neutral', icon: '👶' }
                            ].map(opt => (
                                <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() => setNewGender(opt.val as Gender)}
                                    className={`flex-1 py-2 px-3 rounded-lg border text-sm flex items-center justify-center gap-2 transition-all ${newGender === opt.val ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                >
                                    <span>{opt.icon}</span> {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button 
                        type="submit"
                        className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-2"
                    >
                        <Plus className="w-4 h-4" /> Speichern
                    </button>
                </form>
            </div>
        </div>
      </div>
    </div>
  );
};