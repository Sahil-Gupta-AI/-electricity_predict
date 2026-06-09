import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/predictbill.css";
import Sidebar_Menu from "./Sidebar_Menu";
import { Menu, ChevronDown } from "lucide-react";
import { Lightbulb } from "lucide-react";

export default function PredictBillPage() {
  const [collapsed, setCollapsed] = useState(false);

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
                <div className="avatar">A</div>
                Amit Kumar
                <ChevronDown />
              </div>
            </div>
          </header>
        
        <main className="content">
          <h2>Predict Next Month Bill</h2>
          <p>Enter your Details below to get an accurate prediction</p>

          <div className="predict-layout">

            {/* LEFT SIDE */}
            <div className="form-card">

              <h2>Enter Information</h2>
              <p>All fields are required</p>

              <div className="top-fields">

                <div className="field">
                  <label>Select Month</label>
                  <input type="month" value=""/>
                </div>

                <div className="field">
                  <label>Electricity Provider</label>
                  <select>
                    <option>None</option>
                    <option>Tata Power</option>
                    <option>MSEDCL</option>
                    <option>Adani Electricity</option>
                  </select>
                </div>

              </div>

              {/* Tariff Card */}
              <div className="tariff-card">

                <h3>Tata Power Tariff Details</h3>

                <div className="tariff-grid">

                  <div>
                    <h4>Fixed Charge</h4>
                    <p>₹140 / month</p>
                  </div>

                  <div>
                    <h4>Energy Rate</h4>
                    <p>₹7.20 / kWh</p>
                  </div>

                  <div>
                    <h4>FAC</h4>
                    <p>₹0.45 / kWh</p>
                  </div>

                  <div>
                    <h4>Duty</h4>
                    <p>16%</p>
                  </div>

                  <div>
                    <h4>Category</h4>
                    <p>Residential</p>
                  </div>

                  <div>
                    <h4>Connection Type</h4>
                    <p>LT</p>
                  </div>

                </div>

              </div>

              {/* Previous Data */}
              <h3>Previous Month Data</h3>

              <div className="previous-grid">

                <div className="field">
                  <label>Previous Units</label>
                  <input type="number" />
                </div>

                <div className="field">
                  <label>Previous Bill</label>
                  <input type="number" />
                </div>

              </div>

              {/* History Box */}
              <div className="history-box">

                <h3>Add Historical Data (Optional)</h3>

                <div className="history-grid">

                  <input type="number" placeholder="Units" />
                  <input type="number" placeholder="Bill Amount" />
                  <input type="month" />

                </div>

              </div>

              <button className="predict-btn">
                ⚡ Predict Bill
              </button>

            </div>

            {/* RIGHT SIDE */}
            <div className="right-panel">

              <div className="how-card">

                <h3>How it works?</h3>
<ul>
                <li> Select Month </li>  
                <li> Enter Bill Details </li>  
                <li> Add Historical Data </li>  
                <li> AI Analysis </li>  
                <li> Prediction </li>  
                </ul>
                <div className="bulb-container">
                    <Lightbulb className="bulb-icon" />
                </div>
              </div>

              <div className="note-card">
                <h3>Note</h3>
                <p>
                  More accurate input gives better prediction results.
                </p>
              </div>

            </div>

          </div>
        </main>
          </div>
      </div>
    </>
  );
}
