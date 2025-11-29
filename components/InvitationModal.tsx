
import React, { useState } from 'react';
import { X, Copy, Check, Send, Mail, UserPlus, Heart } from 'lucide-react';
import { User, Invitation, Role } from '../types';
import { storageService } from '../services/storage';

interface InvitationModalProps {
  onClose: () => void;
  currentUser: User;
}

export const InvitationModal: React.FC<InvitationModalProps> = ({ onClose, currentUser }) => {
  const [activeTab, setActiveTab] = useState<Role>('RELATIVE');
  
  const [guestName, setGuestName] = useState('');
  const [roleDescription, setRoleDescription] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName) return;
    
    // For parents, we set description to 'Elternteil' automatically if not provided
    const finalRoleDesc = activeTab === 'PARENT' ? (roleDescription || 'Elternteil') : roleDescription;
    if (activeTab === 'RELATIVE' && !finalRoleDesc) return;

    const token = crypto.randomUUID();
    const invitation: Invitation = {
      id: crypto.randomUUID(),
      token,
      guestName,
      guestRoleDescription: finalRoleDesc,
      targetRole: activeTab,
      customMessage,
      createdByUserId: currentUser.id,
      createdAt: Date.now(),
      isUsed: false
    };

    storageService.createInvitation(invitation);

    const url = `${window.location.origin}${window.location.pathname}?token=${token}`;
    setGeneratedLink(url);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendEmail = () => {
    const subject = activeTab === 'PARENT' 
        ? `Einladung: Verwalte die Wunschliste von Levin & Lina mit mir`
        : `Einladung zur Wunschliste von Levin & Lina`;
    
    const body = `Hallo ${guestName},\n\n` +
                 (customMessage ? `${customMessage}\n\n` : '') +
                 `Hier ist der Link zur Wunschliste:\n${generatedLink}\n\n` +
                 `Liebe Grüsse,\n${currentUser.name}`;
    
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  const reset = () => {
    setGeneratedLink('');
    setGuestName('');
    setRoleDescription('');
    setCustomMessage('');
    setCopied(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Jemanden einladen</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="flex border-b border-slate-100">
            <button 
                onClick={() => { setActiveTab('RELATIVE'); reset(); }}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'RELATIVE' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <Heart className="w-4 h-4" /> Verwandte & Freunde
            </button>
            <button 
                onClick={() => { setActiveTab('PARENT'); reset(); }}
                className={`flex-1 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${activeTab === 'PARENT' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <UserPlus className="w-4 h-4" /> Partner / Elternteil
            </button>
        </div>

        <div className="p-6">
            {!generatedLink ? (
                <form onSubmit={handleGenerate} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Name des Gastes</label>
                        <input 
                            type="text" 
                            required
                            value={guestName}
                            onChange={e => setGuestName(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none text-slate-800"
                            placeholder={activeTab === 'PARENT' ? "Name deines Partners" : "z.B. Anna"}
                        />
                    </div>

                    {activeTab === 'RELATIVE' && (
                         <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Rolle / Beziehung</label>
                            <input 
                                type="text" 
                                required
                                value={roleDescription}
                                onChange={e => setRoleDescription(e.target.value)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none text-slate-800"
                                placeholder="z.B. Gotti, Opa, Tante"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Persönliche Nachricht (Optional)</label>
                        <textarea 
                            value={customMessage}
                            onChange={e => setCustomMessage(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:border-indigo-500 outline-none h-24 resize-none text-slate-800"
                            placeholder="Schreibe hier einen persönlichen Text für die Einladung..."
                        />
                    </div>

                    <button 
                        type="submit"
                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-indigo-200"
                    >
                        <Send className="w-4 h-4" /> Link erstellen
                    </button>
                </form>
            ) : (
                <div className="text-center animate-in fade-in zoom-in duration-300">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Einladungslink erstellt!</h3>
                    <p className="text-sm text-slate-500 mb-6">
                        Sende diesen Link an {guestName}, damit {activeTab === 'PARENT' ? 'er/sie Zugriff erhält' : 'er/sie sich ein Geschenk aussuchen kann'}.
                    </p>
                    
                    <div className="bg-slate-100 p-3 rounded-lg flex items-center gap-2 mb-4 border border-slate-200">
                        <input 
                            type="text" 
                            readOnly 
                            value={generatedLink}
                            className="bg-transparent border-none text-xs text-slate-600 w-full outline-none font-mono"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={copyToClipboard}
                            className={`py-2 px-4 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-900'}`}
                        >
                            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            {copied ? 'Kopiert' : 'Kopieren'}
                        </button>
                        <button 
                            onClick={sendEmail}
                            className="py-2 px-4 rounded-lg bg-indigo-50 text-indigo-700 text-sm font-medium hover:bg-indigo-100 transition-colors flex items-center justify-center gap-2"
                        >
                            <Mail className="w-4 h-4" /> E-Mail
                        </button>
                    </div>

                    <button 
                        onClick={reset}
                        className="mt-6 text-sm text-slate-400 hover:text-slate-600 underline"
                    >
                        Weitere Person einladen
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
