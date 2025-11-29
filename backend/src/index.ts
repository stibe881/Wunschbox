import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import listEndpoints from 'express-list-endpoints';

dotenv.config();

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.send('OK');
});

app.use('/api', apiRoutes);

app.get('/', (req, res) => {
  res.json(listEndpoints(app));
});

app.listen(port, () => {
  console.log(`Backend server listening on port ${port}`);
  console.log('Registered endpoints:');
  console.log(listEndpoints(app));
});
