import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import "../css/Signup.css";

export default function Signup() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    /* Sign up logic here */
    // If successful:
    try {
      const response = await fetch("http://localhost:3000/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userid: form.email, password: form.password }),
        credentials: "include",
      });
      if (!response.ok) {
        const errorData = await response.json();
        setError(errorData.message || "Sign up failed");
        return;
      }
      const data = await response.json();
      // Assuming the response contains user data or a success message
      console.log("Sign up successful:", data);
      // Navigate to onboarding page after successful sign up
    } catch (err) {
      console.error("Sign up error:", err);
      setError("Something went wrong. Please try again.");
      return;
    }
    navigate("/onboarding");
  };

  return (
    <main className="form-signin text-center">
      <form onSubmit={handleSubmit}>
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
        <h1 className="h3 mb-3 fw-normal">Create your account</h1>

        <div className="form-floating">
          <input
            type="email"
            className="form-control"
            id="floatingInput"
            name="email"
            placeholder="name@example.com"
            value={form.email}
            onChange={handleChange}
            pattern="^[^@\s]+@[^@\s]+\.[^@\s]+$"
            required
          />
          <label htmlFor="floatingInput">Email address</label>
        </div>

        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="floatingPassword"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <label htmlFor="floatingPassword">Password</label>
        </div>

        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="floatingConfirmPassword"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={form.confirmPassword}
            onChange={handleChange}
            required
          />
          <label htmlFor="floatingConfirmPassword">Confirm Password</label>
        </div>

        {error && (
          <div style={{ color: "#e66a17", marginBottom: "1em" }}>{error}</div>
        )}

        <button className="btn btn-primary w-100 py-2" type="submit">
          Sign up
        </button>
        <p>
          <Link to="/login" className="signup-link">
            Already have an account? Log in!
          </Link>
        </p>
      </form>
    </main>
  );
}
