
import React, { useState, useRef, useEffect } from 'react';
import { Gift, AIGiftSuggestion, Priority, Category, Child } from '../types';
import { X, Sparkles, Loader2, Upload, Image as ImageIcon, Trash2 } from 'lucide-react';
import { generateGiftIdeas } from '../services/gemini';

interface GiftModalProps {
  onClose: () => void;
  onSave: (gift: Partial<Gift>) => void;
  initialGift?: Gift;
  childrenList: Child[];
}

const CATEGORIES: Category[] = ['Spielzeug', 'Bücher', 'Kleidung', 'Sport', 'Elektronik', 'Erlebnis', 'Sonstiges'];

// Calculate age helper reused
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

// Helper to resize image to prevent LocalStorage quota exceeded
const processImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        const width = 600; // Max width
        const scaleFactor = width / img.width;
        
        elem.width = width;
        elem.height = img.height * scaleFactor;
        
        const ctx = elem.getContext('2d');
        ctx?.drawImage(img, 0, 0, elem.width, elem.height);
        
        resolve(ctx?.canvas.toDataURL(file.type, 0.7) || '');
      };
      img.onerror = error => reject(error);
    };
    reader.onerror = error => reject(error);
  });
};

export const GiftModal: React.FC<GiftModalProps> = ({ onClose, onSave, initialGift, childrenList }) => {
  const [formData, setFormData] = useState<Partial<Gift>>(initialGift || {
    childName: childrenList.length > 0 ? childrenList[0].name : '',
    currency: 'CHF',
    priceMin: 0,
    priceMax: 0,
    priority: 'MEDIUM',
    category: 'Spielzeug',
    imageUrl: ''
  });

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // AI State
  const [showAI, setShowAI] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AIGiftSuggestion[]>([]);
  const [aiParams, setAiParams] = useState({ 
    childId: childrenList.length > 0 ? childrenList[0].id : '', 
    interests: '', 
    budget: '' 
  });

  // Update AI params when opening AI mode or selected child changes
  useEffect(() => {
    if (showAI && aiParams.childId) {
        const selectedChild = childrenList.find(c => c.id === aiParams.childId);
        if (selectedChild) {
            // Display age and gender based on selected child, but not editable
            const ageString = calculateAge(selectedChild.birthDate);
            const genderString = selectedChild.gender === 'MALE' ? 'Junge' : selectedChild.gender === 'FEMALE' ? 'Mädchen' : 'Neutral';
            // We don't store age/gender in aiParams anymore, but derive them for the prompt
        }
    } else if (showAI && childrenList.length > 0 && !aiParams.childId) {
        // Automatically select the first child if none is selected
        setAiParams(prev => ({ ...prev, childId: childrenList[0].id }));
    }
  }, [showAI, aiParams.childId, childrenList]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'priceMin' || name === 'priceMax' ? Number(value) : value
    }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingImage(true);
      try {
        const base64 = await processImage(e.target.files[0]);
        setFormData(prev => ({ ...prev, imageUrl: base64 }));
      } catch (error) {
        console.error("Image processing failed", error);
        alert("Fehler beim Laden des Bildes.");
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave = {
        ...formData,
        childName: formData.childName || (childrenList.length > 0 ? childrenList[0].name : 'Kind'),
        priority: formData.priority || 'MEDIUM',
        category: formData.category || 'Spielzeug'
    };
    onSave(dataToSave);
  };

  const handleGenerateIdeas = async () => {
    const selectedChild = childrenList.find(c => c.id === aiParams.childId);
    if (!selectedChild || !aiParams.interests) return;

    setAiLoading(true);
    const ideas = await generateGiftIdeas(
      selectedChild.name,
      calculateAge(selectedChild.birthDate),
      aiParams.interests,
      aiParams.budget,
      selectedChild.gender === 'MALE' ? 'Junge' : selectedChild.gender === 'FEMALE' ? 'Mädchen' : 'Neutral'
    );
    setAiSuggestions(ideas);
    setAiLoading(false);
  };

  const applySuggestion = (sug: AIGiftSuggestion) => {
    setFormData(prev => ({
      ...prev,
      title: sug.title,
      purpose: sug.description,
      priceMin: 0,
      priceMax: 0
    }));
    setShowAI(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-100 p-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-bold text-slate-800">
            {initialGift ? 'Geschenk bearbeiten' : 'Neues Geschenk'}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {!initialGift && !showAI && (
             <div className="mb-6 p-4 bg-gradient-to-r from-violet-50 to-indigo-50 rounded-xl border border-indigo-100">
                <div className="flex items-start gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg shrink-0">
                        <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-indigo-900">Keine Idee?</h3>
                        <p className="text-sm text-indigo-700 mb-3">Lass dir von unserer KI passende Geschenke vorschlagen.</p>
                        <button 
                            type="button"
                            onClick={() => setShowAI(true)}
                            className="text-sm bg-white text-indigo-600 px-4 py-2 rounded-lg font-medium shadow-sm hover:shadow border border-indigo-200 transition-all"
                        >
                            Ideen generieren
                        </button>
                    </div>
                </div>
             </div>
          )}

          {showAI ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-slate-700">KI Assistent</h3>
                    <button onClick={() => setShowAI(false)} className="text-xs text-slate-400 hover:text-slate-600">Zurück zum Formular</button>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Kind auswählen</label>
                        <select
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800 text-sm"
                            value={aiParams.childId}
                            onChange={e => setAiParams(prev => ({...prev, childId: e.target.value}))}
                            required
                        >
                            <option value="">Bitte wählen</option>
                            {childrenList.map(child => (
                                <option key={child.id} value={child.id}>{child.name}</option>
                            ))}
                        </select>
                        {aiParams.childId && childrenList.length > 0 && (
                            <p className="text-xs text-slate-500 mt-2">
                                Alter: {calculateAge(childrenList.find(c => c.id === aiParams.childId)?.birthDate || '')} | 
                                Geschlecht: {childrenList.find(c => c.id === aiParams.childId)?.gender === 'MALE' ? 'Junge' : childrenList.find(c => c.id === aiParams.childId)?.gender === 'FEMALE' ? 'Mädchen' : 'Neutral'}
                            </p>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-3">
                    <div>
                        <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Budget</label>
                        <input 
                            type="text" 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800 text-sm" 
                            placeholder="z.B. 20-50 CHF"
                            value={aiParams.budget}
                            onChange={e => setAiParams(prev => ({...prev, budget: e.target.value}))}
                        />
                    </div>
                    <div>
                     <label className="text-xs font-medium text-slate-500 uppercase mb-1 block">Interessen</label>
                     <input 
                        type="text" 
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800 text-sm" 
                        placeholder="z.B. Dinos, Malen, Lego"
                        value={aiParams.interests}
                        onChange={e => setAiParams(prev => ({...prev, interests: e.target.value}))}
                    />
                    </div>
                </div>

                <button 
                    onClick={handleGenerateIdeas}
                    disabled={aiLoading || !aiParams.childId || !aiParams.interests}
                    className="w-full bg-violet-600 text-white py-3 rounded-lg font-medium hover:bg-violet-700 disabled:opacity-50 flex justify-center items-center gap-2 mt-2 shadow-lg shadow-violet-200 transition-all"
                >
                    {aiLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                    Vorschläge suchen
                </button>

                <div className="space-y-2 mt-4 max-h-60 overflow-y-auto">
                    {aiSuggestions.map((sug, i) => (
                        <div key={i} className="p-3 border rounded-lg hover:border-violet-500 hover:bg-violet-50 cursor-pointer transition-all group" onClick={() => applySuggestion(sug)}>
                            <div className="flex justify-between">
                                <span className="font-semibold text-slate-800">{sug.title}</span>
                                <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600">{sug.estimatedPriceRange}</span>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">{sug.description}</p>
                            <span className="text-xs text-violet-600 font-medium mt-2 inline-block opacity-0 group-hover:opacity-100 transition-opacity">Übernehmen &rarr;</span>
                        </div>
                    ))}
                </div>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Für wen?</label>
                    {childrenList.length > 0 ? (
                        <select
                            name="childName"
                            value={formData.childName}
                            onChange={handleChange}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800"
                            required
                        >
                            {childrenList.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                            ))}
                        </select>
                    ) : (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600">
                            Bitte erfasse zuerst deine Kinder im Profil.
                        </div>
                    )}
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kategorie</label>
                    <select
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Titel des Geschenks</label>
                    <input
                        type="text"
                        name="title"
                        required
                        value={formData.title || ''}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800"
                        placeholder="z.B. Rotes Feuerwehrauto"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Wofür? / Notiz</label>
                    <textarea
                        name="purpose"
                        value={formData.purpose || ''}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors h-24 resize-none text-slate-800"
                        placeholder="z.B. Zum Geburtstag von Gotti Anna"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Preis (ca.)</label>
                    <div className="flex gap-2">
                        <input
                        type="number"
                        name="priceMin"
                        value={formData.priceMin || ''}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800"
                        placeholder="Von"
                        />
                        <input
                        type="number"
                        name="priceMax"
                        value={formData.priceMax || ''}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800"
                        placeholder="Bis"
                        />
                    </div>
                    </div>
                    <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Priorität</label>
                    <select
                        name="priority"
                        value={formData.priority}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800"
                    >
                        <option value="HIGH">❤️ Sehr wichtig</option>
                        <option value="MEDIUM">✨ Wichtig</option>
                        <option value="LOW">🌤️ Optional</option>
                    </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Link zum Shop (Optional)</label>
                    <input
                        type="url"
                        name="shopUrl"
                        value={formData.shopUrl || ''}
                        onChange={handleChange}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-indigo-500 transition-colors text-slate-800"
                        placeholder="https://..."
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Bild</label>
                    <div 
                        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer relative overflow-hidden ${formData.imageUrl ? 'border-indigo-200 bg-slate-50' : 'border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileChange}
                        />
                        
                        {formData.imageUrl ? (
                            <div className="relative group">
                                <img src={formData.imageUrl} alt="Preview" className="h-40 mx-auto object-contain rounded shadow-sm" />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                                    <p className="text-white font-medium flex items-center gap-2"><Upload className="w-4 h-4" /> Ändern</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFormData(prev => ({...prev, imageUrl: ''})); }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-md hover:bg-red-600 transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                                {isProcessingImage ? (
                                    <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
                                ) : (
                                    <ImageIcon className="w-8 h-8 text-slate-300" />
                                )}
                                <span className="text-sm">Klicken oder Bild hierher ziehen</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="pt-4 flex gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                    >
                        Abbrechen
                    </button>
                    <button
                        type="submit"
                        className="flex-1 py-3 px-4 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
                    >
                        Speichern
                    </button>
                </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
