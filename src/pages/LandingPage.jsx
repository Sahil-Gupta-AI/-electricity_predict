import { Link } from 'react-router-dom';
import '../styles/Landing.css';

export default function LandingPage() {
  return (
    <>
      <header>
        <div className="container nav">
          <div className="logo"><img className='logo-pic' src="./logo.png" /></div>
          <div className="nav-links">
            <Link to="/login">Login</Link>
            <Link to="/signup" className="btn-primary">Sign Up</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="hero container">
          <h1>Track Your Electricity.<br />Reduce Your Bills.</h1>
          <p>
            EnergyTrack helps you monitor appliance-wise electricity consumption,
            spot wastage, and take action — all from one simple dashboard.
          </p>
          <div className="hero-actions">
            <Link to="/signup" className="btn-primary">Get Started</Link>
            <Link to="/login" className="btn-secondary">Log In</Link>
          </div>
        </section>

        <section className="features container">
          <div className="feature">
            <div className="icon">🔌</div>
            <h3>Appliance Monitoring</h3>
            <p>See exactly how much each appliance in your home is consuming.</p>
          </div>
          <div className="feature">
            <div className="icon">📊</div>
            <h3>Usage Reports</h3>
            <p>Daily and monthly breakdowns to understand your energy patterns.</p>
          </div>
          <div className="feature">
            <div className="icon">💡</div>
            <h3>Smart Suggestions</h3>
            <p>Get tips on when and how to use appliances more efficiently.</p>
          </div>
        </section>
      </main>

      <footer>
        <div className="container">
          <p>
            
            <Link to="/login">Login</Link> &nbsp;·&nbsp;
            <Link to="/signup">Sign Up</Link>
          </p>
        </div>
        
      </footer>
    </>
  );
}