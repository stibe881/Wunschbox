import { Router } from 'express';
import pool from '../db';
import bcrypt from 'bcrypt';

const router = Router();
const saltRounds = 10;

// Auth routes
router.post('/login', async (req, res) => {
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

export default router;
