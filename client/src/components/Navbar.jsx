import { Link } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export default function Navbar() {
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
      <Link to="/">Chatbot</Link>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/profile">Profile</Link>
      {/* Settings Dropdown */}
      <div
        className="dropdown"
        ref={dropdownRef}
        style={{ position: 'relative', display: 'inline-block' }}
      >
        <button
          className="dropdown-btn"
          type="button"
          onClick={() => setShowDropdown((prev) => !prev)}
        >
          Settings
        </button>
        {showDropdown && (
          <div className="dropdown-content">
            <Link
              to="/change-password"
              onClick={() => setShowDropdown(false)}
            >
              Change Password
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}