
import React, { useState } from 'react';
import { Child, User, Gender } from '../types';
import { storageService } from '../services/storage';
import { X, Plus, Trash2, Calendar, Baby, Settings, Mail, Bell, ToggleLeft, ToggleRight } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  currentUser: User;
  childrenList: Child[];
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
      const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
      return `${months} Monate`;
  }
  return `${years} Jahre`;
};

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, currentUser, childrenList, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'CHILDREN' | 'NOTIFICATIONS'>('CHILDREN');
  
  // Children Form State
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newGender, setNewGender] = useState<Gender>('MALE');

  // Notification State
  const [emailEnabled, setEmailEnabled] = useState<boolean>(currentUser.emailNotificationsEnabled ?? true);

  // --- Children Logic ---
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
    setNewName('');
    setNewBirthDate('');
    setNewGender('MALE');
    onUpdate(); // Refresh parent to get new list
  };

  const handleDeleteChild = (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm('Möchtest du dieses Kind wirklich löschen?')) {
          storageService.deleteChild(id);
          onUpdate(); // Refresh parent to get new list
      }
  };

  const getGenderIcon = (gender: Gender) => {
      if (gender === 'MALE') return '👦';
      if (gender === 'FEMALE') return '👧';
      return '👶';
  };

  // --- Notification Logic ---
  const toggleEmail = () => {
      const newValue = !emailEnabled;
      setEmailEnabled(newValue);
      
      const updatedUser = { ...currentUser, emailNotificationsEnabled: newValue };
      storageService.updateUser(updatedUser);
      onUpdate(); 
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Settings className="w-5 h-5" />
             </div>
             <h2 className="text-lg font-bold text-slate-800">Einstellungen</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100">
            <button 
                onClick={() => setActiveTab('CHILDREN')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'CHILDREN' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Baby className="w-4 h-4" /> Meine Kinder
            </button>
            <button 
                onClick={() => setActiveTab('NOTIFICATIONS')}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'NOTIFICATIONS' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Bell className="w-4 h-4" /> Benachrichtigungen
            </button>
        </div>

        <div className="p-6">
            
            {/* CHILDREN TAB */}
            {activeTab === 'CHILDREN' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <div className="space-y-3 mb-8">
                        {childrenList.length === 0 ? (
                            <p className="text-center text-slate-400 py-4 italic">Noch keine Kinder erfasst.</p>
                        ) : (
                            childrenList.map(child => (
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
                                        type="button"
                                        onClick={(e) => handleDeleteChild(child.id, e)}
                                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

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
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'NOTIFICATIONS' && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <p className="text-slate-500 text-sm mb-6">
                        Entscheide, wie du über Aktivitäten in deiner Wunschbox informiert werden möchtest.
                    </p>

                    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-start gap-4">
                        <div className="p-3 bg-indigo-50 rounded-full text-indigo-600">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-slate-800">E-Mail Benachrichtigungen</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Erhalte eine E-Mail, wenn ein Verwandter ein Geschenk reserviert.
                            </p>
                        </div>
                        <button 
                            type="button"
                            onClick={toggleEmail}
                            className={`transition-colors ${emailEnabled ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
                        >
                            {emailEnabled ? (
                                <ToggleRight className="w-10 h-10" />
                            ) : (
                                <ToggleLeft className="w-10 h-10" />
                            )}
                        </button>
                    </div>
                    
                    {emailEnabled && (
                        <div className="mt-4 p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 flex gap-2">
                             <span className="font-bold">Info:</span>
                             E-Mails werden an {currentUser.email} gesendet.
                        </div>
                    )}
                </div>
            )}

        </div>
      </div>
    </div>
  );
};
