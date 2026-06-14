import { Link } from "react-router-dom";
import { useState } from "react";
import "../styles/predictbill.css";
import Sidebar_Menu from "./Sidebar_Menu";
import { Menu, ChevronDown } from "lucide-react";
import { DatePicker } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import Select from "react-select";
import { useNavigate } from "react-router-dom";
import axios from "axios";
// Symbol Or Icon Imports
import { Info } from "lucide-react";
import { LockKeyhole } from "lucide-react";
import { Zap } from "lucide-react";
import { Dessert } from "lucide-react";
import { ReceiptText } from "lucide-react";
import { HousePlus } from "lucide-react";
import { RadioTower } from "lucide-react";
import { ChevronUp } from "lucide-react";
import { IndianRupee } from "lucide-react";

export default function PredictBillPage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const userdetail = {
    name: user?.name,
    initials: user?.initials,
  };

  const [collapsed, setCollapsed] = useState(false);
  const [showTariff, setShowTariff] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const navigate = useNavigate();

  // company options
  const options = [
    { value: "none", label: "None" },
    { value: "best", label: "Best Power" },
    { value: "adani", label: "Adani Electricity Mumbai Limited (AEML)" },
    { value: "tata", label: "Tata Power" },
    { value: "msedcl", label: "MSEDCL (Mahavitaran)" },
    { value: "torrent", label: "Torrent Power" },
  ];

  const providerData = {
    none: null,

    tata: {
      logo: "src/assets/tata-power-logo.png",
      name: "Tata Power Tariff Details",
      fixedCharge: "₹140",
      energyRate: "₹7.20",
      fac: "₹0.45",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },

    adani: {
      logo: "src/assets/Adani-logo.png",
      name: "Adani Electricity Tariff Details",
      fixedCharge: "₹125",
      energyRate: "₹7.05",
      fac: "₹0.42",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },

    msedcl: {
      logo: "src/assets/MSEDCL-logo.png",
      name: "MSEDCL Tariff Details",
      fixedCharge: "₹110",
      energyRate: "₹6.50",
      fac: "₹0.38",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },

    torrent: {
      logo: "src/assets/torrent-power-logo.png",
      name: "Torrent Power Tariff Details",
      fixedCharge: "₹135",
      energyRate: "₹7.10",
      fac: "₹0.43",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },

    best: {
      logo: "src/assets/Best-power-logo.png",
      name: "BEST Power Tariff Details",
      fixedCharge: "₹120",
      energyRate: "₹6.90",
      fac: "₹0.40",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },
  };

  const selectedCompany =
    provider && provider.value !== "none" ? providerData[provider.value] : null;

  // Tariff Details
  const [lastudated, setLastUpdated] = useState(" 01 Jun 2024");
  const [company_status, set_company_Status] = useState("Active");

  const [form, setForm] = useState({
    month: "",
    amount: "",
    unit: "",
    amount2: "",
    unit2: "",
    month2: "",
  });
  function handleChange(e) {
    const { id, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  const nextMonth = dayjs(form.month, "MMM YYYY")
    .add(1, "month")
    .format("MMM YYYY");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    // Validation
    if (!form.month) {
      setError("Please select a month");
      return;
    }

    if (!provider) {
      setError("Please select an electricity provider");
      return;
    }

    if (!form.unit) {
      setError("Please enter previous month units");
      return;
    }

    if (!form.amount) {
      setError("Please enter previous month bill amount");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("/api/predict", {
        month: form.month,
        amount: form.amount,
        unit: form.unit,
      });
      console.log(res.data);
      navigate("/home", {
        state: {
          amount: form.amount,
          unit: form.unit,
          nextMonth: nextMonth,
          month: form.month,
          predictUnit: res.data.predictUnit,
          predictAmount: res.data.predictAmount,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }


  function handleLogout() {
    localStorage.removeItem("user");
    navigate("/login");
  }

  
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

              <div
                className="profile"
                onClick={() => setShowProfileMenu(!showProfileMenu)}>
                <div className="avatar">{user?.initials}</div>
                {userdetail.name}
                <ChevronDown />

                {showProfileMenu && (
                  <div className="profile-dropdown">
                    <div
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      Logout
                    </div>
                  </div>
                )}
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
                <form onSubmit={handleSubmit}>
                  <h2>Enter Information</h2>
                  <p>All fields are required</p>

                  <div className="top-fields">
                    <div className="field">
                      <label>Select Month</label>
                      <DatePicker
                        picker="month"
                        inputReadOnly={true}
                        required
                        className="month-picker"
                        format="MMM YYYY"
                        placeholder="Select Month"
                        onChange={(date, dateString) =>
                          setForm((prev) => ({
                            ...prev,
                            month: dateString,
                          }))
                        }
                        suffixIcon={<CalendarOutlined />}
                      />
                    </div>

                    <div className="field">
                      <label>Electricity Provider</label>
                      <Select
                        isSearchable={false}
                        options={options}
                        value={provider}
                        onChange={setProvider}
                        classNamePrefix="provider"
                        placeholder="Select Provider"
                        components={{
                          IndicatorSeparator: () => null,
                        }}
                      />
                    </div>
                  </div>

                  {/* Tariff Card */}
                  {selectedCompany && (
                    <div className="company-box">
                      <div className="company-detail">
                        <div className="company-logo">
                          <img
                            src={selectedCompany.logo}
                            alt={selectedCompany.name}
                          />
                        </div>

                        <div className="company-info">
                          <div className="company-header">
                            <div className="left-header">
                              <h3>{selectedCompany.name}</h3>

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

                          <div
                            className={`tariff-collapse ${showTariff ? "tariff-open" : "tariff-closed"}`}
                          >
                            <div className="tariff-grid">
                              <div>
                                <div>
                                  <LockKeyhole className="grid-logo" />
                                  <h4>Fixed Charge</h4>
                                </div>
                                <div>
                                  <p className="grid-values">
                                    {selectedCompany.fixedCharge}
                                  </p>
                                  <p>/ month</p>
                                </div>
                              </div>

                              <div>
                                <div>
                                  <Zap className="grid-logo" />
                                  <h4>Energy Rate</h4>
                                </div>
                                <div>
                                  <p className="grid-values">
                                    {selectedCompany.energyRate}
                                  </p>
                                  <p> / kWh</p>
                                </div>
                              </div>

                              <div>
                                <div>
                                  <Dessert className="grid-logo" />
                                  <h4>FAC</h4>
                                </div>
                                <div>
                                  <p className="grid-values">
                                    {selectedCompany.fac}
                                  </p>
                                  <p> / kWh</p>
                                </div>
                              </div>

                              <div>
                                <div>
                                  <ReceiptText className="grid-logo" />
                                  <h4>Duty</h4>
                                </div>
                                <div>
                                  <p className="grid-values">
                                    {selectedCompany.duty}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div>
                                  <HousePlus className="grid-logo" />
                                  <h4>Category</h4>
                                </div>
                                <div>
                                  <p className="grid-values">
                                    {selectedCompany.category}
                                  </p>
                                </div>
                              </div>

                              <div>
                                <div>
                                  <RadioTower className="grid-logo" />
                                  <h4>Connection Type</h4>
                                </div>
                                <div>
                                  <p className="grid-values">
                                    {selectedCompany.connection}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {showTariff ? (
                        <div
                          className="close-button"
                          onClick={() => setShowTariff(false)}
                        >
                          <p>Close Full Tariff Details</p>
                          <ChevronUp className="grid-close" />
                        </div>
                      ) : (
                        <div
                          className="open-tariff-button"
                          onClick={() => setShowTariff(true)}
                        >
                          <p>View Full Tariff Details</p>
                          <ChevronDown className="grid-close" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Previous Data */}
                  <h3>Previous Month Data</h3>

                  <div className="previous-grid">
                    <div className="field">
                      <label>Previous Month Units (kWh)</label>
                       <div className="input-wrapper">
                      <input
                        type="number"
                        min="0"
                        step="any"
                        placeholder="Enter units"
                        id="unit"
                        value={form.unit}
                        onChange={handleChange}
                      />
                      <span className="unit-text"> kWh </span>
                         </div>
                    </div>

                    <div className="field">
                      <label>Previous Month Bill Amount (₹) </label>
                       <div className="input-wrapper">
                      <input
                        type="number"
                        step="any"
                        min="0"
                        placeholder="Enter amount"
                        id="amount"
                        value={form.amount}
                        onChange={handleChange}
                      />
                         <IndianRupee className="rupee-icon" />
                       </div>
                    </div>
                  </div>

                  {/* History Box */}
                  <div className="history-box">
                    <h3>Add Previous Previous Month Data (Optional)</h3>
                    <p>
                      Including more historical data improves prediction
                      accuracy
                    </p>

                    <div className="history-grid">
                      <div className="field">
                        <label>Units (kWh) </label>
                        <div className="input-wrapper">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          id="unit2"
                          placeholder="Enter Units"
                          value={form.unit2}
                          onChange={handleChange}
                        />
                        <span className="unit-text"> kWh </span>
                          </div>
                      </div>
                      <div className="field">
                        <label>Bill Amount (₹) </label>
                         <div className="input-wrapper">
                        <input
                          type="number"
                          min="0"
                          step="any"
                          id="amount2"
                          placeholder="Enter Amount"
                          value={form.amount2}
                          onChange={handleChange}
                        />
                            <IndianRupee className="rupee-icon" />
                         </div>
                      </div>
                      <div className="field">
                        <label>Select Month</label>
                        <DatePicker
                          picker="month"
                          inputReadOnly={true}
                          className="month-picker"
                          format="MMM YYYY"
                          placeholder="Select Month"
                          onChange={(date, dateString) =>
                            setForm((prev) => ({
                              ...prev,
                              month2: dateString,
                            }))
                          }
                          suffixIcon={<CalendarOutlined />}
                        />
                      </div>
                    </div>
                  </div>
                  {error && (
                    <p
                      style={{
                        color: "red",
                        marginTop: "15px",
                        fontWeight: "600",
                      }}
                    >
                      {error}
                    </p>
                  )}
                  <button
                    className="predict-btn"
                    type="submit"
                    disabled={loading}
                  >
                    {loading ? "Predicting..." : "⚡ Predict Bill"}
                  </button>
                </form>
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
