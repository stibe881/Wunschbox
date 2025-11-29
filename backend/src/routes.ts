import { Router } from 'express';
import pool from './db';
import bcrypt from 'bcrypt';

const router = Router();
const saltRounds = 10;

// Auth routes
router.post('/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const [rows]: [any[], any] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
        if (rows.length === 0) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }
        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            // Do not send password back to client
            const { password: _, ...userWithoutPassword } = user;
            res.json(userWithoutPassword);
        } else {
            res.status(401).json({ error: 'Invalid email or password' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Login failed' });
    }
});


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
        // Prevent changing the id and createdAt fields
        delete giftData.id;
        delete giftData.createdAt;
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
        const { id, name, email, password, role, roleDescription, emailNotificationsEnabled } = req.body;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        const newUser = { id, name, email, password: hashedPassword, role, roleDescription, emailNotificationsEnabled };

        await pool.query('INSERT INTO users SET ? ON DUPLICATE KEY UPDATE ?', [newUser, newUser]);
        // Do not send password back to client
        const { password: _, ...userWithoutPassword } = newUser;
        res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create or update user' });
    }
});

router.put('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const userData = req.body;
        if (userData.password) {
            userData.password = await bcrypt.hash(userData.password, saltRounds);
        }
        await pool.query('UPDATE users SET ? WHERE id = ?', [userData, id]);
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

router.delete('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;
        // This is a soft delete, we could also do a hard delete
        // await pool.query('DELETE FROM users WHERE id = ?', [id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete user' });
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
// Contact routes
router.get('/contacts/:userId', async (req, res) => {
    console.log('Fetching contacts for userId:', req.params.userId);
    try {
        const { userId } = req.params;
        const [rows] = await pool.query('SELECT * FROM contacts WHERE createdByUserId = ?', [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

router.post('/contacts', async (req, res) => {
    try {
        const { id, name, email, createdByUserId } = req.body;
        const newContact = { id, name, email, createdByUserId };

        await pool.query('INSERT INTO contacts SET ?', newContact);
        res.status(201).json(newContact);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create contact' });
    }
});

router.delete('/contacts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM contacts WHERE id = ?', [id]);
        res.json({ message: 'Contact deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete contact' });
    }
});

export default router;
