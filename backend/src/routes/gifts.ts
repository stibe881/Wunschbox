import { Router } from 'express';
import pool from '../db';

const router = Router();

// Gift routes
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM gifts');
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch gifts' });
  }
});

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM gifts WHERE id = ?', [id]);
        res.json({ message: 'Gift deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete gift' });
    }
});

export default router;
