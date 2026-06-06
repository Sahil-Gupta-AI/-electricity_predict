import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';

export default function SignupPage() {
  const [form, setForm] = useState({
    fname: '',
    lname: '',
    email: '',
    password: '',
    confirm: '',
    terms: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    const { id, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    // Replace with your actual signup logic
    setTimeout(() => {
      setLoading(false);
      alert('Signup logic goes here!');
    }, 1500);
  }

  return (
    <div className="page">

      <div className="brand">
        <Link to="/">⚡ EnergyTrack</Link>
      </div>

      <div className="card">
        <h1>Create account</h1>
        <p className="subtitle">Start tracking your electricity usage for free.</p>

        <form onSubmit={handleSubmit}>

          <div className="row-two">
            <div className="field">
              <label htmlFor="fname">First name</label>
              <input
                id="fname"
                type="text"
                placeholder="Jane"
                value={form.fname}
                onChange={handleChange}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="lname">Last name</label>
              <input
                id="lname"
                type="text"
                placeholder="Doe"
                value={form.lname}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="confirm">Confirm password</label>
            <input
              id="confirm"
              type="password"
              placeholder="Re-enter password"
              value={form.confirm}
              onChange={handleChange}
              required
            />
          </div>

          {error && <p className="error-msg">{error}</p>}

          <div className="check-row">
            <input
              type="checkbox"
              id="terms"
              checked={form.terms}
              onChange={handleChange}
              required
            />
            <label htmlFor="terms">
              I agree to the <a href="#">Terms of Service</a>
            </label>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Creating account…' : 'Create Account'}
          </button>

        </form>

        <p className="switch">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>

    </div>
  );
}