import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const router = express.Router();

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
    console.log('Creating contact with body:', req.body);
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

app.use('/api', router);

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
