
import React, { useEffect, useState } from 'react';
import { User, Gift, Notification, Category, Child } from './types';
import { storageService } from './services/storage';
import { Auth } from './components/Auth';
import { GiftCard } from './components/GiftCard';
import { GiftModal } from './components/GiftModal';
import { InvitationModal } from './components/InvitationModal';
import { SettingsModal } from './components/SettingsModal';
import { Plus, LogOut, User as UserIcon, Share2, Gift as GiftIcon, Bell, Filter, Settings } from 'lucide-react';

const CATEGORIES: (Category | 'ALL')[] = ['ALL', 'Spielzeug', 'Bücher', 'Kleidung', 'Sport', 'Elektronik', 'Erlebnis', 'Sonstiges'];

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  
  // Filters
  const [filterChild, setFilterChild] = useState<string>('ALL');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  // UI State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [editingGift, setEditingGift] = useState<Gift | undefined>(undefined);
  
  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      storageService.init();
      // Check if there is a token, if so, ignore local storage auth to force invitation check in Auth component
      const params = new URLSearchParams(window.location.search);
      if (!params.get('token')) {
        const currentUser = await storageService.getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          await refreshData(currentUser);
        }
      }
    }
    loadUser();
  }, []);

  const refreshData = async (currentUser: User) => {
    try {
      const gifts = await storageService.getGifts();
      setGifts(gifts);
      const children = await storageService.getChildren();
      setChildren(children);
      // Also update current user object in state from storage to catch settings changes
      const updatedUser = await storageService.getCurrentUser();
      if (updatedUser) setUser(updatedUser);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }

    if (currentUser.role === 'PARENT') {
        try {
            const notifications = await storageService.getNotifications('PARENT');
            setNotifications(notifications);
        } catch (error) {
            console.error("Failed to fetch notifications:", error);
        }
    }
  };

  const handleLogin = async (newUser: User) => {
    try {
      const savedUser = await storageService.login(newUser);
      setUser(savedUser);
      await refreshData(savedUser);
    } catch (error) {
      console.error("Failed to login:", error);
    }
  };

  const handleLogout = () => {
    storageService.logout();
    setUser(null);
  };

  const handleSaveGift = async (giftData: Partial<Gift>) => {
    const newGift: Gift = {
      id: editingGift ? editingGift.id : crypto.randomUUID(),
      title: giftData.title || 'Unbenannt',
      purpose: giftData.purpose || '',
      priceMin: giftData.priceMin || 0,
      priceMax: giftData.priceMax || 0,
      currency: giftData.currency || 'CHF',
      imageUrl: giftData.imageUrl || '',
      shopUrl: giftData.shopUrl || '',
      childName: giftData.childName || (children.length > 0 ? children[0].name : 'Kind'),
      priority: giftData.priority || 'MEDIUM',
      category: giftData.category || 'Spielzeug',
      isGifted: editingGift ? editingGift.isGifted : false,
      giftedByUserId: editingGift?.giftedByUserId,
      giftedByUserName: editingGift?.giftedByUserName,
      createdAt: editingGift ? editingGift.createdAt : Date.now(),
    };

    try {
      await storageService.saveGift(newGift);
      if (user) await refreshData(user);
    } catch (error) {
      console.error("Failed to save gift:", error);
    }
    setIsModalOpen(false);
    setEditingGift(undefined);
  };

  const handleDeleteGift = async (id: string) => {
    if (window.confirm('Möchtest du dieses Geschenk wirklich löschen?')) {
      try {
        await storageService.deleteGift(id);
        if (user) await refreshData(user);
      } catch (error) {
        console.error("Failed to delete gift:", error);
      }
    }
  };

  const handleToggleStatus = async (gift: Gift) => {
    if (!user) return;

    if (gift.isGifted) {
        // UNMARKING FLOW
        if (user.role === 'PARENT') {
             // Parent can force unmark anyone's gift
             if (window.confirm(`Möchtest du das Geschenk "${gift.title}" wirklich wieder freigeben?`)) {
                 await storageService.unmarkGift(gift.id);
                 await refreshData(user);
             }
        } else {
             // Standard user can only unmark if they were the giver
             await storageService.toggleGiftStatus(gift.id, user.id, user.name);
             await refreshData(user);
        }
    } else {
        // MARKING FLOW (Gift it)
        await storageService.toggleGiftStatus(gift.id, user.id, user.name);
        await refreshData(user);
    }
  };

  const handleProxyMark = async (gift: Gift) => {
    if (!user || user.role !== 'PARENT') return;
    const name = window.prompt(`Wer schenkt "${gift.title}"? (Name eingeben)`);
    if (name && name.trim()) {
        await storageService.markGiftAsGiftedByProxy(gift.id, name.trim(), user.id);
        await refreshData(user);
    }
  };

  const handleReadNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && user && user.role === 'PARENT') {
        try {
            await storageService.markNotificationsRead('PARENT');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error("Failed to mark notifications as read:", error);
        }
    }
  };

  // Combine children from DB and any legacy names found in gifts
  const availableChildNames = Array.from(new Set([
      ...children.map(c => c.name),
      ...gifts.map(g => g.childName)
  ])).filter(Boolean).sort();

  const filteredGifts = gifts.filter(g => {
    const matchesChild = filterChild === 'ALL' || g.childName === filterChild;
    const matchesCategory = filterCategory === 'ALL' || g.category === filterCategory;
    return matchesChild && matchesCategory;
  }).sort((a, b) => {
      if (a.isGifted !== b.isGifted) return a.isGifted ? 1 : -1;
      const priorityMap = { 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
      if (priorityMap[a.priority] !== priorityMap[b.priority]) {
          return priorityMap[b.priority] - priorityMap[a.priority];
      }
      return b.createdAt - a.createdAt;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  if (!user) {
    return <Auth onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-md">W</div>
            <span className="font-bold text-slate-800 hidden sm:block">Wunschbox</span>
          </div>
          
          <div className="flex items-center gap-4">
             {/* Invite Button */}
            {user.role === 'PARENT' && (
                <>
                <button 
                    onClick={() => setIsInviteModalOpen(true)}
                    className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full hover:bg-indigo-100 transition-colors"
                >
                    <Share2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Einladen</span>
                </button>
                <button 
                    onClick={() => setIsSettingsOpen(true)}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all"
                    title="Einstellungen & Kinder"
                >
                    <Settings className="w-5 h-5" />
                </button>
                </>
            )}

            {/* Notification Bell (Parents only) */}
            {user.role === 'PARENT' && (
                <div className="relative">
                    <button 
                        onClick={handleReadNotifications}
                        className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all"
                    >
                        <Bell className="w-5 h-5" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border border-white"></span>
                        )}
                    </button>
                    
                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-100 z-40 overflow-hidden animate-in fade-in slide-in-from-top-2">
                            <div className="p-3 border-b border-slate-100 bg-slate-50">
                                <h3 className="text-sm font-semibold text-slate-700">Benachrichtigungen</h3>
                            </div>
                            <div className="max-h-80 overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-slate-400 text-sm">
                                        Keine neuen Nachrichten
                                    </div>
                                ) : (
                                    notifications.map(n => (
                                        <div key={n.id} className={`p-3 border-b border-slate-50 hover:bg-slate-50 ${!n.read ? 'bg-indigo-50/30' : ''}`}>
                                            <p className="text-sm text-slate-800">{n.message}</p>
                                            <span className="text-xs text-slate-400 mt-1 block">
                                                {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-slate-900">{user.name}</p>
                    <p className="text-xs text-slate-500">{user.roleDescription || (user.role === 'PARENT' ? 'Eltern' : 'Gast')}</p>
                </div>
                <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                    <UserIcon className="w-5 h-5" />
                </div>
                <button onClick={handleLogout} className="text-slate-400 hover:text-red-500 ml-2" title="Abmelden">
                    <LogOut className="w-5 h-5" />
                </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        
        {/* Intro / Filter */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                    Geschenke {filterChild === 'ALL' ? '' : `für ${filterChild}`}
                </h1>
                <p className="text-slate-600 max-w-xl">
                    Hier findet ihr Dinge, die sich die Kinder wünschen.
                    {user.role === 'RELATIVE' && ' Sucht euch einfach etwas aus und klickt auf "Ich schenke das".'}
                </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
                {/* Child Filter */}
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-sm self-start overflow-x-auto max-w-full">
                    <button
                        onClick={() => setFilterChild('ALL')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterChild === 'ALL' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                    >
                        Alle
                    </button>
                    {availableChildNames.map((name) => (
                        <button
                            key={name}
                            onClick={() => setFilterChild(name)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${filterChild === name ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
                        >
                            {name}
                        </button>
                    ))}
                </div>

                {/* Category Filter */}
                <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Filter className="w-4 h-4" />
                    </div>
                    <select 
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="pl-9 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-100 outline-none appearance-none shadow-sm cursor-pointer hover:border-indigo-300 transition-colors w-full sm:w-auto text-slate-800"
                    >
                        {CATEGORIES.map(cat => (
                            <option key={cat} value={cat}>{cat === 'ALL' ? 'Alle Kategorien' : cat}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>

        {/* Gift Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredGifts.map(gift => (
                <GiftCard 
                    key={gift.id} 
                    gift={gift} 
                    currentUser={user}
                    onToggleStatus={handleToggleStatus}
                    onEdit={(g) => { setEditingGift(g); setIsModalOpen(true); }}
                    onDelete={handleDeleteGift}
                    onProxyMark={handleProxyMark}
                />
            ))}
            
            {/* Empty State */}
            {filteredGifts.length === 0 && (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                    <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <GiftIcon className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-medium text-slate-900">Keine Geschenke gefunden</h3>
                    <p className="text-slate-500">Für diese Auswahl gibt es aktuell keine Wünsche.</p>
                    {user.role === 'PARENT' && (
                        <button 
                            onClick={() => { setEditingGift(undefined); setIsModalOpen(true); }}
                            className="mt-4 text-indigo-600 font-medium hover:underline"
                        >
                            Jetzt erstes Geschenk hinzufügen
                        </button>
                    )}
                </div>
            )}
        </div>
      </main>

      {/* Floating Action Button for Parents */}
      {user.role === 'PARENT' && (
        <button
          onClick={() => { setEditingGift(undefined); setIsModalOpen(true); }}
          className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-xl shadow-indigo-300 hover:bg-indigo-700 hover:scale-105 transition-all z-40 group"
          title="Geschenk hinzufügen"
        >
          <Plus className="w-6 h-6" />
        </button>
      )}

      {/* Modal */}
      {isModalOpen && (
        <GiftModal 
            onClose={() => { setIsModalOpen(false); setEditingGift(undefined); }} 
            onSave={handleSaveGift}
            initialGift={editingGift}
            childrenList={children}
        />
      )}

      {/* Invitation Modal */}
      {isInviteModalOpen && user.role === 'PARENT' && (
          <InvitationModal 
            onClose={() => setIsInviteModalOpen(false)}
            currentUser={user}
          />
      )}

       {/* Settings / Child Manager Modal */}
       {isSettingsOpen && user.role === 'PARENT' && (
          <SettingsModal 
            onClose={() => setIsSettingsOpen(false)}
            currentUser={user}
            childrenList={children}
            onUpdate={() => refreshData(user)}
          />
      )}
    </div>
  );
};

export default App;
