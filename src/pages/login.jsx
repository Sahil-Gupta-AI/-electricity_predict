import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    // Replace with your actual login logic
    setTimeout(() => {
      setLoading(false);
      alert('Login logic goes here!');
    }, 1500);
  }

  return (
    <div className="page">

      <div className="brand">
        <Link to="/">⚡ EnergyTrack</Link>
      </div>

      <div className="card">
        <h1>Log in</h1>
        <p className="subtitle">Welcome back. Enter your details below.</p>

        <form onSubmit={handleSubmit}>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">
              Password
              <a href="#" className="label-link">Forgot password?</a>
            </label>
            <input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="check-row">
            <input
              type="checkbox"
              id="remember"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />
            <label htmlFor="remember">Keep me logged in</label>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Logging in…' : 'Log In'}
          </button>

        </form>

        <p className="switch">
          Don't have an account? <Link to="/signup">Sign up</Link>
        </p>
      </div>

    </div>
  );
}