import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../css/Login.css';

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    if (email === 'name@example.com' && password === 'Password') {
      navigate('/chatbot');
    } else {
      alert('Invalid credentials');
    }
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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
          <a href="/signup" className="signup-link">
            Don't have an account yet? Sign up now!
          </a>
        </p>
      </form>
    </main>
  );
}
