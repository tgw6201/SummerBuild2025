import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../css/Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [userid, setUserid] = React.useState("");
  const [password, setPassword] = React.useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const body = { userid, password };
      const response = await fetch("http://localhost:3000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      if (!response.ok) {
        // Handle HTTP errors
        const errorData = await response.json();
        alert(errorData.message || "Login failed");
        return;
      }
      const data = await response.json();

      // Navigate to chatbot on success
      navigate("/chatbot");
    } catch (err) {
      console.error("Login error:", err);
      alert("Something went wrong. Please try again.");
    }
  };

  return (
    <main className="form-signin text-center">
      <form onSubmit={handleSubmit}>
        <div className="title-bubble-wrapper">
          <h1 className="title">
            RennyBot.co
            <span className="bubble-layer">
              {[...Array(40)].map((_, i) => {
                const left = Math.random() * 100;
                const top = Math.random() * 90;
                const size = 4 + Math.random() * 6;
                const delay = Math.random() * 5; 
                const duration = 3 + Math.random() * 5; 

                return (
                  <span
                    key={i}
                    className="bubble-inside"
                    style={{
                      left: `${left}%`,
                      top: `${top}%`,
                      width: `${size}px`,
                      height: `${size}px`,
                      animationDelay: `${delay}s`,
                      animationDuration: `${duration}s`,
                    }}
                  />
                );
              })}
            </span>
          </h1>
        </div>
        <h1 className="h3 mb-3 fw-normal">Welcome back</h1>

        <div className="form-floating">
          <input
            type="email"
            className="form-control"
            id="floatingInput"
            placeholder="name@example.com"
            value={userid}
            onChange={(e) => setUserid(e.target.value)}
          />
          <label htmlFor="floatingInput">Email address</label>
        </div>

        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="floatingPassword"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <label htmlFor="floatingPassword">Password</label>
        </div>

        <button className="btn btn-primary" type="submit">
          Sign in
        </button>

        <p>
          <Link to="/signup" className="signup-link">
            Don't have an account yet? Sign up!
          </Link>
        </p>
      </form>
    </main>
  );
}
