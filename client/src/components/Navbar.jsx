import { Link, useNavigate } from 'react-router-dom';
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

  // Separate state for each dropdown
  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  
  // Separate refs for each dropdown
  const recipeDropdownRef = useRef(null);
  const settingsDropdownRef = useRef(null);

  // Close dropdowns if clicked outside
  useEffect(() => {
    function handleClickOutside(event) {
      // Close recipe dropdown if clicked outside
      if (recipeDropdownRef.current && !recipeDropdownRef.current.contains(event.target)) {
        setShowRecipeDropdown(false);
      }
      // Close settings dropdown if clicked outside
      if (settingsDropdownRef.current && !settingsDropdownRef.current.contains(event.target)) {
        setShowSettingsDropdown(false);
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
        
        {/* Recipe Dropdown */}
        <div
          className="dropdown"
          ref={recipeDropdownRef}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <button
            className="dropdown-btn"
            type="button"
            onClick={() => {
              setShowRecipeDropdown((prev) => !prev);
              // Close the other dropdown when opening this one
              setShowSettingsDropdown(false);
            }}
          >
            Recipes
          </button>
          {showRecipeDropdown && (
            <div className="dropdown-content">
              <Link to="/recipe-input" onClick={() => setShowRecipeDropdown(false)}>
                Input Recipe
              </Link>
              <Link to="/recipe-list" onClick={() => setShowRecipeDropdown(false)}>
                View Recipes
              </Link>
            </div>
          )}
        </div>
        
        {/* Settings Dropdown */}
        <div
          className="dropdown"
          ref={settingsDropdownRef}
          style={{ position: 'relative', display: 'inline-block' }}
        >
          <button
            className="dropdown-btn"
            type="button"
            onClick={() => {
              setShowSettingsDropdown((prev) => !prev);
              // Close the other dropdown when opening this one
              setShowRecipeDropdown(false);
            }}
          >
            Settings
          </button>
          {showSettingsDropdown && (
            <div className="dropdown-content">
              <Link
                to="/change-password"
                onClick={() => setShowSettingsDropdown(false)}
              >
                Change Password
              </Link>
            </div>
          )}
        </div>
      </div>
      
      <div className="nav-right">
        {/* Use a button for logout to handle the action */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="btn btn-danger btn-sm rounded-pill"
          style={{
            minWidth: 100,
            fontWeight: 600,
            opacity: loading ? 0.7 : 1,
            transition: "opacity 0.3s"
          }}
        >
          {loading ? 'Logging out...' : 'Logout'}
        </button>
      </div>
    </nav>
  );
}