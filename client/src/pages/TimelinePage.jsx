import { useState, useEffect } from 'react';

function getEffectiveDate(m) {
  if (m.dateConfidence === 'year-only') return new Date(m.year, 6, 1);
  return new Date(m.date);
}

function formatBadgeDate(m) {
  if (m.dateConfidence === 'year-only') return `~${m.year}`;
  const d = new Date(m.date);
  const formatted = d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return m.dateConfidence === 'estimated' ? `~${formatted}` : formatted;
}

export default function TimelinePage() {
  const [memories, setMemories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/memories')
      .then(r => r.json())
      .then(data => setMemories(Array.isArray(data) ? data : []))
      .catch(() => setMemories([]))
      .finally(() => setIsLoading(false));
  }, []);

  const sorted = [...memories].sort((a, b) => getEffectiveDate(a) - getEffectiveDate(b));

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        Loading timeline…
      </div>
    );
  }

  return (
    <div className="timeline-container">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '2rem' }}>
        Timeline
      </h2>

      {sorted.length === 0 ? (
        <div className="empty-state">
          <h3>No memories yet</h3>
          <p>Head to the home page and add your first memory to see it appear here.</p>
        </div>
      ) : (
        <div className="timeline">
          {sorted.map((memory, index) => {
            const isEstimated = memory.dateConfidence !== 'exact';
            const preview = memory.story.length > 120
              ? memory.story.slice(0, 120) + '…'
              : memory.story;
            const moodColor = memory.mood ? `var(--mood-${memory.mood})` : null;

            return (
              <div
                key={memory.id}
                className="timeline-item"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`timeline-card${isEstimated ? ' estimated' : ''}`}>
                  <span className="timeline-date-badge">{formatBadgeDate(memory)}</span>
                  <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                    {memory.title}
                  </h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '0.6rem' }}>
                    {preview}
                  </p>
                  {memory.mood && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span className="mood-dot" style={{ background: moodColor }} />
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                        {memory.mood}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
