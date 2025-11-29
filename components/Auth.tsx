
import React, { useState, useEffect } from 'react';
import { User, Role, Invitation } from '../types';
import { Gift, Users, Heart, ArrowRight, UserPlus, Sparkles, CheckCircle2, ArrowLeft, Mail } from 'lucide-react';
import { storageService } from '../services/storage';

interface AuthProps {
  onLogin: (user: User) => Promise<void>;
}

type AuthView = 'LANDING' | 'LOGIN' | 'REGISTER';

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [view, setView] = useState<AuthView>('LANDING');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  
  // Invitation State
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkToken = async () => {
      // Check URL for token
      const params = new URLSearchParams(window.location.search);
      const token = params.get('token');
      
      if (token) {
          try {
              const invite = await storageService.getInvitationByToken(token);
              if (invite) {
                  setInvitation(invite);
                  setName(invite.guestName);
              } else {
                  // Invalid or used token
                  window.history.replaceState({}, '', window.location.pathname);
                  alert("Dieser Einladungslink ist ungültig oder wurde bereits verwendet.");
              }
          } catch (error) {
              console.error("Failed to fetch invitation:", error);
              window.history.replaceState({}, '', window.location.pathname);
              alert("Ein Fehler ist aufgetreten. Bitte versuche es später erneut.");
          }
      }
      setLoading(false);
    }
    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine role: if invitation exists, use its target role. If generic login/reg, default to PARENT.
    const userRole: Role = invitation ? invitation.targetRole : 'PARENT';
    const description = invitation ? invitation.guestRoleDescription : undefined;

    const newUser: User = {
      id: crypto.randomUUID(),
      name,
      email,
      role: userRole,
      roleDescription: description
    };

    try {
      if (invitation) {
          await storageService.markInvitationUsed(invitation.id);
          // Clean URL
          window.history.replaceState({}, '', window.location.pathname);
      }
      await onLogin(newUser);
    } catch (error) {
      console.error("Login failed:", error);
      alert("Anmeldung fehlgeschlagen. Bitte versuche es erneut.");
    }
  };

  if (loading) return null;

  // 1. INVITATION VIEW (Priority if token exists)
  if (invitation) {
      const isPartnerInvite = invitation.targetRole === 'PARENT';
      
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-white to-pink-50 p-4 font-sans">
             <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md border border-white/50 text-center relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-400 to-pink-400"></div>
                 
                 <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border-4 border-white ${isPartnerInvite ? 'bg-indigo-100' : 'bg-pink-100'}`}>
                    {isPartnerInvite ? (
                        <UserPlus className="text-indigo-600 w-10 h-10" />
                    ) : (
                        <Heart className="text-pink-600 w-10 h-10" />
                    )}
                 </div>
                 
                 <h1 className="text-3xl font-bold text-slate-800 mb-2 tracking-tight">Hallo {invitation.guestName}!</h1>
                 <p className="text-slate-600 mb-6 text-lg">
                     Du wurdest eingeladen, {isPartnerInvite ? 'den Eltern-Account' : 'die Wunschbox'} mitzuverwalten oder anzusehen.
                 </p>
                 
                 {invitation.customMessage && (
                    <div className="bg-indigo-50/50 p-6 rounded-2xl text-slate-700 italic mb-8 relative border border-indigo-100">
                        <span className="absolute -top-3 left-6 bg-white px-2 text-2xl text-indigo-300 leading-none">❝</span>
                        {invitation.customMessage}
                        <span className="absolute -bottom-3 right-6 bg-white px-2 text-2xl text-indigo-300 leading-none">❞</span>
                    </div>
                 )}
                 
                 <button 
                    onClick={handleSubmit}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-slate-200 flex items-center justify-center gap-3 group text-lg"
                 >
                     {isPartnerInvite ? 'Partner-Account beitreten' : 'Wunschbox ansehen'} 
                     <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                 </button>
             </div>
        </div>
      )
  }

  // 2. LANDING PAGE VIEW
  if (view === 'LANDING') {
      return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-pink-50 flex flex-col">
            <header className="px-6 py-6 max-w-6xl mx-auto w-full flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 text-xl">W</div>
                    <span className="font-bold text-slate-800 text-lg">Wunschbox</span>
                </div>
                <button onClick={() => setView('LOGIN')} className="text-sm font-medium text-slate-600 hover:text-indigo-600 px-4 py-2 hover:bg-white rounded-full transition-all">
                    Anmelden
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center px-4 text-center max-w-4xl mx-auto w-full py-12">
                <div className="mb-8 inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm border border-indigo-50 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-medium text-slate-600">Für deine Familie</span>
                </div>

                <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-tight animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
                    Schenken ohne <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-pink-600">Stress</span>.
                </h1>
                
                <p className="text-xl text-slate-600 mb-12 max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
                    Willkommen auf der Wunschbox. Koordinieren Sie Geschenke für Geburtstage und Weihnachten ganz einfach online und vermeiden Sie doppelte Überraschungen.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
                    <button 
                        onClick={() => setView('REGISTER')}
                        className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-xl shadow-indigo-200 transition-all transform hover:-translate-y-1"
                    >
                        Eltern-Account erstellen
                    </button>
                    <button 
                        onClick={() => setView('LOGIN')}
                        className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-4 rounded-xl shadow-md border border-slate-200 transition-all"
                    >
                        Login
                    </button>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-8 mt-20 w-full text-left">
                    {[
                        { icon: Gift, title: "Wünsche erfüllen", desc: "Seht genau, was sich die Kinder wünschen." },
                        { icon: CheckCircle2, title: "Keine Doppelten", desc: "Geschenke werden markiert, sobald sie reserviert sind." },
                        { icon: Users, title: "Einfach Teilen", desc: "Einladungslink an Gotti, Götti und Verwandte senden." }
                    ].map((feature, i) => (
                        <div key={i} className="bg-white/60 p-6 rounded-2xl border border-white/50 shadow-sm hover:shadow-md transition-shadow">
                            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4 text-indigo-600">
                                <feature.icon className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-slate-800 mb-2">{feature.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed">{feature.desc}</p>
                        </div>
                    ))}
                </div>
            </main>

            <footer className="py-8 text-center text-slate-400 text-sm">
                <p>Hast du einen Einladungslink? Nutze diesen, um direkt zur Wunschbox zu gelangen.</p>
            </footer>
        </div>
      );
  }

  // 3. LOGIN / REGISTER FORM VIEW
  const isRegister = view === 'REGISTER';
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-md relative animate-in fade-in zoom-in-95 duration-200">
        <button 
            onClick={() => setView('LANDING')}
            className="absolute top-8 left-8 p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
            title="Zurück"
        >
            <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="text-center mb-8 mt-4">
          <div className="bg-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-200">
            <Gift className="text-white w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{isRegister ? 'Account erstellen' : 'Willkommen zurück'}</h1>
          <p className="text-slate-500 mt-2">
            {isRegister ? 'Erstelle einen Account, um die Wunschbox zu verwalten.' : 'Melde dich an, um Geschenke zu bearbeiten.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dein Name</label>
            <div className="relative">
                <Users className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-slate-800"
                    placeholder="z.B. Mama"
                />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-Mail Adresse</label>
            <div className="relative">
                <Mail className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                    type="email"
                    value={email}
                    required={isRegister}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 outline-none transition-all text-slate-800"
                    placeholder="name@beispiel.ch"
                />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-200 mt-2"
          >
            {isRegister ? 'Los gehts' : 'Anmelden'}
          </button>
        </form>

        <div className="mt-8 text-center">
            <p className="text-slate-500 text-sm">
                {isRegister ? 'Bereits einen Account?' : 'Noch keinen Account?'} 
                <button
                    onClick={() => setView(isRegister ? 'LOGIN' : 'REGISTER')}
                    className="text-indigo-600 hover:text-indigo-800 font-bold ml-1 hover:underline"
                >
                    {isRegister ? 'Anmelden' : 'Registrieren'}
                </button>
            </p>
        </div>
      </div>
    </div>
  );
};
