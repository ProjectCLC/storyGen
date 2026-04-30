export default function NavBar({ activeTab, onTabChange }) {
  const tabs = [
    { id: 'story', label: 'My Story' },
    { id: 'timeline', label: 'Timeline' },
    { id: 'search', label: 'Search' },
  ];

  return (
    <>
      <div className="app-header">
        <div>
          <h1 className="app-title">LifeLog</h1>
          <p className="app-subtitle">Your personal archive</p>
        </div>
      </div>
      <nav className="nav-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`nav-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </>
  );
}
