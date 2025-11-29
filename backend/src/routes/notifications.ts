import { Router } from 'express';
import pool from '../db';

const router = Router();

// Notification routes
router.get('/:role', async (req, res) => {
    try {
        const { role } = req.params;
        const [rows] = await pool.query('SELECT * FROM notifications WHERE forRole = ? ORDER BY createdAt DESC', [role]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

router.post('/', async (req, res) => {
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

router.put('/read/:role', async (req, res) => {
    try {
        const { role } = req.params;
        await pool.query('UPDATE notifications SET `read` = TRUE WHERE forRole = ?', [role]);
        res.json({ message: 'Notifications marked as read' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to mark notifications as read' });
    }
});

export default router;
