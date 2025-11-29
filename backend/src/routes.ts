import { Router } from 'express';
import pool from './db';

const router = Router();

// Gift routes
router.get('/gifts', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gifts');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch gifts' });
  }
});

router.post('/gifts', async (req, res) => {
    try {
        const { id, title, purpose, priceMin, priceMax, currency, imageUrl, shopUrl, childName, priority, category } = req.body;
        const newGift = {
            id, title, purpose, priceMin, priceMax, currency, imageUrl, shopUrl, childName, priority, category,
            isGifted: false,
            createdAt: new Date()
        };

        await pool.query('INSERT INTO gifts SET ?', newGift);
        res.status(201).json(newGift);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create gift' });
    }
});

router.put('/gifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const giftData = req.body;
        await pool.query('UPDATE gifts SET ? WHERE id = ?', [giftData, id]);
        res.json({ message: 'Gift updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update gift' });
    }
});

router.delete('/gifts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM gifts WHERE id = ?', [id]);
        res.json({ message: 'Gift deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete gift' });
    }
});

// Children routes
router.get('/children', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM children');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch children' });
    }
});

router.post('/children', async (req, res) => {
    try {
        const { id, name, birthDate, gender, createdByUserId } = req.body;
        const newChild = { id, name, birthDate, gender, createdByUserId };

        await pool.query('INSERT INTO children SET ?', newChild);
        res.status(201).json(newChild);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create child' });
    }
});

router.put('/children/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const childData = req.body;
        await pool.query('UPDATE children SET ? WHERE id = ?', [childData, id]);
        res.json({ message: 'Child updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update child' });
    }
});

router.delete('/children/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM children WHERE id = ?', [id]);
        res.json({ message: 'Child deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete child' });
    }
});
// User routes
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows]: [any[], any] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.post('/users', async (req, res) => {
    try {
        const { id, name, email, role, roleDescription, emailNotificationsEnabled } = req.body;
        const newUser = { id, name, email, role, roleDescription, emailNotificationsEnabled };

        await pool.query('INSERT INTO users SET ? ON DUPLICATE KEY UPDATE ?', [newUser, newUser]);
        res.status(201).json(newUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create or update user' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userData = req.body;
        await pool.query('UPDATE users SET ? WHERE id = ?', [userData, id]);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// Notification routes
router.get('/notifications/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const [rows] = await pool.query('SELECT * FROM notifications WHERE forRole = ? ORDER BY createdAt DESC', [role]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.post('/notifications', async (req, res) => {
    try {
        const { id, message, forRole } = req.body;
        const newNotification = { id, message, forRole, createdAt: new Date() };

        await pool.query('INSERT INTO notifications SET ?', newNotification);
        res.status(201).json(newNotification);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create notification' });
    }
});

router.put('/notifications/read/:role', async (req, res) => {
    try {
        const { role } = req.params;
        await pool.query('UPDATE notifications SET `read` = TRUE WHERE forRole = ?', [role]);
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});
// Invitation routes
router.get('/invitations/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const [rows]: [any[], any] = await pool.query('SELECT * FROM invitations WHERE token = ? AND isUsed = FALSE', [token]);
        if (rows.length > 0) {
            res.json(rows[0]);
        } else {
            res.status(404).json({ error: 'Invitation not found or already used' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch invitation' });
    }
});

router.post('/invitations', async (req, res) => {
    try {
        const { id, token, guestName, guestRoleDescription, targetRole, customMessage, createdByUserId } = req.body;
        const newInvitation = { id, token, guestName, guestRoleDescription, targetRole, customMessage, createdByUserId, createdAt: new Date(), isUsed: false };

        await pool.query('INSERT INTO invitations SET ?', newInvitation);
        res.status(201).json(newInvitation);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create invitation' });
    }
});

router.put('/invitations/:id/use', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('UPDATE invitations SET isUsed = TRUE WHERE id = ?', [id]);
        res.json({ message: 'Invitation marked as used' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark invitation as used' });
    }
});

export default router;
