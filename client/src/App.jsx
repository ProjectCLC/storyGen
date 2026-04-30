import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import TimelinePage from './pages/TimelinePage.jsx';
import ExportPage from './pages/ExportPage.jsx';

export default function App() {
  return (
    <Router>
      <NavBar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<TimelinePage />} />
          <Route path="/export" element={<ExportPage />} />
        </Routes>
      </main>
    </Router>
  );
}
