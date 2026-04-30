import { useState } from 'react';

const TAGS = ['childhood', 'family', 'love', 'travel', 'career', 'loss', 'achievement', 'funny', 'other'];
const MOODS = ['joyful', 'proud', 'painful', 'funny', 'nostalgic', 'bittersweet', 'neutral'];

export default function EntryForm({ isOpen, onClose, onSave }) {
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [dateType, setDateType] = useState('exact');
  const [dateValue, setDateValue] = useState('');
  const [yearValue, setYearValue] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [mood, setMood] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  function toggleTag(tag) {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }

  function resetForm() {
    setTitle('');
    setStory('');
    setDateType('exact');
    setDateValue('');
    setYearValue('');
    setSelectedTags([]);
    setMood('');
    setError('');
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!title.trim()) return setError('Title is required.');
    if (!story.trim()) return setError('Story is required.');
    if (dateType === 'yearOnly') {
      const y = parseInt(yearValue, 10);
      if (!yearValue || isNaN(y) || y < 1900 || y > new Date().getFullYear() + 1) {
        return setError('Please enter a valid year.');
      }
    } else {
      if (!dateValue) return setError('Please enter a date.');
    }

    const body = {
      title: title.trim(),
      story: story.trim(),
      dateConfidence: dateType === 'yearOnly' ? 'year-only' : dateType,
      date: dateType !== 'yearOnly' ? dateValue : null,
      year: dateType === 'yearOnly' ? parseInt(yearValue, 10) : null,
      tags: selectedTags,
      mood: mood || null,
    };

    setSubmitting(true);
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save memory.');
      resetForm();
      onSave(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && handleClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Record a Memory</span>
          <button className="modal-close" onClick={handleClose} aria-label="Close">×</button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              className="form-input"
              type="text"
              placeholder="Give this memory a name…"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Story *</label>
            <textarea
              className="form-textarea"
              placeholder="Write what you remember…"
              value={story}
              onChange={e => setStory(e.target.value)}
              rows={5}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date Confidence *</label>
            <div className="date-type-group">
              {[
                { value: 'exact', label: 'Exact date' },
                { value: 'estimated', label: 'Estimated' },
                { value: 'yearOnly', label: 'Approximate year only' },
              ].map(opt => (
                <label key={opt.value} className="date-type-option">
                  <input
                    type="radio"
                    name="dateType"
                    value={opt.value}
                    checked={dateType === opt.value}
                    onChange={() => setDateType(opt.value)}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{dateType === 'yearOnly' ? 'Year *' : 'Date *'}</label>
            {dateType === 'yearOnly' ? (
              <input
                className="form-input"
                type="number"
                placeholder="e.g. 1998"
                min="1900"
                max={new Date().getFullYear() + 1}
                value={yearValue}
                onChange={e => setYearValue(e.target.value)}
              />
            ) : (
              <input
                className="form-input"
                type="date"
                value={dateValue}
                onChange={e => setDateValue(e.target.value)}
              />
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Tags (optional)</label>
            <div className="tags-grid">
              {TAGS.map(tag => (
                <span key={tag}>
                  <input
                    type="checkbox"
                    id={`tag-${tag}`}
                    className="tag-checkbox"
                    checked={selectedTags.includes(tag)}
                    onChange={() => toggleTag(tag)}
                  />
                  <label htmlFor={`tag-${tag}`} className="tag-label">{tag}</label>
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mood / Tone (optional)</label>
            <select
              className="form-select"
              value={mood}
              onChange={e => setMood(e.target.value)}
            >
              <option value="">— select a mood —</option>
              {MOODS.map(m => (
                <option key={m} value={m}>{m.charAt(0).toUpperCase() + m.slice(1)}</option>
              ))}
            </select>
          </div>

          {error && (
            <p style={{ color: 'var(--danger)', fontSize: '0.875rem', marginBottom: '1rem' }}>
              {error}
            </p>
          )}

          <div className="form-actions">
            <button type="button" className="btn btn-ghost" onClick={handleClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving…' : 'Save Memory'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
