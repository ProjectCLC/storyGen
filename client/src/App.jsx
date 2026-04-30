import { useState } from 'react';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import TimelinePage from './pages/TimelinePage.jsx';
import SearchPage from './pages/SearchPage.jsx';

export default function App() {
  const [activeTab, setActiveTab] = useState('story');

  return (
    <>
      <NavBar activeTab={activeTab} onTabChange={setActiveTab} />
      {activeTab === 'story' && <Home />}
      {activeTab === 'timeline' && <TimelinePage />}
      {activeTab === 'search' && <SearchPage />}
    </>
  );
}
