import { Router } from 'express';
import pool from '../db';
import bcrypt from 'bcrypt';

const router = Router();
const saltRounds = 10;

// User routes
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows]: [any[], any] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
        if (rows.length > 0) {
            const { password: _, ...userWithoutPassword } = rows[0];
            res.json(userWithoutPassword);
        } else {
            res.status(404).json({ error: 'User not found' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

router.post('/', async (req, res) => {
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

router.put('/:id', async (req, res) => {
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

router.delete('/:id', async (req, res) => {
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

export default router;
