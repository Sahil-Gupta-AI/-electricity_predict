import { useState } from "react";
import "../styles/predictbill.css";
import Sidebar_Menu from "./Sidebar_Menu";
import {
  Menu, ChevronDown, Calendar, X, Zap, ShieldCheck,
  Gauge, Home, Cable, Info, ChevronRight, Lightbulb,
} from "lucide-react";

export default function PredictBillPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState("2024-06");
  const [provider, setProvider] = useState("Tata Power");

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <>
      <div className="layout">
        <Sidebar_Menu collapsed={collapsed} setCollapsed={setCollapsed} />

        <div className="main-content">
          <header className="top-navbar">
            <div className="navbar">
              <div className="menu" onClick={() => setCollapsed(!collapsed)}>
                <Menu />
              </div>
              <div className="profile">
                <div className="avatar">{user?.initials || "A"}</div>
                {user?.name || "Amit Kumar"}
                <ChevronDown />
              </div>
            </div>
          </header>

          <main className="pb-content">
            <div className="pb-page-header">
              <h2>Predict Your Next Month Bill</h2>
              <p>Enter your details below to get an accurate prediction.</p>
            </div>

            <div className="pb-layout">

              {/* ── LEFT FORM CARD ── */}
              <div className="pb-form-card">

                <div className="pb-form-title">
                  <h3>Enter Information</h3>
                  <span>All fields are required</span>
                </div>

                {/* Top two fields */}
                <div className="pb-top-fields">
                  <div className="pb-field">
                    <label>Select Month</label>
                    <div className="pb-input-wrap">
                      <input
                        type="month"
                        value={selectedMonth}
                        onChange={(e) => setSelectedMonth(e.target.value)}
                        className="pb-input"
                      />
                      <span className="pb-input-icons">
                        <Calendar size={16} />
                        <ChevronDown size={16} />
                      </span>
                    </div>
                  </div>

                  <div className="pb-field">
                    <label>Electricity Provider</label>
                    <div className="pb-input-wrap">
                      <select
                        className="pb-input pb-select"
                        value={provider}
                        onChange={(e) => setProvider(e.target.value)}
                      >
                        <option>Tata Power</option>
                        <option>MSEDCL</option>
                        <option>Adani Electricity</option>
                      </select>
                      <span className="pb-input-icons">
                        {provider && (
                          <X size={14} className="pb-clear" onClick={() => setProvider("")} />
                        )}
                        <ChevronDown size={16} />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tariff Card */}
                <div className="pb-tariff-card">
                  <div className="pb-tariff-header">
                    <div className="pb-tariff-logo">
                      <span className="pb-logo-text">TATA<br />POWER</span>
                    </div>
                    <div className="pb-tariff-title">
                      <h4>Tata Power Tariff Details</h4>
                      <span className="pb-badge-active">Active</span>
                    </div>
                    <div className="pb-tariff-updated">
                      <span>Last Updated: 01 Jun 2024</span>
                      <Info size={14} />
                    </div>
                  </div>

                  <div className="pb-tariff-grid">
                    <div className="pb-tariff-item">
                      <ShieldCheck size={16} className="pb-tariff-icon" />
                      <div>
                        <p className="pb-tariff-label">Fixed Charge</p>
                        <p className="pb-tariff-value">₹140 <span>/month</span></p>
                      </div>
                    </div>
                    <div className="pb-tariff-item">
                      <Zap size={16} className="pb-tariff-icon" />
                      <div>
                        <p className="pb-tariff-label">Energy Rate</p>
                        <p className="pb-tariff-value">₹7.20 <span>/kWh</span></p>
                      </div>
                    </div>
                    <div className="pb-tariff-item">
                      <Gauge size={16} className="pb-tariff-icon" />
                      <div>
                        <p className="pb-tariff-label">Fuel Adjustment (FAC)</p>
                        <p className="pb-tariff-value">₹0.45 <span>/kWh</span></p>
                      </div>
                    </div>
                    <div className="pb-tariff-item">
                      <ShieldCheck size={16} className="pb-tariff-icon" />
                      <div>
                        <p className="pb-tariff-label">Electricity Duty</p>
                        <p className="pb-tariff-value">16%</p>
                      </div>
                    </div>
                    <div className="pb-tariff-item">
                      <Home size={16} className="pb-tariff-icon" />
                      <div>
                        <p className="pb-tariff-label">Tariff Category</p>
                        <p className="pb-tariff-value">Residential</p>
                      </div>
                    </div>
                    <div className="pb-tariff-item">
                      <Cable size={16} className="pb-tariff-icon" />
                      <div>
                        <p className="pb-tariff-label">Connection Type</p>
                        <p className="pb-tariff-value">LT (Low Tension)</p>
                      </div>
                    </div>
                  </div>

                  <div className="pb-tariff-footer">
                    <a href="#">View Full Tariff Details <ChevronDown size={14} /></a>
                  </div>
                </div>

                {/* Previous Month Data */}
                <div className="pb-section-title">Previous Month Data</div>

                <div className="pb-prev-grid">
                  <div className="pb-field">
                    <label>Previous Month Units (kWh)</label>
                    <div className="pb-input-suffix-wrap">
                      <input type="number" placeholder="Enter units" className="pb-input" />
                      <span className="pb-suffix">kWh</span>
                    </div>
                  </div>
                  <div className="pb-field">
                    <label>Previous Month Bill Amount (₹)</label>
                    <div className="pb-input-suffix-wrap">
                      <input type="number" placeholder="Enter amount" className="pb-input" />
                      <span className="pb-suffix">₹</span>
                    </div>
                  </div>
                </div>

                {/* Optional Historical Toggle */}
                <div className="pb-optional-box">
                  <div className="pb-optional-header">
                    <div>
                      <div className="pb-optional-title">
                        Add Previous Previous Month Data
                        <span className="pb-optional-label">Optional</span>
                      </div>
                      <p className="pb-optional-sub">
                        Including more historical data improves prediction accuracy
                      </p>
                    </div>
                    <label className="pb-toggle">
                      <input
                        type="checkbox"
                        checked={showHistory}
                        onChange={() => setShowHistory(!showHistory)}
                      />
                      <span className="pb-toggle-slider"></span>
                    </label>
                  </div>

                  {showHistory && (
                    <div className="pb-history-section">
                      <p className="pb-history-label">Previous Previous Month</p>
                      <div className="pb-history-grid">
                        <div className="pb-field">
                          <label>Units (kWh)</label>
                          <div className="pb-input-suffix-wrap">
                            <input type="number" placeholder="Enter units" className="pb-input" />
                            <span className="pb-suffix">kWh</span>
                          </div>
                        </div>
                        <div className="pb-field">
                          <label>Bill Amount (₹)</label>
                          <div className="pb-input-suffix-wrap">
                            <input type="number" placeholder="Enter amount" className="pb-input" />
                            <span className="pb-suffix">₹</span>
                          </div>
                        </div>
                        <div className="pb-field">
                          <label>Month</label>
                          <div className="pb-input-suffix-wrap">
                            <input type="month" className="pb-input" />
                            <span className="pb-suffix"><Calendar size={14} /></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Predict Button */}
                <button className="pb-predict-btn">
                  <Zap size={18} /> Predict Bill
                </button>

              </div>

              {/* ── RIGHT PANEL ── */}
              <div className="pb-right-panel">

                <div className="pb-how-card">
                  <h4>How it works?</h4>
                  <ol className="pb-steps">
                    <li>
                      <span className="pb-step-num">1</span>
                      <span>Select the month you want to predict</span>
                    </li>
                    <li>
                      <span className="pb-step-num">2</span>
                      <span>Enter your previous month consumption and bill amount</span>
                    </li>
                    <li>
                      <span className="pb-step-num">3</span>
                      <span>(Optional) Add more historical data for better accuracy</span>
                    </li>
                    <li>
                      <span className="pb-step-num">4</span>
                      <span>Our AI model analyzes your usage pattern</span>
                    </li>
                    <li>
                      <span className="pb-step-num">5</span>
                      <span>Get accurate prediction for next month bill</span>
                    </li>
                  </ol>
                  <div className="pb-bulb-wrap">
                    <Lightbulb size={80} className="pb-bulb-icon" />
                  </div>
                </div>

                <div className="pb-note-card">
                  <div className="pb-note-header">
                    <Lightbulb size={18} className="pb-note-icon" />
                    <strong>Note</strong>
                  </div>
                  <p>More accurate input gives better prediction results.</p>
                </div>

              </div>

            </div>
          </main>
        </div>
      </div>
    </>
  );
}
