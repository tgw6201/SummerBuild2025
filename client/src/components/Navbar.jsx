import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
  <div className="nav-left">
    <Link to="/chatbot">Chatbot</Link>
    <Link to="/dashboard">Dashboard</Link>
    <Link to="/profile">Profile</Link>
    <Link to="/settings">Settings</Link>
  </div>
  <div className="nav-right">
    <Link to="/login">Logout</Link>
  </div>
</nav>
  );
}