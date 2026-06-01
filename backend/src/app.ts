import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import checkinRoutes from './routes/checkinRoutes';
import predictionRoutes from './routes/predictionRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/checkins', checkinRoutes);
app.use('/api/predictions', predictionRoutes);

app.get('/', (req, res) => {
  res.send('BurnoutGuard API is running');
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

export default app;
