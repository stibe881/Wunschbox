
import React, { useState, useEffect } from 'react';
import { Contact, User } from '../types';
import { storageService } from '../services/storage';
import { X, Plus, Trash2, User as UserIcon, Mail } from 'lucide-react';
import { AddContactModal } from './AddContactModal';

interface AddressBookModalProps {
  onClose: () => void;
  currentUser: User;
}

export const AddressBookModal: React.FC<AddressBookModalProps> = ({ onClose, currentUser }) => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  useEffect(() => {
    const fetchContacts = async () => {
      try {
        const contacts = await storageService.getContacts(currentUser.id);
        setContacts(contacts);
      } catch (error) {
        console.error("Failed to fetch contacts", error);
      }
    };
    fetchContacts();
  }, [currentUser.id]);

  const handleAddContact = async (contactData: { name: string; email: string }) => {
    const newContact: Contact = {
      id: crypto.randomUUID(),
      ...contactData,
      createdByUserId: currentUser.id,
    };

    try {
        const savedContact = await storageService.saveContact(newContact);
        setContacts([...contacts, savedContact]);
        setIsAddContactModalOpen(false);
    } catch (error) {
        console.error("Failed to save contact", error);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (window.confirm('Möchten Sie diesen Kontakt wirklich löschen?')) {
      try {
        await storageService.deleteContact(contactId);
        setContacts(contacts.filter(c => c.id !== contactId));
      } catch (error) {
        console.error("Failed to delete contact", error);
      }
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg h-[70vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">Adressbuch</h2>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
              <X className="w-5 h-5 text-slate-500" />
            </button>
          </div>

          <div className="p-6 flex-grow overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-slate-500">Ihre gespeicherten Kontakte.</p>
                <button onClick={() => setIsAddContactModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Kontakt hinzufügen
                </button>
            </div>
            <div className="space-y-2">
              {contacts.length === 0 ? (
                <p className="text-center text-slate-400 py-8">Keine Kontakte gefunden.</p>
              ) : (
                contacts.map(contact => (
                  <div key={contact.id} className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl">
                    <div>
                      <h3 className="font-semibold text-slate-800 flex items-center gap-2"><UserIcon className="w-4 h-4" /> {contact.name}</h3>
                      <p className="text-sm text-slate-500 ml-6">{contact.email}</p>
                    </div>
                    <button onClick={() => handleDeleteContact(contact.id)} className="p-2 text-slate-400 hover:text-red-500 rounded-full">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
      {isAddContactModalOpen && <AddContactModal onClose={() => setIsAddContactModalOpen(false)} onSave={handleAddContact} />}
    </>
  );
};
