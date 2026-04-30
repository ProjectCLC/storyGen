import { useState } from 'react';

function formatDate(memory) {
  if (memory.dateConfidence === 'year-only') return String(memory.year);
  const d = new Date(memory.date);
  const formatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  return memory.dateConfidence === 'estimated' ? `~${formatted}` : formatted;
}

export default function MemoryCard({ memory }) {
  const [expanded, setExpanded] = useState(false);
  const isEstimated = memory.dateConfidence !== 'exact';
  const moodColor = memory.mood ? `var(--mood-${memory.mood})` : 'var(--text-muted)';

  return (
    <div className={`memory-card${isEstimated ? ' estimated' : ''}`}>
      <div className="memory-card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
          {memory.mood && (
            <span className="mood-dot" style={{ background: moodColor }} title={memory.mood} />
          )}
          <span className="memory-title">{memory.title}</span>
        </div>
        <span className={`memory-date${isEstimated ? ' estimated' : ''}`}>
          {formatDate(memory)}
        </span>
      </div>

      <p className={`memory-story${expanded ? '' : ' collapsed'}`}>{memory.story}</p>

      <button className="read-more-btn" onClick={() => setExpanded(e => !e)}>
        {expanded ? 'Show less' : 'Read more'}
      </button>

      {memory.tags && memory.tags.length > 0 && (
        <div className="memory-tags" style={{ marginTop: '0.7rem' }}>
          {memory.tags.map(tag => (
            <span key={tag} className="memory-tag">{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}
