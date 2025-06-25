import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function LogoutButton() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setLoading(true);

    try {
      const response = await fetch("http://localhost:3000/logout", {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        // Optional: brief delay to show success or fade out
        setTimeout(() => {
          navigate("/login");
        }, 500); // half a second delay
      } else {
        alert("Logout failed. Please try again.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed. Please try again.");
      setLoading(false);
    }
  };

   return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="btn btn-danger px-4 py-2 rounded-pill d-flex align-items-center gap-2"
      style={{
        fontWeight: 600,
        fontSize: "1.1rem",
        minWidth: 150,
        opacity: loading ? 0.7 : 1,
        transition: "opacity 0.3s"
      }}
    >
      <i className="bi bi-box-arrow-right"></i>
      {loading ? "Logging out..." : "Logout"}
    </button>
  );
}

export default LogoutButton;
