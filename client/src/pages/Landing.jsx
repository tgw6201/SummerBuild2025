import "../css/Landing.css";
import Navbar from "../components/Navbar";

export default function Landing() {
  return (
    <main role="main">
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">RennyBot.co</h1>
          <p className="hero-subtitle">
            Your guide to the best recipes that are tasty and nutritional.
          </p>
          <a href="#" className="hero-button">
            Start Exploring
          </a>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="features-container">
          <div className="feature-box">
            <i class="bi bi-search-heart-fill"></i>
            <h4>Discover New Recipes</h4>
            <p>Find your favorite dishes or discover new ones.</p>
          </div>
          <div className="feature-box">
            <i class="bi bi-robot"></i>
            <h4>Ahieve Your Goals</h4>
            <p>An AI chatbot that helps you achieve your dietry goals.</p>
          </div>
          <div className="feature-box">
            <i class="bi bi-clipboard-data-fill"></i>
            <h4>Keep Track</h4>
            <p>Share your experiences and help others find great food.</p>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="testimonials-section">
        <h2>What The People Say</h2>
        <div className="testimonials-container">
          <blockquote>
            <p>
              "RennyBot has made searching for new recipes alot easier! I used
              to scroll my phone for hours trying to find the perfect recipe but
              all of that has changed thanks to RennyBot!"
            </p>
            <footer>- John Doe</footer>
          </blockquote>
          <blockquote>
            <p>
              "I always use RennyBot to find new recipes to try out. It's great
              for exploring different kinds of cuisines."
            </p>
            <footer>- Jane Smith</footer>
          </blockquote>
          <blockquote>
            <p>
              "The chatbot is suuuper helpful! I was able to easily find meals
              with the right nutritional values for my diet!"
            </p>
            <footer>- David Lee</footer>
          </blockquote>
        </div>
      </section>

      {/* Final CTA */}
      <section className="cta-section">
        <h2>Hungry?</h2>
        <p>Find the perfect meal tailored just for you.</p>
        <a href="#" className="cta-button">
          Sign Up Now
        </a>
      </section>

      {/* Footer */}
      <footer className="footer">
        <p>&copy; 2025 RennyBot.co &middot;</p>
      </footer>
    </main>
  );
}
