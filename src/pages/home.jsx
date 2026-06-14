import { Link } from "react-router-dom";
import "../styles/home.css";
import { useState } from "react";
import { Menu } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { ClockFading } from "lucide-react";
import { StepBack } from "lucide-react";
import { FileDown } from "lucide-react";
import { FileSpreadsheet } from "lucide-react";
import { Snowflake } from "lucide-react";
import { Lightbulb } from "lucide-react";
import { PlugZap } from "lucide-react";
import Sidebar_Menu from "./Sidebar_Menu";
import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

/* BILL CHARTS IMPORT*/
import { LineChart } from "recharts";
import { Line } from "recharts";
import { XAxis } from "recharts";
import { YAxis } from "recharts";
import { CartesianGrid } from "recharts";
import { Label } from "recharts";
import { Tooltip } from "recharts";
import { ResponsiveContainer } from "recharts";
import { Area } from "recharts";
import { AreaChart } from "recharts";


export default function home() {
   
    const [collapsed, setCollapsed] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();
    
    const user = JSON.parse(localStorage.getItem('user')); 
    
    const userdetail = {
        name: user?.name,
        initials: user?.initials,
    }
    const data = [
        { month: "Jan", bill: 1000 },
        { month: "Feb", bill: 1500 },
        { month: "Mar", bill: 2000 },
        { month: "Apr", bill: 2200 },
        { month: "May", bill: 2450 },
        { month: "Jun", bill: 2750 },
    ];

    const location = useLocation();
    
    const amount = location.state?.amount;
    const unit = location.state?.unit;
    const predictUnit = location.state?.predictUnit;
    const predictAmount = location.state?.predictAmount;
    const month = location.state?.month;
    const nextMonth = location.state?.nextMonth;

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
                            <div
                                className="menu"
                                onClick={() => setCollapsed(!collapsed)}
                            >
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
                        <h2>Dashboard</h2>
                        <div className="first-row">
                            <div className="first-row-box">
                                <div className="first-row-box-icon" id="blue">
                                    <ClockFading
                                        color="#637be1"
                                        className="box-icon"
                                    />
                                </div>
                                <div className="first-row-box-box">
                                    <p className="box-text">Last Month Units</p>
                                    <p className="box-values">{unit} KWh</p>
                                    <p className="box-date">{month}</p>
                                </div>
                            </div>
                            <div className="first-row-box">
                                <div className="first-row-box-icon" id="green">
                                    <StepBack
                                        color="#2ebc7f"
                                        className="box-icon"
                                    />
                                </div>
                                <div className="first-row-box-box">
                                    <p className="box-text">Last Month Bills</p>
                                    <p className="box-values">₹{amount}</p>
                                    <p className="box-date">{month}</p>
                                </div>
                            </div>
                            <div className="first-row-box">
                                <div className="first-row-box-icon" id="orange">
                                    <FileDown
                                        color="#f8b537"
                                        className="box-icon"
                                    />
                                </div>
                                <div className="first-row-box-box">
                                    <p className="box-text">
                                        Predicted Month Units
                                    </p>
                                    <p className="box-values">{predictUnit} KWh</p>
                                    <p className="box-date">{nextMonth}</p>
                                </div>
                            </div>
                            <div className="first-row-box">
                                <div className="first-row-box-icon" id="purple">
                                    <FileSpreadsheet
                                        color="#995cf1"
                                        className="box-icon"
                                    />
                                </div>
                                <div className="first-row-box-box">
                                    <p className="box-text">
                                        Predicted Month Bills
                                    </p>
                                    <p className="box-values">₹{predictAmount}</p>
                                    <p className="box-date">{nextMonth}</p>
                                </div>
                            </div>
                        </div>

                        <div className="second-row">
                            <div className="second-row-first-box">
                                <h3 className="prediction-title">
                                    Next Month Bill Prediction
                                </h3>

                                <div className="prediction-circle">
                                    <div className="prediction-center">
                                        <h1>₹ 2,730</h1>
                                        <p>Predicted Bill</p>
                                    </div>
                                </div>
                                <div className="prediction-status">
                                    <span>↑ 11.43%</span>
                                    <p>more than last month</p>
                                </div>
                                <button className="predict-btn"
                                    onClick={()=> navigate("/predictbill")}>
                                    Predict Again
                                </button>
                            </div>

                            <div className="second-row-second-box">
                                <h3>Bill History (Last 6 Months)</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart data={data}
                                         margin={{
                                            top: 10,
                                            right: 10,
                                            left: -5,
                                            bottom: 25
                                          }}>
                                        <defs>
                                            <linearGradient
                                                id="billColor"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor="#8884d8"
                                                    stopOpacity={0.3}
                                                />
                                                <stop
                                                    offset="95%"
                                                    stopColor="#8884d8"
                                                    stopOpacity={0.05}
                                                />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid
                                            vertical={false}
                                            stroke="#e5e7eb"
                                        />
                                        <XAxis
                                            dataKey="month"
                                            label={{
                                                value: "Month",
                                                position: "insideBottom",
                                                offset: -20,
                                            }}
                                        />
                                        <YAxis
                                            ticks={[0, 1000, 2000, 3000]}
                                            tickFormatter={(value) =>
                                                value === 0
                                                    ? "0"
                                                    : `${value / 1000}K`
                                            }
                                            label={{
                                                value: "Bill (₹)",
                                                angle: -90,
                                                position: "insideLeft",
                                                offset: 15,
                                            }}
                                        />
                                        <Tooltip />
                                        <Area
                                            type="monotone"
                                            dataKey="bill"
                                            stroke="#3b82f6"
                                            strokeWidth={3}
                                            fill="url(#billColor)"
                                            dot={{
                                                r: 5,
                                                fill: "#3b82f6",
                                            }}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            <div className="second-row-third-box">
                                <div className="tips-card">
                                  <h3>Energy Saving Tips</h3>

                                  <div className="tip-item">
                                    <div className="tip-icon" id="blue">
                                        <Snowflake size={24} color="#3b82f6" />
                                    </div>

                                    <div className="tip-content">
                                      <h4>Set AC temperature to 24°C</h4>
                                      <p>You can save up to ₹300</p>
                                    </div>
                                  </div>

                                  <div className="tip-item">
                                    <div className="tip-icon" id="yellow">
                                        <Lightbulb size={24} color="#f59e0b" />
                                    </div>

                                    <div className="tip-content">
                                      <h4>Use LED bulbs</h4>
                                      <p>You can save up to ₹150</p>
                                    </div>
                                  </div>

                                  <div className="tip-item">
                                    <div className="tip-icon" id="orange">
                                        <PlugZap size={24} color="#f59e0b" />
                                    </div>

                                    <div className="tip-content">
                                      <h4>Unplug devices when not in use</h4>
                                      <p>You can save up to ₹200</p>
                                    </div>
                                  </div>

                                  <hr />

                                  <button className="view-more-btn">
                                    View More Tips →
                                  </button>
                                </div>

                            
                           
                            

                                
                            
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
