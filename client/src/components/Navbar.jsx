import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/logout', {
        method: 'POST',
        credentials: 'include', // Important to send cookies!
      });

      if (res.ok) {
        // Optionally add a slight delay to show loading effect
        setTimeout(() => {
          navigate('/login');
        }, 300);
      } else {
        alert("Logout failed, please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed, please try again.");
      setLoading(false);
    }
  };

  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <div className="nav-left">
        <Link to="/chatbot">Chatbot</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/settings">Settings</Link>
      </div>
      <div className="nav-right">
        {/* Use a button for logout to handle the action */}
        <button 
          onClick={handleLogout} 
          disabled={loading}
          style={{
            background: 'none',
            border: 'none',
            color: 'inherit',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '1rem',
            padding: 0,
            textDecoration: 'underline',
          }}
        >
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </nav>
  );
}
