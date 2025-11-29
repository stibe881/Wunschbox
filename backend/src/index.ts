import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import giftsRoutes from './routes/gifts';
import childrenRoutes from './routes/children';
import usersRoutes from './routes/users';
import notificationsRoutes from './routes/notifications';
import invitationsRoutes from './routes/invitations';
import contactsRoutes from './routes/contacts';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/gifts', giftsRoutes);
app.use('/api/children', childrenRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/invitations', invitationsRoutes);
app.use('/api/contacts', contactsRoutes);

app.get('/', (req, res) => {
  res.send('Backend server is running!');
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
});
