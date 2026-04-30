import { useState } from 'react';
import MemoryCard from './MemoryCard.jsx';

export default function YearBlock({ year, memories, onGenerateSummary }) {
  const [summary, setSummary] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  function handleGenerate() {
    setSummary('');
    onGenerateSummary(
      year,
      chunk => setSummary(prev => prev + chunk),
      setIsStreaming
    );
  }

  return (
    <div className="year-section">
      <div className="year-header" style={{ cursor: 'pointer' }} onClick={() => setIsExpanded(e => !e)}>
        {year}
        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'Lora, serif', marginLeft: '0.5rem' }}>
          {isExpanded ? '▾' : '▸'} {memories.length} {memories.length === 1 ? 'memory' : 'memories'}
        </span>
      </div>

      {isExpanded && (
        <>
          {memories.map(memory => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}

          {isStreaming && (
            <div className="streaming-indicator">Generating summary…</div>
          )}

          {summary ? (
            <div className="year-summary">
              <div className="year-summary-label">Year in Review</div>
              <div className="year-summary-text">{summary}</div>
            </div>
          ) : (
            !isStreaming && (
              <button className="generate-summary-btn" onClick={handleGenerate}>
                ✦ Generate {year} Summary
              </button>
            )
          )}
        </>
      )}
    </div>
  );
}
