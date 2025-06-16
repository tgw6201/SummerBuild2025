import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Chatbot from './pages/Chatbot';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Navbar from './components/Navbar';
import  './index.css';

function AppRoutes() {
  const location = useLocation();
  const hideNavbar = location.pathname === '/';

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Chatbot />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
