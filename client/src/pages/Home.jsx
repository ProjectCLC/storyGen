import { useState, useEffect } from 'react';
import EntryForm from '../components/EntryForm.jsx';
import YearBlock from '../components/YearBlock.jsx';

function getEffectiveDate(m) {
  if (m.dateConfidence === 'year-only') return new Date(m.year, 6, 1);
  return new Date(m.date);
}

function groupByYear(memories) {
  const sorted = [...memories].sort((a, b) => getEffectiveDate(a) - getEffectiveDate(b));
  return sorted.reduce((acc, m) => {
    const year = m.dateConfidence === 'year-only' ? m.year : new Date(m.date).getFullYear();
    if (!acc[year]) acc[year] = [];
    acc[year].push(m);
    return acc;
  }, {});
}

async function handleGenerateSummary(year, onChunk, setStreaming) {
  setStreaming(true);
  try {
    const res = await fetch(`/api/generate/year/${year}`, { method: 'POST' });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      onChunk(`[Error: ${data.error || res.statusText}]`);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop();
      for (const part of parts) {
        const line = part.trim();
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'text') onChunk(data.content);
            if (data.type === 'error') onChunk(`[Error: ${data.message}]`);
          } catch {}
        }
      }
    }
  } catch (err) {
    onChunk(`[Error: ${err.message}]`);
  } finally {
    setStreaming(false);
  }
}

export default function Home() {
  const [memories, setMemories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchMemories() {
    try {
      const res = await fetch('/api/memories');
      const data = await res.json();
      setMemories(Array.isArray(data) ? data : []);
    } catch {
      setMemories([]);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => { fetchMemories(); }, []);

  async function handleSave() {
    setShowForm(false);
    await fetchMemories();
  }

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading your memories…
      </div>
    );
  }

  const byYear = groupByYear(memories);
  const years = Object.keys(byYear).map(Number).sort((a, b) => a - b);

  return (
    <>
      <EntryForm isOpen={showForm} onClose={() => setShowForm(false)} onSave={handleSave} />

      <div className="main-content">
        {memories.length === 0 ? (
          <div className="empty-state">
            <h3>Your story begins here</h3>
            <p>Click &lsquo;+ Add Memory&rsquo; to add your first memory.</p>
          </div>
        ) : (
          years.map(year => (
            <YearBlock
              key={year}
              year={year}
              memories={byYear[year]}
              onGenerateSummary={handleGenerateSummary}
            />
          ))
        )}
      </div>

      <button className="add-memory-btn" onClick={() => setShowForm(true)}>
        + Add Memory
      </button>
    </>
  );
}
