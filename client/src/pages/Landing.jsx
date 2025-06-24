import React from "react";
import Navbar from "../components/Navbar";
import "../css/Landing.css";

const LandingPage = () => {
  return (
    <>
      <Navbar />
      <div className="landing-container">
        <div className="landing-hero">
          <h1>Welcome to NTUFoodie</h1>
          <p>Your guide to the best budget meals on NTU campus.</p>
          <a href="/dashboard" className="hero-button">Go to Dashboard</a>
        </div>
      </div>
    </>
  );
};

export default LandingPage;
