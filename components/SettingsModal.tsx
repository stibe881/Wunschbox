
import React, { useState } from 'react';
import { Child, User, Gender, Contact } from '../types';
import { storageService } from '../services/storage';
import { X, Plus, Trash2, Calendar, Baby, Settings, Mail, Bell, ToggleLeft, ToggleRight, BookUser, User as UserIcon } from 'lucide-react';
import { AddressBookModal } from './AddressBookModal';
import { ProfileModal } from './ProfileModal';

interface SettingsModalProps {
  onClose: () => void;
  currentUser: User;
  childrenList: Child[];
  onUpdate: () => void;
  onDelete: () => void;
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

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, currentUser, childrenList, onUpdate, onDelete }) => {
  const [activeTab, setActiveTab] = useState<'CHILDREN' | 'NOTIFICATIONS' | 'ADDRESS_BOOK' | 'PROFILE'>('CHILDREN');
  const [isAddressBookModalOpen, setIsAddressBookModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  // Children Form State
  const [newName, setNewName] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newGender, setNewGender] = useState<Gender>('MALE');

  // Notification State
  const [emailEnabled, setEmailEnabled] = useState<boolean>(currentUser.emailNotificationsEnabled ?? true);

  // --- Children Logic ---
  const handleAddChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newBirthDate) return;

    const child: Child = {
        id: crypto.randomUUID(),
        name: newName,
        birthDate: newBirthDate,
        gender: newGender,
        createdByUserId: currentUser.id
    };

    try {
      await storageService.saveChild(child, true);
      setNewName('');
      setNewBirthDate('');
      setNewGender('MALE');
      onUpdate(); // Refresh parent to get new list
    } catch (error) {
      console.error("Failed to save child:", error);
    }
  };

  const handleDeleteChild = async (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (window.confirm('Möchtest du dieses Kind wirklich löschen?')) {
        try {
          await storageService.deleteChild(id);
          onUpdate(); // Refresh parent to get new list
        } catch (error) {
          console.error("Failed to delete child:", error);
        }
      }
  };

  const getGenderIcon = (gender: Gender) => {
      if (gender === 'MALE') return '👦';
      if (gender === 'FEMALE') return '👧';
      return '👶';
  };

  // --- Notification Logic ---
  const toggleEmail = async () => {
      const newValue = !emailEnabled;
      setEmailEnabled(newValue);
      
      const updatedUser = { ...currentUser, emailNotificationsEnabled: newValue };
      try {
        await storageService.updateUser(updatedUser);
        onUpdate(); 
      } catch (error) {
        console.error("Failed to update user:", error);
        // Revert the state if the update fails
        setEmailEnabled(!newValue);
      }
  };
  
  const navItems = [
    { id: 'CHILDREN', label: 'Meine Kinder', icon: Baby },
    { id: 'ADDRESS_BOOK', label: 'Adressbuch', icon: BookUser },
    { id: 'PROFILE', label: 'Profil', icon: UserIcon },
    { id: 'NOTIFICATIONS', label: 'Benachrichtigungen', icon: Bell },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Left Navigation */}
        <div className="w-1/4 bg-slate-50 border-r border-slate-200 p-4 flex flex-col">
          <div className="flex items-center gap-2 mb-8">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                <Settings className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Einstellungen</h2>
          </div>
          <nav className="space-y-2">
            {navItems.map(item => (
              <button 
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === item.id ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-200'}`}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          <div className="mt-auto">
            <button onClick={onClose} className="w-full text-center p-2 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors text-sm">
              Schliessen
            </button>
          </div>
        </div>

        {/* Right Content */}
        <div className="w-3/4 p-8 overflow-y-auto">
            {activeTab === 'CHILDREN' && (
                <div className="animate-in fade-in">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Meine Kinder verwalten</h3>
                    <div className="space-y-3 mb-8">
                        {childrenList.length === 0 ? (
                            <p className="text-center text-slate-400 py-4 italic">Noch keine Kinder erfasst.</p>
                        ) : (
                            childrenList.map(child => (
                                <div key={child.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
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
                                    <button onClick={(e) => handleDeleteChild(child.id, e)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full">
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
            {activeTab === 'ADDRESS_BOOK' && (
                <div className="animate-in fade-in">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Adressbuch</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Verwalte deine Kontakte, um Einladungen schneller zu versenden.
                    </p>
                    <button onClick={() => setIsAddressBookModalOpen(true)} className="w-full bg-indigo-600 text-white py-3 rounded-lg">
                        <BookUser className="inline-block w-4 h-4 mr-2" /> Adressbuch öffnen
                    </button>
                </div>
            )}
            {activeTab === 'PROFILE' && (
                <div className="animate-in fade-in">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Profil</h3>
                    <p className="text-slate-500 text-sm mb-6">
                        Bearbeite deine Profildaten oder lösche dein Profil.
                    </p>
                    <button onClick={() => setIsProfileModalOpen(true)} className="w-full bg-indigo-600 text-white py-3 rounded-lg">
                        <UserIcon className="inline-block w-4 h-4 mr-2" /> Profil bearbeiten
                    </button>
                </div>
            )}
            {activeTab === 'NOTIFICATIONS' && (
                 <div className="animate-in fade-in">
                    <h3 className="text-2xl font-bold text-slate-800 mb-6">Benachrichtigungen</h3>
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
        
        {isAddressBookModalOpen && <AddressBookModal onClose={() => setIsAddressBookModalOpen(false)} currentUser={currentUser} />}
        {isProfileModalOpen && <ProfileModal onClose={() => setIsProfileModalOpen(false)} currentUser={currentUser} onUpdate={onUpdate} onDelete={onDelete} />}
      </div>
    </div>
  );
};
