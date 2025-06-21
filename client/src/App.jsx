/*Main app logic (routing between pages)*/


import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Chatbot from './pages/Chatbot'; 
import Navbar from './components/Navbar';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';
import RecipeInput from './pages/RecipeInput';
import  './index.css';

function AppRoutes() {
  const location = useLocation();
  const hideNavbar = ['/','/login','/signup','/onboarding'].includes(location.pathname);

  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<Chatbot />} /> {/* default page */}
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recipe-input" element={<RecipeInput />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Routes>
    </Router>
  );
}

export default App;