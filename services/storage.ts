
import { User, Gift, Notification, Role, Invitation, Child } from '../types';

const USERS_KEY = 'wishlist_users';
const GIFTS_KEY = 'wishlist_gifts';
const CHILDREN_KEY = 'wishlist_children';
const NOTIFICATIONS_KEY = 'wishlist_notifications';
const INVITATIONS_KEY = 'wishlist_invitations';
const CURRENT_USER_KEY = 'wishlist_current_user';

// Seed data if empty
const seedData = () => {
  if (!localStorage.getItem(GIFTS_KEY)) {
    // Seed Children first if empty
    if (!localStorage.getItem(CHILDREN_KEY)) {
        const initialChildren: Child[] = [
            { id: 'c1', name: 'Levin', birthDate: '2018-05-15', gender: 'MALE', createdByUserId: 'system' },
            { id: 'c2', name: 'Lina', birthDate: '2020-11-20', gender: 'FEMALE', createdByUserId: 'system' }
        ];
        localStorage.setItem(CHILDREN_KEY, JSON.stringify(initialChildren));
    }

    const initialGifts: Gift[] = [
      {
        id: '1',
        title: 'LEGO Technic Rennwagen',
        purpose: 'Geburtstag',
        priceMin: 40,
        priceMax: 60,
        currency: 'CHF',
        imageUrl: 'https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=500&q=80',
        shopUrl: 'https://www.lego.com',
        childName: 'Levin',
        priority: 'HIGH',
        category: 'Spielzeug',
        isGifted: false,
        createdAt: Date.now(),
      },
      {
        id: '2',
        title: 'Malset Deluxe',
        purpose: 'Weihnachten',
        priceMin: 20,
        priceMax: 35,
        currency: 'CHF',
        imageUrl: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=500&q=80',
        shopUrl: 'https://www.amazon.de',
        childName: 'Lina',
        priority: 'MEDIUM',
        category: 'Sonstiges',
        isGifted: true,
        giftedByUserName: 'Gotti Anna',
        createdAt: Date.now() - 10000,
      }
    ];
    localStorage.setItem(GIFTS_KEY, JSON.stringify(initialGifts));
  }
};

export const storageService = {
  init: seedData,

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(CURRENT_USER_KEY);
    return data ? JSON.parse(data) : null;
  },

  login: (user: User) => {
    // Set default preferences if new user
    if (user.role === 'PARENT' && user.emailNotificationsEnabled === undefined) {
        user.emailNotificationsEnabled = true;
    }
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  },

  logout: () => {
    localStorage.removeItem(CURRENT_USER_KEY);
  },

  updateUser: (updatedUser: User) => {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
  },

  // Children Methods
  getChildren: (): Child[] => {
    const data = localStorage.getItem(CHILDREN_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveChild: (child: Child) => {
    const children = storageService.getChildren();
    const index = children.findIndex(c => c.id === child.id);
    if (index >= 0) {
        children[index] = child;
    } else {
        children.push(child);
    }
    localStorage.setItem(CHILDREN_KEY, JSON.stringify(children));
  },

  deleteChild: (childId: string) => {
    const children = storageService.getChildren();
    const newChildren = children.filter(c => c.id !== childId);
    localStorage.setItem(CHILDREN_KEY, JSON.stringify(newChildren));
  },

  // Gift Methods
  getGifts: (): Gift[] => {
    const data = localStorage.getItem(GIFTS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveGift: (gift: Gift) => {
    const gifts = storageService.getGifts();
    const existingIndex = gifts.findIndex(g => g.id === gift.id);
    if (existingIndex >= 0) {
      gifts[existingIndex] = gift;
    } else {
      gifts.push(gift);
    }
    localStorage.setItem(GIFTS_KEY, JSON.stringify(gifts));
  },

  deleteGift: (giftId: string) => {
    const gifts = storageService.getGifts();
    const newGifts = gifts.filter(g => g.id !== giftId);
    localStorage.setItem(GIFTS_KEY, JSON.stringify(newGifts));
  },

  // Toggle for current user (standard flow)
  toggleGiftStatus: (giftId: string, userId: string, userName: string) => {
    const gifts = storageService.getGifts();
    const newGifts = gifts.map(gift => {
        if (gift.id === giftId) {
            if (gift.isGifted) {
                // Can only unmark if gifted by self
                if (gift.giftedByUserId === userId) {
                    return { ...gift, isGifted: false, giftedByUserId: undefined, giftedByUserName: undefined };
                }
            } else {
                // MARK AS GIFTED
                
                // 1. Create In-App Notification
                storageService.addNotification({
                    id: crypto.randomUUID(),
                    message: `${userName} schenkt "${gift.title}" an ${gift.childName}`,
                    createdAt: Date.now(),
                    read: false,
                    forRole: 'PARENT'
                });

                // 2. Simulate Email Notification Trigger
                // In a real backend, we would fetch all users with role=PARENT and emailNotificationsEnabled=true
                // Here we just log it for demonstration
                console.log(`[SIMULATION] Checking if parents enabled email notifications...`);
                console.log(`[SIMULATION] Sending email to parents: "${userName} hat ${gift.title} für ${gift.childName} reserviert."`);

                return { 
                    ...gift, 
                    isGifted: true, 
                    giftedByUserId: userId, 
                    giftedByUserName: userName 
                };
            }
        }
        return gift;
    });
    localStorage.setItem(GIFTS_KEY, JSON.stringify(newGifts));
  },

  // Manual mark by parent (proxy)
  markGiftAsGiftedByProxy: (giftId: string, proxyName: string, parentId: string) => {
    const gifts = storageService.getGifts();
    const newGifts = gifts.map(gift => {
        if (gift.id === giftId) {
            return {
                ...gift,
                isGifted: true,
                giftedByUserId: parentId,
                giftedByUserName: proxyName
            };
        }
        return gift;
    });
    localStorage.setItem(GIFTS_KEY, JSON.stringify(newGifts));
  },

  // Force unmark (for parents)
  unmarkGift: (giftId: string) => {
    const gifts = storageService.getGifts();
    const newGifts = gifts.map(gift => {
        if (gift.id === giftId) {
             return { ...gift, isGifted: false, giftedByUserId: undefined, giftedByUserName: undefined };
        }
        return gift;
    });
    localStorage.setItem(GIFTS_KEY, JSON.stringify(newGifts));
  },

  // Notification Methods
  getNotifications: (role: Role): Notification[] => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: Notification[] = data ? JSON.parse(data) : [];
    return all.filter(n => n.forRole === role).sort((a, b) => b.createdAt - a.createdAt);
  },

  addNotification: (notification: Notification) => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    const all: Notification[] = data ? JSON.parse(data) : [];
    all.push(notification);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
  },

  markNotificationsRead: (role: Role) => {
    const data = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!data) return;
    let all: Notification[] = JSON.parse(data);
    all = all.map(n => n.forRole === role ? { ...n, read: true } : n);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(all));
  },

  // Invitation Methods
  createInvitation: (invitation: Invitation) => {
    const data = localStorage.getItem(INVITATIONS_KEY);
    const all: Invitation[] = data ? JSON.parse(data) : [];
    all.push(invitation);
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));
  },

  getInvitationByToken: (token: string): Invitation | undefined => {
    const data = localStorage.getItem(INVITATIONS_KEY);
    const all: Invitation[] = data ? JSON.parse(data) : [];
    return all.find(i => i.token === token && !i.isUsed);
  },

  markInvitationUsed: (id: string) => {
    const data = localStorage.getItem(INVITATIONS_KEY);
    if (!data) return;
    let all: Invitation[] = JSON.parse(data);
    all = all.map(i => i.id === id ? { ...i, isUsed: true } : i);
    localStorage.setItem(INVITATIONS_KEY, JSON.stringify(all));
  }
};
