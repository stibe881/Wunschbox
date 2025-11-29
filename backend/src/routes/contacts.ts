import { Router } from 'express';
import pool from '../db';

const router = Router();

// Contact routes
router.get('/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const [rows] = await pool.query('SELECT * FROM contacts WHERE createdByUserId = ?', [userId]);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch contacts' });
    }
});

router.post('/', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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
