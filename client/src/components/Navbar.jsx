import { Link, useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";

export default function Navbar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status on mount (you can adjust based on your backend logic)
  useEffect(() => {
    const checkLogin = async () => {
      try {
        const res = await fetch("http://localhost:3000/check-auth", {
          credentials: "include",
        });
        setIsLoggedIn(res.ok);
      } catch (err) {
        setIsLoggedIn(false);
      }
    };

    checkLogin();
  }, []);

  const handleLogout = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/logout", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setTimeout(() => {
          setIsLoggedIn(false);
          navigate("/login");
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

  const [showRecipeDropdown, setShowRecipeDropdown] = useState(false);
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const recipeDropdownRef = useRef(null);
  const settingsDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        recipeDropdownRef.current &&
        !recipeDropdownRef.current.contains(event.target)
      ) {
        setShowRecipeDropdown(false);
      }
      if (
        settingsDropdownRef.current &&
        !settingsDropdownRef.current.contains(event.target)
      ) {
        setShowSettingsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      {isLoggedIn ? (
        <>
          <div className="nav-left">
            <Link to="/chatbot">Chatbot</Link>
            <Link to="/dashboard">Dashboard</Link>
            <Link to="/profile">Profile</Link>

            <div
              className="dropdown"
              ref={recipeDropdownRef}
              style={{ position: "relative", display: "inline-block" }}
            >
              <button
                className="dropdown-btn"
                type="button"
                onClick={() => {
                  setShowRecipeDropdown((prev) => !prev);
                  setShowSettingsDropdown(false);
                }}
              >
                Recipes
              </button>
              {showRecipeDropdown && (
                <div className="dropdown-content">
                  <Link
                    to="/recipe-input"
                    onClick={() => setShowRecipeDropdown(false)}
                  >
                    Input Recipe
                  </Link>
                  <Link
                    to="/recipe-list"
                    onClick={() => setShowRecipeDropdown(false)}
                  >
                    View Recipes
                  </Link>
                </div>
              )}
            </div>

            <div
              className="dropdown"
              ref={settingsDropdownRef}
              style={{ position: "relative", display: "inline-block" }}
            >
              <button
                className="dropdown-btn"
                type="button"
                onClick={() => {
                  setShowSettingsDropdown((prev) => !prev);
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
            {loading ? (
              <div className="logging-out">
                <span>Logging out</span>
                <div className="loader"></div>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  fontSize: "1rem",
                  padding: 0,
                  textDecoration: "underline",
                }}
              >
                Logout
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="nav-left"></div> {/* Empty to align right properly */}
          <div className="nav-right">
            <Link to="/login" className="nav-link">
              Login
            </Link>
            <Link
              to="/register"
              className="nav-link"
              style={{ marginLeft: "1rem" }}
            >
              Sign Up
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}
