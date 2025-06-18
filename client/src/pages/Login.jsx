import React from "react";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import '../css/Login.css';
import Chatbot from "./Chatbot";

export default function Login() {

  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault();
    // you can add login logic here
    // console.log("Form submitted!");
    navigate("/chatbot")
  };

  return (
    <main className="form-signin text-center">
        
      <form onSubmit={handleSubmit}>
        <h1 className="title">RennyBot.co</h1>
        <h1 className="h3 mb-3 fw-normal">Welcome back</h1>

        <div className="form-floating">
          <input
            type="email"
            className="form-control"
            id="floatingInput"
            placeholder="name@example.com"
          />
          <label htmlFor="floatingInput">Email address</label>
        </div>

        <div className="form-floating">
          <input
            type="password"
            className="form-control"
            id="floatingPassword"
            placeholder="Password"
          />
          <label htmlFor="floatingPassword">Password</label>
        </div>

        <button className="btn btn-primary" type="submit">
          Sign in
        </button>

        <p>
          <Link to="/signup" className="signup-link">Don't have an account yet? Sign up!</Link>
        </p>
      </form>
    </main>
  );
}
