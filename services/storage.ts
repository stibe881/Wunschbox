import { User, Gift, Notification, Role, Invitation, Child, Contact } from '../types';

const USERS_KEY = 'wishlist_users';
const CHILDREN_KEY = 'wishlist_children';
const NOTIFICATIONS_KEY = 'wishlist_notifications';
const INVITATIONS_KEY = 'wishlist_invitations';
const CURRENT_USER_KEY = 'wishlist_current_user';
const API_URL = '/api';

export const storageService = {
  init: () => {},

  getCurrentUser: async (): Promise<User | null> => {
    const userId = localStorage.getItem(CURRENT_USER_KEY);
    if (!userId) return null;

    const response = await fetch(`${API_URL}/users/${userId}`);
    if (!response.ok) {
        // If user not found on backend, remove from local storage
        if (response.status === 404) {
            localStorage.removeItem(CURRENT_USER_KEY);
        }
        throw new Error('Failed to fetch user');
    }
    return response.json();
  },

  createUser: async (user: User): Promise<User> => {
    // Set default preferences if new user
    if (user.role === 'PARENT' && user.emailNotificationsEnabled === undefined) {
        user.emailNotificationsEnabled = true;
    }
    
    const response = await fetch(`${API_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(user)
    });

    if (!response.ok) {
        throw new Error('Failed to create user');
    }
    const savedUser = await response.json();
    localStorage.setItem(CURRENT_USER_KEY, savedUser.id);
    return savedUser;
  },

  login: async (email, password) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
    });
    if (!response.ok) {
        throw new Error('Login failed');
    }
    const user = await response.json();
    localStorage.setItem(CURRENT_USER_KEY, user.id);
    return user;
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  updateUser: async (updatedUser: User): Promise<User> => {
    const response = await fetch(`${API_URL}/users/${updatedUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedUser)
    });

    if (!response.ok) {
        throw new Error('Failed to update user');
    }
    return response.json();
  },

  deleteUser: async (userId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/users/${userId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete user');
    }
  },

  // Children Methods
  getChildren: async (): Promise<Child[]> => {
    const response = await fetch(`${API_URL}/children`);
    if (!response.ok) {
        throw new Error('Failed to fetch children');
    }
    return response.json();
  },

  saveChild: async (child: Child, isNew: boolean): Promise<Child> => {
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_URL}/children` : `${API_URL}/children/${child.id}`;

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(child),
    });

    if (!response.ok) {
        throw new Error('Failed to save child');
    }
    return response.json();
  },

  deleteChild: async (childId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/children/${childId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete child');
    }
  },

  // Gift Methods
  getGifts: async (): Promise<Gift[]> => {
    const response = await fetch(`${API_URL}/gifts`);
    if (!response.ok) {
        throw new Error('Failed to fetch gifts');
    }
    return response.json();
  },

  saveGift: async (gift: Gift, isNew: boolean): Promise<Gift> => {
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? `${API_URL}/gifts` : `${API_URL}/gifts/${gift.id}`;

    const response = await fetch(url, {
        method,
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(gift),
    });

    if (!response.ok) {
        throw new Error('Failed to save gift');
    }
    return response.json();
  },

  deleteGift: async (giftId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/gifts/${giftId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete gift');
    }
  },

  // Toggle for current user (standard flow)
  toggleGiftStatus: async (giftId: string, userId: string, userName: string) => {
    const gift = (await storageService.getGifts()).find(g => g.id === giftId);
    if (!gift) throw new Error("Gift not found");

    if (gift.isGifted) {
        // Can only unmark if gifted by self
        if (gift.giftedByUserId === userId) {
            const updatedGift = { ...gift, isGifted: false, giftedByUserId: undefined, giftedByUserName: undefined };
            await storageService.saveGift(updatedGift, false);
        }
    } else {
        // MARK AS GIFTED
        
        // 1. Create In-App Notification
        await storageService.addNotification({
            id: crypto.randomUUID(),
            message: `${userName} schenkt "${gift.title}" an ${gift.childName}`,
            createdAt: Date.now(),
            read: false,
            forRole: 'PARENT'
        });

        // 2. In a real backend, we would fetch all users with role=PARENT and emailNotificationsEnabled=true
        console.log(`[SIMULATION] Sending email to parents: "${userName} hat ${gift.title} für ${gift.childName} reserviert."`);

        const updatedGift = { 
            ...gift, 
            isGifted: true, 
            giftedByUserId: userId, 
            giftedByUserName: userName 
        };
        await storageService.saveGift(updatedGift, false);
    }
  },

  // Manual mark by parent (proxy)
  markGiftAsGiftedByProxy: async (giftId: string, proxyName: string, parentId: string) => {
    const gift = (await storageService.getGifts()).find(g => g.id === giftId);
    if (!gift) throw new Error("Gift not found");
    const updatedGift = {
        ...gift,
        isGifted: true,
        giftedByUserId: parentId,
        giftedByUserName: proxyName
    };
    await storageService.saveGift(updatedGift, false);
  },

  // Force unmark (for parents)
  unmarkGift: async (giftId: string) => {
    const gift = (await storageService.getGifts()).find(g => g.id === giftId);
    if (!gift) throw new Error("Gift not found");
    const updatedGift = { ...gift, isGifted: false, giftedByUserId: undefined, giftedByUserName: undefined };
    await storageService.saveGift(updatedGift, false);
  },

  // Notification Methods
  getNotifications: async (role: Role): Promise<Notification[]> => {
    const response = await fetch(`${API_URL}/notifications/${role}`);
    if (!response.ok) {
        throw new Error('Failed to fetch notifications');
    }
    return response.json();
  },

  addNotification: async (notification: Notification): Promise<Notification> => {
    const response = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notification),
    });
    if (!response.ok) {
        throw new Error('Failed to add notification');
    }
    return response.json();
  },

  markNotificationsRead: async (role: Role): Promise<void> => {
    const response = await fetch(`${API_URL}/notifications/read/${role}`, {
        method: 'PUT',
    });
    if (!response.ok) {
        throw new Error('Failed to mark notifications as read');
    }
  },

  // Invitation Methods
  createInvitation: async (invitation: Invitation): Promise<Invitation> => {
    const response = await fetch(`${API_URL}/invitations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invitation),
    });
    if (!response.ok) {
        throw new Error('Failed to create invitation');
    }
    return response.json();
  },

  getInvitationByToken: async (token: string): Promise<Invitation | undefined> => {
    const response = await fetch(`${API_URL}/invitations/${token}`);
    if (!response.ok) {
        if (response.status === 404) {
            return undefined;
        }
        throw new Error('Failed to fetch invitation');
    }
    return response.json();
  },

  markInvitationUsed: async (id: string): Promise<void> => {
    const response = await fetch(`${API_URL}/invitations/${id}/use`, {
        method: 'PUT',
    });
    if (!response.ok) {
        throw new Error('Failed to mark invitation as used');
    }
  },

  // Contact Methods
  getContacts: async (userId: string): Promise<Contact[]> => {
    const response = await fetch(`${API_URL}/contacts/${userId}`);
    if (!response.ok) {
        throw new Error('Failed to fetch contacts');
    }
    return response.json();
  },

  saveContact: async (contact: Contact): Promise<Contact> => {
    const response = await fetch(`${API_URL}/contacts`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(contact),
    });

    if (!response.ok) {
        throw new Error('Failed to save contact');
    }
    return response.json();
  },

  deleteContact: async (contactId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/contacts/${contactId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to delete contact');
    }
  }
};