
import React from 'react';
import { Gift, User, Priority } from '../types';
import { ExternalLink, Gift as GiftIcon, Edit2, Trash2, Check, UserCheck, Tag, UserPlus, RotateCcw } from 'lucide-react';

interface GiftCardProps {
  gift: Gift;
  currentUser: User;
  onToggleStatus: (gift: Gift) => void;
  onEdit: (gift: Gift) => void;
  onDelete: (giftId: string) => void;
  onProxyMark?: (gift: Gift) => void;
}

const PriorityBadge: React.FC<{ priority: Priority }> = ({ priority }) => {
    switch (priority) {
        case 'HIGH':
            return <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-100 flex items-center gap-1">❤️ Sehr wichtig</span>;
        case 'MEDIUM':
            return <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-100 flex items-center gap-1">✨ Wichtig</span>;
        case 'LOW':
            return <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">🌤️ Optional</span>;
        default:
            return null;
    }
};

export const GiftCard: React.FC<GiftCardProps> = ({ gift, currentUser, onToggleStatus, onEdit, onDelete, onProxyMark }) => {
  const isParent = currentUser.role === 'PARENT';
  // Allow toggle if: User is parent (admin override) OR Item is not gifted OR Item is gifted by CURRENT user
  const canToggle = isParent || !gift.isGifted || gift.giftedByUserId === currentUser.id;

  return (
    <div className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 border ${gift.isGifted ? 'border-green-100 bg-green-50/30' : 'border-slate-100'}`}>
      
      {/* Status Badge */}
      {gift.isGifted && (
        <div className="absolute top-4 right-4 z-10 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm border border-green-200 backdrop-blur-sm bg-opacity-90">
          <UserCheck className="w-3 h-3" />
          {gift.giftedByUserName ? `Geschenkt von ${gift.giftedByUserName}` : 'Geschenkt'}
        </div>
      )}

      {/* Image Section */}
      <div className="aspect-video w-full overflow-hidden rounded-t-2xl relative bg-slate-100">
        {gift.imageUrl ? (
          <img 
            src={gift.imageUrl} 
            alt={gift.title} 
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${gift.isGifted ? 'grayscale-[50%]' : ''}`} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-300">
            <GiftIcon className="w-12 h-12" />
          </div>
        )}
        
        {/* Child Badge Overlay */}
        <div className="absolute bottom-2 left-2 flex gap-1">
             <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm ${gift.childName === 'Levin' ? 'bg-blue-100 text-blue-700' : 'bg-pink-100 text-pink-700'}`}>
                {gift.childName}
            </span>
        </div>

        {/* Quick Actions Overlay for Parents */}
        {isParent && (
            <div className="absolute top-2 left-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onEdit(gift); }} 
                    className="p-2 bg-white/90 backdrop-blur text-slate-600 rounded-full hover:text-indigo-600 shadow-sm" 
                    title="Bearbeiten"
                >
                    <Edit2 className="w-4 h-4" />
                </button>
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onDelete(gift.id); }} 
                    className="p-2 bg-white/90 backdrop-blur text-slate-600 rounded-full hover:text-red-600 shadow-sm" 
                    title="Löschen"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="mb-3 flex items-center gap-2 flex-wrap">
            <PriorityBadge priority={gift.priority} />
            <span className="flex items-center gap-1 text-[10px] font-medium bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full border border-slate-200">
                <Tag className="w-3 h-3" /> {gift.category}
            </span>
        </div>

        <h3 className={`font-bold text-lg leading-tight mb-1 ${gift.isGifted ? 'text-slate-500 line-through decoration-slate-300' : 'text-slate-800'}`}>
            {gift.title}
        </h3>
        
        <p className="text-sm text-slate-500 mb-3">{gift.purpose}</p>

        <div className="flex items-center justify-between mt-4">
            <div className="text-sm font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded">
                {gift.priceMin > 0 ? (
                    <>
                        {gift.priceMin} - {gift.priceMax} {gift.currency}
                    </>
                ) : 'Preis unbekannt'}
            </div>

            <div className="flex gap-2">
                {gift.shopUrl && (
                    <a 
                        href={gift.shopUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-colors"
                        title="Zum Shop"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <ExternalLink className="w-5 h-5" />
                    </a>
                )}
            </div>
        </div>

        {/* Action Button */}
        <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
            {gift.isGifted ? (
                canToggle ? (
                    <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(gift); }}
                    className="w-full py-2 px-4 rounded-lg bg-red-500 text-white text-sm font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <RotateCcw className="w-4 h-4" />
                    Wieder freigeben?
                </button>
                ) : (
                    <button type="button" disabled className="w-full py-2 px-4 rounded-lg bg-slate-50 text-slate-400 text-sm font-medium cursor-not-allowed">
                         Bereits reserviert
                    </button>
                )
            ) : (
                <>
                <button 
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onToggleStatus(gift); }}
                    className="w-full py-2 px-4 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 flex items-center justify-center gap-2"
                >
                    <GiftIcon className="w-4 h-4" />
                    Ich schenke das!
                </button>
                {isParent && onProxyMark && (
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onProxyMark(gift); }}
                        className="w-full py-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors flex items-center justify-center gap-1"
                    >
                        <UserPlus className="w-3 h-3" /> Manuell als geschenkt markieren
                    </button>
                )}
                </>
            )}
        </div>
      </div>
    </div>
  );
};
