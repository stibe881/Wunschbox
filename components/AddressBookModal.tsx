
import React, { useState, useEffect } from 'react';
import { Contact, User } from '../types';
import { storageService } from '../services/storage';
import { X, Plus, Trash2, User as UserIcon, Mail } from 'lucide-react';

interface AddressBookModalProps {
  onClose: () => void;
  currentUser: User;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({ onClose, currentUser }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchContacts = async () => {
      const contacts = await storageService.getContacts(currentUser.id);
      setContacts(contacts);
    };
    fetchContacts();
  }, [currentUser.id]);

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email) return;

    const newContact: Contact = {
      id: crypto.randomUUID(),
      name,
      email,
      createdByUserId: currentUser.id,
    };

    const savedContact = await storageService.saveContact(newContact);
    setContacts([...contacts, savedContact]);
    setName('');
    setEmail('');
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Möchten Sie diesen Kontakt wirklich löschen?')) {
      await storageService.deleteContact(contactId);
      setContacts(contacts.filter(c => c.id !== contactId));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-800">Adressbuch</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="space-y-3 mb-8 max-h-60 overflow-y-auto">
            {contacts.map(contact => (
              <div key={contact.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                <div>
                  <h3 className="font-bold text-slate-800 flex items-center gap-2"><UserIcon className="w-4 h-4" /> {contact.name}</h3>
                  <p className="text-sm text-slate-500 ml-6">{contact.email}</p>
                </div>
                <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h4 className="text-sm font-bold text-slate-700 uppercase mb-4">Kontakt hinzufügen</h4>
            <form onSubmit={handleAddContact} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                <input type="text" required value={name} onChange={e => setName(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="Name" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">E-Mail</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm" placeholder="email@example.com" />
              </div>
              <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors flex items-center justify-center gap-2 mt-2">
                <Plus className="w-4 h-4" /> Speichern
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
