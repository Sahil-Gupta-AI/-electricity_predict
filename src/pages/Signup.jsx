import { useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/auth.css';
import axios from "axios";
import { useNavigate } from 'react-router-dom';

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
  const [showTermsModal, setShowTermsModal] = useState(false);
  const navigate = useNavigate();
  
  function handleChange(e) {
    const { id, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }

    try {
      
      setLoading(true);

      const res = await axios.post(
        "/api/auth/register",
        {
          fname: form.fname,
          lname: form.lname,
          email: form.email,
          password: form.password,
        }
      );
        navigate("/login")
      // alert(res.data.message);

    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">

      <div className="brand">
        <Link to="/"> Tejas Cyber Solution</Link>
      </div>

      <div className="card">
        <h1>Create account</h1>
        <p className="subtitle">Start tracking your electricity usage for free.</p>

        <form onSubmit={handleSubmit} className="form" >

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
              I agree to the <a href="#" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}>Terms of Service</a>
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

      {showTermsModal && (
        <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Terms of Service</h2>
              <button className="modal-close-btn" onClick={() => setShowTermsModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <p style={{ fontWeight: '500', color: '#111827' }}>Please read these Terms of Service carefully before registering.</p>
              
              <h3>1. Service Description</h3>
              <p>Our platform provides the following services:</p>
              <ul>
                <li>Retrieving your electricity consumption history from the past months.</li>
                <li>Analyzing your usage patterns.</li>
                <li>Generating a predicted electricity bill for the upcoming month.</li>
                <li>Offering personalized suggestions to help reduce your energy consumption and lower your bill.</li>
              </ul>

              <h3>2. User Responsibilities</h3>
              <p>By using this service, you agree to:</p>
              <ul>
                <li>Provide accurate and truthful login credentials for your electricity provider account.</li>
                <li>Maintain the confidentiality of your login information.</li>
                <li>Understand that all predicted bills are estimates and may not match your final utility bill exactly.</li>
                <li>Use the service only for its intended purpose.</li>
                <li>Refrain from attempting to access data belonging to other users.</li>
              </ul>

              <h3>3. Disclaimer of Accuracy</h3>
              <ul>
                <li>Predictions and savings suggestions are for informational purposes only.</li>
                <li>We do not guarantee exact accuracy of predicted bills.</li>
                <li>Actual charges may vary due to tariff changes, taxes, rate adjustments, or unforeseen consumption spikes.</li>
                <li>We are not liable for any decisions made based on these predictions.</li>
              </ul>

              <h3>4. Third-Party Data Access</h3>
              <ul>
                <li>You authorize us to access your electricity usage data from your utility provider on your behalf.</li>
                <li>This access is used solely to deliver the services described.</li>
                <li>We are not affiliated with or endorsed by any utility provider unless explicitly stated.</li>
              </ul>

              <h3>5. Limitation of Liability</h3>
              <ul>
                <li>We strive to provide useful insights but cannot guarantee completeness or accuracy.</li>
                <li>We shall not be held liable for any direct, indirect, or consequential losses arising from use of or reliance on our predictions and suggestions.</li>
              </ul>

              <h3>6. Changes to Terms</h3>
              <ul>
                <li>We reserve the right to update these terms at any time.</li>
                <li>Continued use of the platform after changes constitutes acceptance of the new terms.</li>
                <li>Users will be notified of significant changes via email or platform notification.</li>
              </ul>

              <h3>7. Data Sharing & Disclosure</h3>
              <p><strong>We Do Not:</strong></p>
              <ul>
                <li>Sell, rent, or trade your personal data.</li>
                <li>Share individual consumption records with third parties for marketing.</li>
              </ul>
              <p><strong>We May:</strong></p>
              <ul>
                <li>Share anonymized, aggregated data (non-identifiable) for research or reporting.</li>
                <li>Disclose data if required by law or to protect our legal rights.</li>
              </ul>

              <h3>8. Contact Information</h3>
              <p>Gmail: <strong>tejascybersolutions@gmail.com</strong></p>
              <p>Contact Info: <strong>support@tejascyber.com</strong></p>
              <p>Other details: Available on our official contact portal.</p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn-close" onClick={() => setShowTermsModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

