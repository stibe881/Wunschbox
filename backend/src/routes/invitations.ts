import { Router } from 'express';
import pool from '../db';

const router = Router();

// Invitation routes
router.get('/:token', async (req, res) => {
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

router.post('/', async (req, res) => {
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

router.put('/:id/use', async (req, res) => {
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
