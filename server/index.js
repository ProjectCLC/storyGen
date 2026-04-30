import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import memoriesRouter from './routes/memories.js';
import generateRouter from './routes/generate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use('/output', express.static(path.join(__dirname, '../output')));

app.use('/api/memories', memoriesRouter);
app.use('/api/generate', generateRouter);
app.use('/api/export', generateRouter);

app.listen(PORT, () => {
  console.log(`LifeLog server running on http://localhost:${PORT}`);
});
