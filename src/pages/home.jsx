import { Link } from "react-router-dom";
import "../styles/home.css";
import { useState, useEffect, useMemo } from "react";
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
import axios from "axios";
import dayjs from "dayjs";

import { XAxis } from "recharts";
import { YAxis } from "recharts";
import { CartesianGrid } from "recharts";
import { Tooltip } from "recharts";
import { ResponsiveContainer } from "recharts";
import { Area } from "recharts";
import { AreaChart } from "recharts";

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const PREV_VARIATIONS = [0.78, 0.88, 1.06, 0.93];
const MAX_BILL = 7000;

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="chart-tooltip">
                <p className="tooltip-month">{label}</p>
                <p className="tooltip-value">₹ {payload[0].value?.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

export default function home() {

    const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [displayProgress, setDisplayProgress] = useState(0);
    const navigate = useNavigate();

    const user = JSON.parse(localStorage.getItem('user'));

    const userdetail = {
        name: user?.name,
        initials: user?.initials,
    };

    const location = useLocation();

    const [amount, setAmount] = useState(location.state?.amount || "");
    const [unit, setUnit] = useState(location.state?.unit || "");
    const [predictUnit, setPredictUnit] = useState(location.state?.predictUnit || "");
    const [predictAmount, setPredictAmount] = useState(location.state?.predictAmount || "");
    const [month, setMonth] = useState(location.state?.month || "");
    const [nextMonth, setNextMonth] = useState(location.state?.nextMonth || "");

    useEffect(() => {
        // If we don't have predictions in the navigation state, fetch the latest one from the backend
        if (!location.state || !location.state.predictAmount) {
            const fetchLatestPrediction = async () => {
                try {
                    const token = localStorage.getItem("token");
                    if (!token) return;

                    const res = await axios.get("/api/history/predictions", {
                        headers: {
                            Authorization: `Bearer ${token}`
                        }
                    });

                    if (res.data && res.data.length > 0) {
                        const latest = res.data[0]; // sorted by createdAt: -1 on backend
                        setAmount(latest.inputAmount !== undefined ? String(latest.inputAmount) : "");
                        setUnit(latest.inputUnit !== undefined ? String(latest.inputUnit) : "");
                        setPredictUnit(latest.predictUnit !== undefined ? String(latest.predictUnit) : "");
                        setPredictAmount(latest.predictAmount !== undefined ? String(latest.predictAmount) : "");
                        setMonth(latest.month || "");
                        
                        if (latest.month) {
                            const nextMonthName = dayjs(latest.month, "MMM YYYY")
                                .add(1, "month")
                                .format("MMM YYYY");
                            setNextMonth(nextMonthName);
                        }
                    }
                } catch (err) {
                    console.error("Error fetching latest prediction:", err);
                }
            };
            fetchLatestPrediction();
        }
    }, [location.state]);

    const progress = useMemo(() => {
        if (!predictAmount) return 0;
        return Math.min((parseFloat(predictAmount) / MAX_BILL) * 100, 100);
    }, [predictAmount]);

    useEffect(() => {
        const t = setTimeout(() => setDisplayProgress(progress), 150);
        return () => clearTimeout(t);
    }, [progress]);

    const percentageChange = useMemo(() => {
        const a = parseFloat(amount);
        const p = parseFloat(predictAmount);
        if (!a || !p) return null;
        return ((p - a) / a) * 100;
    }, [amount, predictAmount]);

    const chartData = useMemo(() => {
        if (!month || !amount || !predictAmount) return [];

        const [monthStr, yearStr] = month.split(" ");
        const monthIndex = MONTH_NAMES.indexOf(monthStr);
        const year = parseInt(yearStr);
        const currentBill = parseFloat(amount);
        const predictedBill = parseFloat(predictAmount);

        const points = PREV_VARIATIONS.map((ratio, i) => {
            const d = new Date(year, monthIndex - (4 - i), 1);
            return {
                month: MONTH_NAMES[((d.getMonth()) + 12) % 12],
                bill: Math.round(currentBill * ratio),
            };
        });

        points.push({ month: monthStr, bill: currentBill });
        points.push({
            month: nextMonth ? nextMonth.split(" ")[0] : "Next",
            bill: predictedBill,
        });

        return points;
    }, [amount, predictAmount, month, nextMonth]);

    const yTicks = useMemo(() => {
        if (!chartData.length) return [0, 1000, 2000, 3000];
        const maxBill = Math.max(...chartData.map(d => d.bill));
        return [0, 0.25, 0.5, 0.75, 1.0].map(pct => Math.round(maxBill * pct));
    }, [chartData]);

    function handleLogout() {
        localStorage.removeItem("user");
        navigate("/login");
    }

    return (
        <>
            <div className="layout">
                <Sidebar_Menu collapsed={collapsed} setCollapsed={setCollapsed} />
                {!collapsed && (
                    <div className="mobile-sidebar-backdrop" onClick={() => setCollapsed(true)} />
                )}
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
                                        <div className="dropdown-item logout" onClick={handleLogout}>
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
                                    <ClockFading color="#637be1" className="box-icon" />
                                </div>
                                <div className="first-row-box-box">
                                    <p className="box-text">Last Month Units</p>
                                    <p className="box-values">{unit} KWh</p>
                                    <p className="box-date">{month}</p>
                                </div>
                            </div>
                            <div className="first-row-box">
                                <div className="first-row-box-icon" id="green">
                                    <StepBack color="#2ebc7f" className="box-icon" />
                                </div>
                                <div className="first-row-box-box">
                                    <p className="box-text">Last Month Bills</p>
                                    <p className="box-values">₹{amount}</p>
                                    <p className="box-date">{month}</p>
                                </div>
                            </div>
                            <div className="first-row-box">
                                <div className="first-row-box-icon" id="orange">
                                    <FileDown color="#f8b537" className="box-icon" />
                                </div>
                                <div className="first-row-box-box">
                                    <p className="box-text">Predicted Month Units</p>
                                    <p className="box-values">{predictUnit} KWh</p>
                                    <p className="box-date">{nextMonth}</p>
                                </div>
                            </div>
                            <div className="first-row-box">
                                <div className="first-row-box-icon" id="purple">
                                    <FileSpreadsheet color="#995cf1" className="box-icon" />
                                </div>
                                <div className="first-row-box-box">
                                    <p className="box-text">Predicted Month Bills</p>
                                    <p className="box-values">₹{predictAmount}</p>
                                    <p className="box-date">{nextMonth}</p>
                                </div>
                            </div>
                        </div>

                        <div className="second-row">
                            <div className="second-row-first-box">
                                <h3 className="prediction-title">Next Month Bill Prediction</h3>

                                <div
                                    className="prediction-circle"
                                    style={{ '--progress': displayProgress }}
                                >
                                    <div className="prediction-center">
                                        <h1>₹{predictAmount ?? "—"}</h1>
                                        <p>Predicted Bill</p>
                                    </div>
                                </div>

                                {percentageChange !== null && (
                                    <div className={`prediction-badge ${percentageChange >= 0 ? "badge-up" : "badge-down"}`}>
                                        {percentageChange >= 0
                                            ? `↑ ${percentageChange.toFixed(2)}% from last month`
                                            : `↓ ${Math.abs(percentageChange).toFixed(2)}% from last month`
                                        }
                                    </div>
                                )}

                                <button
                                    className="predict-btn"
                                    onClick={() => navigate("/predictbill")}>
                                    Predict Again
                                </button>
                            </div>

                            <div className="second-row-second-box">
                                <h3>Bill History (Last 6 Months)</h3>
                                <ResponsiveContainer width="100%" height={350}>
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -5, bottom: 25 }}>
                                        <defs>
                                            <linearGradient id="billGradient" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6D4AFF" stopOpacity={0.35} />
                                                <stop offset="95%" stopColor="#6D4AFF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid vertical={false} stroke="#E5E7EB" />
                                        <XAxis
                                            dataKey="month"
                                            label={{ value: "Month", position: "insideBottom", offset: -20 }}
                                            tick={{ fontSize: 13 }}
                                        />
                                        <YAxis
                                            ticks={yTicks}
                                            tickFormatter={(v) => v === 0 ? "0" : `${(v / 1000).toFixed(1)}K`}
                                            label={{ value: "Bill (₹)", angle: -90, position: "insideLeft", offset: 15 }}
                                            tick={{ fontSize: 13 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="bill"
                                            stroke="#6D4AFF"
                                            strokeWidth={3}
                                            fill="url(#billGradient)"
                                            animationDuration={1500}
                                            dot={{ r: 6, fill: "#6D4AFF", strokeWidth: 3 }}
                                            activeDot={{ r: 8 }}
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
                                    <button className="view-more-btn">View More Tips →</button>
                                </div>
                            </div>
                        </div>
                    </main>
                </div>
            </div>
        </>
    );
}
