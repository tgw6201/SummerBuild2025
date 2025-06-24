// App.js
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
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
import RecipeList from './pages/RecipeList';
import './index.css';

// This must be used *inside* Router
function AppRoutes() {
  const location = useLocation();
  const hideNavbar = ['/', '/login', '/signup', '/onboarding'].includes(location.pathname);

  return (
    <>
      {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Landing />} /> {/* default page */}
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/recipe-input" element={<RecipeInput />} />
        <Route path="/recipe-list" element={<RecipeList />} />
        <Route path="/recipe-input/:mid" element={<RecipeInput />} />
      </Routes>
    </>
  );
}

// Wrap Router *once* here
export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
