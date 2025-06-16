import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Chatbot from './pages/Chatbot';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import  './index.css';

function App() {
  const location = useLocation();
  const hideNavbar = ['/','/login','/signup'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </>
  );
}

export default App;
