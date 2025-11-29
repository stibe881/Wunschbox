import { Router } from 'express';
import pool from '../db';

const router = Router();

// Children routes
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM children');
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch children' });
    }
});

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM children WHERE id = ?', [id]);
        res.json({ message: 'Child deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete child' });
    }
});

export default router;
