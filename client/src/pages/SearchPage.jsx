import { useState, useEffect } from 'react';
import MemoryCard from '../components/MemoryCard.jsx';

const TAGS = ['childhood', 'family', 'love', 'travel', 'career', 'loss', 'achievement', 'funny', 'other'];
const MOODS = ['joyful', 'proud', 'painful', 'funny', 'nostalgic', 'bittersweet', 'neutral'];

export default function SearchPage() {
  const [memories, setMemories] = useState([]);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState(null);
  const [activeMood, setActiveMood] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch('/api/memories')
      .then(r => r.json())
      .then(data => setMemories(Array.isArray(data) ? data : []))
      .catch(() => setMemories([]))
      .finally(() => setIsLoading(false));
  }, []);

  const filtered = memories.filter(m => {
    if (query) {
      const q = query.toLowerCase();
      if (!m.title.toLowerCase().includes(q) && !m.story.toLowerCase().includes(q)) return false;
    }
    if (activeTag && (!m.tags || !m.tags.includes(activeTag))) return false;
    if (activeMood && m.mood !== activeMood) return false;
    return true;
  });

  return (
    <div className="search-container">
      <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '2rem', color: 'var(--accent-gold)', marginBottom: '1.5rem' }}>
        Search Memories
      </h2>

      <div className="search-bar">
        <input
          className="search-input"
          type="text"
          placeholder="Search your memories…"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

      <div className="filter-row">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.3rem' }}>
          Tags:
        </span>
        {TAGS.map(tag => (
          <button
            key={tag}
            className={`filter-chip${activeTag === tag ? ' active' : ''}`}
            onClick={() => setActiveTag(activeTag === tag ? null : tag)}
          >
            {tag}
          </button>
        ))}
      </div>

      <div className="filter-row">
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: '0.3rem' }}>
          Mood:
        </span>
        {MOODS.map(mood => (
          <button
            key={mood}
            className={`filter-chip${activeMood === mood ? ' active' : ''}`}
            onClick={() => setActiveMood(activeMood === mood ? null : mood)}
          >
            {mood}
          </button>
        ))}
      </div>

      {!isLoading && (
        <p className="search-results-count">
          {filtered.length} {filtered.length === 1 ? 'memory' : 'memories'} found
        </p>
      )}

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          Loading memories…
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <h3>{memories.length === 0 ? 'No memories yet' : 'No results found'}</h3>
          <p>
            {memories.length === 0
              ? 'Head to the home page and add your first memory.'
              : 'Try adjusting your search or clearing the filters.'}
          </p>
        </div>
      ) : (
        filtered.map(memory => (
          <MemoryCard key={memory.id} memory={memory} />
        ))
      )}
    </div>
  );
}
