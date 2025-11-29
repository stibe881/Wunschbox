import express from 'express';
import cors from 'cors';

const app = express();
const port = 3011;

app.use(cors());
app.use(express.json());

app.get('/api/test', (req, res) => {
  res.json({ message: 'Test successful' });
});

app.listen(port, () => {
  console.log(`Test server listening on port ${port}`);
});
