import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORIES_FILE = path.join(__dirname, '../data/memories.json');

async function readMemories() {
  try {
    const raw = await fs.readFile(MEMORIES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeMemories(memories) {
  await fs.mkdir(path.dirname(MEMORIES_FILE), { recursive: true });
  await fs.writeFile(MEMORIES_FILE, JSON.stringify(memories, null, 2), 'utf-8');
}

// GET /api/memories — supports ?search=, ?tag=, ?mood=, ?yearFrom=, ?yearTo=
router.get('/', async (req, res) => {
  try {
    let memories = await readMemories();
    const { search, tag, mood, yearFrom, yearTo } = req.query;

    if (search) {
      const q = search.toLowerCase();
      memories = memories.filter(
        m =>
          m.title.toLowerCase().includes(q) ||
          m.story.toLowerCase().includes(q)
      );
    }

    if (tag) {
      memories = memories.filter(m => m.tags && m.tags.includes(tag));
    }

    if (mood) {
      memories = memories.filter(m => m.mood === mood);
    }

    if (yearFrom) {
      const from = parseInt(yearFrom, 10);
      memories = memories.filter(m => {
        const y = m.dateConfidence === 'year-only' ? m.year : new Date(m.date).getFullYear();
        return y >= from;
      });
    }

    if (yearTo) {
      const to = parseInt(yearTo, 10);
      memories = memories.filter(m => {
        const y = m.dateConfidence === 'year-only' ? m.year : new Date(m.date).getFullYear();
        return y <= to;
      });
    }

    res.json(memories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/memories
router.post('/', async (req, res) => {
  try {
    const { title, story, date, year, dateConfidence, tags, mood } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Title is required.' });
    }
    if (!story || !story.trim()) {
      return res.status(400).json({ error: 'Story is required.' });
    }
    if (!dateConfidence) {
      return res.status(400).json({ error: 'Date confidence is required.' });
    }
    if (dateConfidence === 'year-only') {
      if (!year || isNaN(parseInt(year, 10))) {
        return res.status(400).json({ error: 'A valid year is required.' });
      }
    } else {
      if (!date) {
        return res.status(400).json({ error: 'A date is required.' });
      }
    }

    const validMoods = ['joyful', 'painful', 'funny', 'bittersweet', 'proud', 'neutral'];
    if (mood && !validMoods.includes(mood)) {
      return res.status(400).json({ error: 'Invalid mood value.' });
    }

    const memory = {
      id: uuidv4(),
      title: title.trim(),
      story: story.trim(),
      date: dateConfidence !== 'year-only' ? date : null,
      year: dateConfidence === 'year-only' ? parseInt(year, 10) : null,
      dateConfidence,
      tags: Array.isArray(tags) ? tags.map(t => t.trim()).filter(Boolean) : [],
      mood: mood || null,
      createdAt: new Date().toISOString(),
    };

    const memories = await readMemories();
    memories.push(memory);
    await writeMemories(memories);

    res.status(201).json(memory);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/memories/:id
router.delete('/:id', async (req, res) => {
  try {
    const memories = await readMemories();
    const index = memories.findIndex(m => m.id === req.params.id);
    if (index === -1) {
      return res.status(404).json({ error: 'Memory not found.' });
    }
    memories.splice(index, 1);
    await writeMemories(memories);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
