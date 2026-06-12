import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/predictbill.css";
import Sidebar_Menu from "./Sidebar_Menu";
import { Menu, ChevronDown } from "lucide-react";
import { DatePicker } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Select from "react-select";


// Symbol Or Icon Imports
import { Info } from "lucide-react";
import { LockKeyhole } from "lucide-react";
import { Zap } from "lucide-react";
import { Dessert } from "lucide-react";
import { ReceiptText } from "lucide-react";
import { HousePlus } from "lucide-react";
import { RadioTower } from "lucide-react";
import { ChevronUp } from 'lucide-react';

export default function PredictBillPage() {
  const [collapsed, setCollapsed] = useState(false);
  const [month, setMonth] = useState("");

  // company options
  const options = [
    { value: "none", label: "None" },
    { value: "best", label: "Best Power" },
    { value: "adani", label: "Adani Electricity Mumbai Limited (AEML)" },
    { value: "tata", label: "Tata Power" },
    { value: "msedcl", label: "MSEDCL (Mahavitaran)" },
    { value: "torrent", label: "Torrent Power" },
  ];
  
  const [lastudated, setLastUpdated] = useState(" 01 Jun 2024")
  const [company_status, set_company_Status] = useState("Active");
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
            <h2 className="header-h2">Predict Your Next Month Bill</h2>
            <p className="header-p">
              Enter your Details below to get an accurate prediction.
            </p>

            <div className="predict-layout">
              {/* LEFT SIDE */}
              <div className="form-card">
                <h2>Enter Information</h2>
                <p>All fields are required</p>

                <div className="top-fields">
                  <div className="field">
                    <label>Select Month</label>
                    <DatePicker
                      picker="month"
                      className="month-picker"
                      format="MMM YYYY"
                      placeholder="Select Month"
                      onChange={(date, dateString) => setMonth(dateString)}
                      suffixIcon={<CalendarOutlined />}
                    />
                  </div>

                  <div className="field">
                    <label>Electricity Provider</label>
                    <Select
                      options={options}
                      classNamePrefix="provider"
                      placeholder="Select Provider"
                      components={{
                        IndicatorSeparator: () => null
                      }}
                    />
                  </div>
                </div>

                {/* Tariff Card */}
                <div className="company-box">
                <div className="company-detail">

                  <div className="company-logo">
                    <img src="src/assets/tata-power-logo.png" alt="Tata Power" />
                  </div>

                  <div className="company-info">

                    <div className="company-header">

                      <div className="left-header">
                        <h3>Tata Power Tariff Details</h3>

                        <div className="company-status">
                          <p className="company-status-button">
                            {company_status}
                          </p>
                        </div>
                      </div>

                      <div className="last-update">
                        <p className="last-update-p">
                          Last Updated: {lastudated}
                        </p>
                        <Info />
                      </div>

                    </div>

                    <div className="tariff-grid">
                      <div>
                        <div>
                        <LockKeyhole className="grid-logo"/>
                        <h4>Fixed Charge</h4>
                        </div>
                        <div>
                        <p className="grid-values">₹140 </p>
                        <p>/ month</p>
                        </div>
                      </div>

                      <div>
                        <div>
                        <Zap className="grid-logo"/>
                        <h4>Energy Rate</h4>
                        </div>
                        <div>
                        <p className="grid-values">₹7.20 </p>
                        <p> / kWh</p>
                        </div>
                      </div>

                      <div>
                        <div>
                        <Dessert className="grid-logo"/>
                        <h4>FAC</h4>
                        </div>
                        <div>
                        <p className="grid-values">₹0.45 </p>
                        <p> / kWh</p>
                        </div>
                      </div>

                      <div>
                        <div>
                        <ReceiptText className="grid-logo"/>
                        <h4>Duty</h4>
                        </div>
                        <div>
                        <p className="grid-values">16%</p>
                        </div>
                      </div>

                      <div>
                        <div>
                        <HousePlus className="grid-logo"/>
                        <h4>Category</h4>
                        </div>
                        <div>
                        <p className="grid-values">Residential</p>
                        </div>
                      </div>

                      <div>
                        <div>
                        <RadioTower className="grid-logo"/>
                        <h4>Connection Type</h4>
                        </div>
                        <div>
                        <p className="grid-values">LT</p>
                        </div>
                      </div>
                    </div>

                    <div className="close-button">
                      <p>Close Full Tariff Details</p>
                      <ChevronUp className="grid-close"/>
                    </div>

                  </div>

                </div>
              </div>

                {/* Previous Data */}
                <h3>Previous Month Data</h3>

                <div className="previous-grid">
                  <div className="field">
                    <label>Previous Month Units (kWh)</label>
                    <input type="number" placeholder="Enter units" />
                  </div>

                  <div className="field">
                    <label>Previous Month Bill Amount (₹) </label>
                    <input type="number" placeholder="Enter amount" />
                  </div>
                </div>

                {/* History Box */}
                <div className="history-box">
                  <h3>Add Previous Previous Month Data (Optional)</h3>
                  <p>
                    Including more historical data improves prediction accuracy
                  </p>

                  <div className="history-grid">
                    <div className="field">
                      <label>Units (kWh) </label>
                      <input type="number" placeholder="Enter Units" />
                    </div>
                    <div className="field">
                      <label>Bill Amount (₹) </label>
                      <input type="number" placeholder="Enter Amount" />
                    </div>
                    <div className="field">
                      <label>Select Month</label>
                      <DatePicker
                        picker="month"
                        className="month-picker"
                        format="MMM YYYY"
                        placeholder="Select Month"
                        onChange={(date, dateString) => setMonth(dateString)}
                        suffixIcon={<CalendarOutlined />}
                      />
                    </div>
                  </div>
                </div>

                <button className="predict-btn">⚡ Predict Bill</button>
              </div>

              {/* RIGHT SIDE */}
              <div className="right-panel">
                <div className="how-card">
                  <h3>How it works?</h3>
                  <div className="step">
                    <div className="step-no"> 1 </div>
                    <p> Select the month you want to predict</p>
                  </div>

                  <div className="step">
                    <div className="step-no"> 2 </div>
                    <p>
                      {" "}
                      Enter the previous month consumption and bill amount{" "}
                    </p>
                  </div>

                  <div className="step">
                    <div className="step-no"> 3 </div>
                    <p>
                      {" "}
                      (Optional) Add more historical data for better
                      accurary{" "}
                    </p>
                  </div>

                  <div className="step">
                    <div className="step-no"> 4 </div>
                    <p> Our AI model analyses your usage pattern</p>
                  </div>

                  <div className="step">
                    <div className="step-no"> 5 </div>
                    <p> Get accurate prediction for next month bill </p>
                  </div>

                  <div className="bulb-container">
                    <img
                      className="bulb-icon"
                      src="src/assets/Bulb-images.png"
                      alt="bulb"
                    />
                  </div>
                </div>

                <div className="note-card">
                  <h3>Note</h3>
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
