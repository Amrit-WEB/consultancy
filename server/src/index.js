import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(cors({ origin: process.env.CORS_ORIGIN || true }));
app.use(express.json());
app.use(morgan('dev'));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Study Abroad Consultancy API is running.',
    status: 'ok',
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'consultancy-server',
    timestamp: new Date().toISOString(),
  });
});

app.listen(port, () => {
  console.log(`Consultancy API listening on http://localhost:${port}`);
});
