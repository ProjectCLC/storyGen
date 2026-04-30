import express from 'express';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const MEMORIES_FILE = path.join(__dirname, '../data/memories.json');
const OUTPUT_DIR = path.join(__dirname, '../../output');
const MARKDOWN_FILE = path.join(OUTPUT_DIR, 'master_life_document.md');

function getEffectiveDate(memory) {
  if (memory.dateConfidence === 'year-only') {
    return new Date(memory.year, 6, 1);
  }
  return new Date(memory.date);
}

function getConfidenceOrder(conf) {
  return { exact: 0, estimated: 1, 'year-only': 2 }[conf] ?? 3;
}

function sortMemories(memories) {
  return [...memories].sort((a, b) => {
    const diff = getEffectiveDate(a) - getEffectiveDate(b);
    if (diff !== 0) return diff;
    return getConfidenceOrder(a.dateConfidence) - getConfidenceOrder(b.dateConfidence);
  });
}

function groupByYear(memories) {
  return memories.reduce((acc, m) => {
    const year =
      m.dateConfidence === 'year-only' ? m.year : new Date(m.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(m);
    return acc;
  }, {});
}

function formatDate(memory) {
  if (memory.dateConfidence === 'year-only') return `~${memory.year}`;
  const d = new Date(memory.date);
  const formatted = d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  return memory.dateConfidence === 'estimated' ? `~${formatted}` : formatted;
}

function buildMarkdownEntry(memory) {
  let md = `### ${formatDate(memory)} — ${memory.title}\n\n`;
  md += `${memory.story}\n\n`;
  if (memory.tags && memory.tags.length > 0) {
    md += `**Tags:** ${memory.tags.map(t => `\`${t}\``).join(', ')}\n\n`;
  }
  if (memory.mood) {
    md += `**Mood:** ${memory.mood}\n\n`;
  }
  md += `---\n\n`;
  return md;
}

// POST /api/generate — streams SSE
router.post('/', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = data => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const raw = await fs.readFile(MEMORIES_FILE, 'utf-8').catch(() => '[]');
    const memories = JSON.parse(raw);

    if (memories.length === 0) {
      send({ type: 'error', message: 'No memories found. Add some memories first!' });
      return res.end();
    }

    const sorted = sortMemories(memories);
    const byYear = groupByYear(sorted);
    const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);

    send({
      type: 'status',
      message: `Processing ${memories.length} memories across ${years.length} year(s)…`,
    });

    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let fullMarkdown = `# My Life Chronicle\n\n*Generated on ${today}*\n\n---\n\n`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const client = apiKey ? new Anthropic({ apiKey }) : null;

    for (const year of years) {
      const yearMemories = byYear[year];
      send({ type: 'year_start', year });

      fullMarkdown += `## ${year}\n\n`;
      for (const m of yearMemories) {
        fullMarkdown += buildMarkdownEntry(m);
      }

      fullMarkdown += `### Year Summary\n\n`;

      if (!client) {
        const note = `[AI summary unavailable — set ANTHROPIC_API_KEY to enable year summaries.]`;
        fullMarkdown += `${note}\n\n---\n\n`;
        send({ type: 'text', year, content: note });
        send({ type: 'year_end', year });
        continue;
      }

      send({ type: 'status', message: `Generating AI summary for ${year}…` });

      const memorySummaries = yearMemories
        .map(
          m =>
            `Title: ${m.title}\nDate: ${formatDate(m)}\nStory: ${m.story}${m.mood ? `\nMood: ${m.mood}` : ''}`
        )
        .join('\n\n---\n\n');

      const prompt = `You are a compassionate life narrator. Based on these personal memories from ${year}, write a warm, reflective 2-3 paragraph summary of what that year was like for this person. Focus on themes, growth, emotions, and significant events. Do not just list the events — synthesize them into a narrative.\n\nMemories from ${year}:\n\n${memorySummaries}`;

      let summaryText = '';
      try {
        const stream = client.messages.stream({
          model: 'claude-sonnet-4-6',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        });

        for await (const text of stream.textStream) {
          summaryText += text;
          send({ type: 'text', year, content: text });
        }
      } catch (aiErr) {
        const fallback = `[Summary generation failed: ${aiErr.message}]`;
        summaryText = fallback;
        send({ type: 'text', year, content: fallback });
      }

      fullMarkdown += `${summaryText}\n\n---\n\n`;
      send({ type: 'year_end', year });
    }

    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(MARKDOWN_FILE, fullMarkdown, 'utf-8');

    send({ type: 'done', message: 'Document generated successfully!' });
  } catch (err) {
    send({ type: 'error', message: err.message });
  }

  res.end();
});

// GET /api/export/markdown
router.get('/markdown', async (req, res) => {
  try {
    await fs.access(MARKDOWN_FILE);
    res.download(MARKDOWN_FILE, 'master_life_document.md');
  } catch {
    res.status(404).json({ error: 'No document generated yet. Click "Generate Document" first.' });
  }
});

// GET /api/export/pdf
router.get('/pdf', async (req, res) => {
  try {
    const markdown = await fs.readFile(MARKDOWN_FILE, 'utf-8').catch(() => null);
    if (!markdown) {
      return res
        .status(404)
        .json({ error: 'No document generated yet. Click "Generate Document" first.' });
    }

    marked.setOptions({ breaks: true });
    const bodyHtml = marked.parse(markdown);

    const styledHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>My Life Chronicle</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=Lora:ital,wght@0,400;0,500;1,400&display=swap');
    body {
      font-family: 'Lora', Georgia, serif;
      max-width: 750px;
      margin: 0 auto;
      padding: 48px 40px;
      background: #fff;
      color: #2a2118;
      line-height: 1.8;
      font-size: 15px;
    }
    h1 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2.8em;
      font-weight: 700;
      border-bottom: 3px solid #c8860a;
      padding-bottom: 16px;
      margin-bottom: 8px;
      color: #1a1209;
    }
    h2 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 2em;
      color: #c8860a;
      margin-top: 48px;
      margin-bottom: 24px;
      border-bottom: 1px solid #e8d5a3;
      padding-bottom: 8px;
    }
    h3 {
      font-family: 'Playfair Display', Georgia, serif;
      font-size: 1.3em;
      color: #2a2118;
      margin-top: 32px;
      margin-bottom: 12px;
    }
    p { margin: 0 0 1em; }
    hr { border: none; border-top: 1px solid #e0d5c0; margin: 28px 0; }
    code {
      background: #f5ede0;
      padding: 2px 7px;
      border-radius: 3px;
      font-size: 0.88em;
      color: #8b5e0a;
    }
    strong { color: #5a3e0a; }
    em { color: #5a4a2a; }
  </style>
</head>
<body>${bodyHtml}</body>
</html>`;

    const { default: puppeteer } = await import('puppeteer');
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });
    const page = await browser.newPage();
    await page.setContent(styledHtml, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', bottom: '20mm', left: '15mm', right: '15mm' },
    });
    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="master_life_document.pdf"');
    res.send(pdf);
  } catch (err) {
    res.status(500).json({ error: `PDF generation failed: ${err.message}` });
  }
});

export default router;
