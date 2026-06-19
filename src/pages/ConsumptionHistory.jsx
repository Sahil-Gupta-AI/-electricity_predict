import "../styles/home.css";
import "../styles/consumptionhistory.css";
import { useState } from "react";
import { Menu, ChevronDown, Zap, BarChart2, Flame, Leaf } from "lucide-react";
import Sidebar_Menu from "./Sidebar_Menu";
import { useNavigate } from "react-router-dom";
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";

const consumptionData = [
    { month: "Jan", units: 420, season: "Winter" },
    { month: "Feb", units: 390, season: "Winter" },
    { month: "Mar", units: 480, season: "Summer" },
    { month: "Apr", units: 510, season: "Summer" },
    { month: "May", units: 560, season: "Summer" },
    { month: "Jun", units: 530, season: "Monsoon" },
    { month: "Jul", units: 500, season: "Monsoon" },
    { month: "Aug", units: 490, season: "Monsoon" },
    { month: "Sep", units: 470, season: "PostMonsoon" },
    { month: "Oct", units: 440, season: "PostMonsoon" },
    { month: "Nov", units: 500, season: "PostMonsoon" },
    { month: "Dec", units: 460, season: "Winter" },
];

const seasonColors = {
    Winter: "#637be1",
    Summer: "#f8b537",
    Monsoon: "#2ebc7f",
    PostMonsoon: "#995cf1",
};

const seasonData = Object.entries(
    consumptionData.reduce((acc, d) => {
        acc[d.season] = (acc[d.season] || 0) + d.units;
        return acc;
    }, {})
).map(([season, units]) => ({ season, units }));

const totalUnits = consumptionData.reduce((s, d) => s + d.units, 0);
const avgUnits = Math.round(totalUnits / consumptionData.length);
const peakMonth = consumptionData.reduce((a, b) => (a.units > b.units ? a : b));

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="ch-tooltip">
                <p className="ch-tooltip-label">{label}</p>
                <p className="ch-tooltip-val">{payload[0].value} KWh</p>
            </div>
        );
    }
    return null;
};

export default function ConsumptionHistory() {
    const [collapsed, setCollapsed] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    function handleLogout() {
        localStorage.removeItem("user");
        navigate("/login");
    }

    return (
        <div className="layout">
            <Sidebar_Menu collapsed={collapsed} setCollapsed={setCollapsed} />
            <div className="main-content">
                <header className="top-navbar">
                    <div className="navbar">
                        <div className="menu" onClick={() => setCollapsed(!collapsed)}>
                            <Menu />
                        </div>
                        <div className="profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="avatar">{user?.initials}</div>
                            {user?.name}
                            <ChevronDown />
                            {showProfileMenu && (
                                <div className="profile-dropdown">
                                    <div className="dropdown-item logout" onClick={handleLogout}>Logout</div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                <main className="content">
                    <h2>Consumption History</h2>

                    <div className="ch-stats">
                        <div className="ch-stat-card">
                            <div className="ch-stat-icon" id="blue">
                                <Zap size={22} color="#637be1" />
                            </div>
                            <div>
                                <p className="ch-stat-label">Total Units (2026)</p>
                                <p className="ch-stat-value">{totalUnits.toLocaleString()} KWh</p>
                            </div>
                        </div>
                        <div className="ch-stat-card">
                            <div className="ch-stat-icon" id="purple">
                                <BarChart2 size={22} color="#995cf1" />
                            </div>
                            <div>
                                <p className="ch-stat-label">Monthly Average</p>
                                <p className="ch-stat-value">{avgUnits} KWh</p>
                            </div>
                        </div>
                        <div className="ch-stat-card">
                            <div className="ch-stat-icon" id="orange">
                                <Flame size={22} color="#f8b537" />
                            </div>
                            <div>
                                <p className="ch-stat-label">Peak Month</p>
                                <p className="ch-stat-value">{peakMonth.month}</p>
                                <p className="ch-stat-sub">{peakMonth.units} KWh</p>
                            </div>
                        </div>
                        <div className="ch-stat-card">
                            <div className="ch-stat-icon" id="green">
                                <Leaf size={22} color="#2ebc7f" />
                            </div>
                            <div>
                                <p className="ch-stat-label">CO₂ Saved (est.)</p>
                                <p className="ch-stat-value">{(totalUnits * 0.82).toFixed(0)} kg</p>
                            </div>
                        </div>
                    </div>

                    <div className="ch-charts-grid">
                        <div className="ch-chart-card ch-area">
                            <h3>Monthly Consumption Trend</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <AreaChart data={consumptionData} margin={{ top: 10, right: 10, left: -5, bottom: 30 }}>
                                    <defs>
                                        <linearGradient id="unitGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6D4AFF" stopOpacity={0.35} />
                                            <stop offset="95%" stopColor="#6D4AFF" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="month" tick={{ fontSize: 12 }}
                                        label={{ value: "Month", position: "insideBottom", offset: -20 }} />
                                    <YAxis tick={{ fontSize: 12 }}
                                        label={{ value: "Units (KWh)", angle: -90, position: "insideLeft", offset: 15 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="units"
                                        stroke="#6D4AFF" strokeWidth={3}
                                        fill="url(#unitGradient)"
                                        dot={{ r: 5, fill: "#6D4AFF", strokeWidth: 2 }}
                                        activeDot={{ r: 8 }}
                                        animationDuration={1200} />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="ch-chart-card ch-season">
                            <h3>Units by Season</h3>
                            <ResponsiveContainer width="100%" height={280}>
                                <BarChart data={seasonData} margin={{ top: 10, right: 10, left: -5, bottom: 10 }}>
                                    <CartesianGrid vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="season" tick={{ fontSize: 12 }} />
                                    <YAxis tickFormatter={(v) => `${v}`} tick={{ fontSize: 12 }} />
                                    <Tooltip content={({ active, payload, label }) => active && payload?.length ? (
                                        <div className="ch-tooltip">
                                            <p className="ch-tooltip-label">{label}</p>
                                            <p className="ch-tooltip-val">{payload[0].value} KWh</p>
                                        </div>
                                    ) : null} />
                                    <Bar dataKey="units" radius={[8, 8, 0, 0]} animationDuration={1200}>
                                        {seasonData.map((entry, i) => (
                                            <Cell key={i} fill={seasonColors[entry.season]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                            <div className="ch-legend">
                                {Object.entries(seasonColors).map(([s, c]) => (
                                    <div key={s} className="ch-legend-item">
                                        <span className="ch-legend-dot" style={{ background: c }} />
                                        <span>{s}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
