import React from "react";
import '../css/Login.css';
import { useNavigate } from 'react-router-dom';

export default function Login() {

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

      {/*
        <div className="checkbox mb-3">
          <label>
            <input type="checkbox" value="remember-me" /> Remember me
          </label>
        </div>
        */}
            <button className="btn btn-primary" type="submit">
            Sign in
            </button>
            <p>
                <a href="/signup" className="signup-link">Don't have an account yet? Sign up now!</a>
                </p>

      </form>
    </main>
  );
}
