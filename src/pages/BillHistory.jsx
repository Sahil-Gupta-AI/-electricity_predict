import "../styles/home.css";
import "../styles/billhistory.css";
import { useState } from "react";
import { Menu, ChevronDown, TrendingUp, TrendingDown, IndianRupee, Calendar } from "lucide-react";
import Sidebar_Menu from "./Sidebar_Menu";
import { useNavigate } from "react-router-dom";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell
} from "recharts";

import { useEffect } from "react";

const mockData = [
    { month: "Jan 2026", units: 420, amount: 3780, status: "Paid" },
    { month: "Feb 2026", units: 390, amount: 3510, status: "Paid" },
    { month: "Mar 2026", units: 480, amount: 4320, status: "Paid" },
    { month: "Apr 2026", units: 510, amount: 4590, status: "Paid" },
    { month: "May 2026", units: 560, amount: 5040, status: "Paid" },
    { month: "Jun 2026", units: 530, amount: 4770, status: "Paid" },
    { month: "Jul 2026", units: 500, amount: 4500, status: "Paid" },
    { month: "Aug 2026", units: 490, amount: 4410, status: "Paid" },
    { month: "Sep 2026", units: 470, amount: 4230, status: "Paid" },
    { month: "Oct 2026", units: 440, amount: 3960, status: "Paid" },
    { month: "Nov 2026", units: 500, amount: 4500, status: "Paid" },
    { month: "Dec 2026", units: 460, amount: 4140, status: "Pending" },
];

const parseBillDate = (rawDate) => {
    if (!rawDate || rawDate === "—") return "Unknown";
    const parts = rawDate.split(/[\/\-\s]/);
    if (parts.length >= 3) {
        let monthPart = parts[1];
        monthPart = monthPart.charAt(0).toUpperCase() + monthPart.slice(1).toLowerCase();
        let yearPart = parts[2];
        if (yearPart.length === 2) yearPart = `20${yearPart}`;
        return `${monthPart} ${yearPart}`;
    }
    return rawDate;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bh-tooltip">
                <p className="bh-tooltip-month">{label}</p>
                <p className="bh-tooltip-val">₹ {payload[0].value.toLocaleString()}</p>
            </div>
        );
    }
    return null;
};

export default function BillHistory() {
    const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const token = localStorage.getItem("token");
                const res = await fetch("http://localhost:8000/api/history/bills", {
                    headers: token ? { "Authorization": `Bearer ${token}` } : {}
                });
                const data = await res.json();
                if (res.ok) {
                    setBills(data);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, []);

    const isDemo = bills.length === 0;
    const billData = isDemo ? mockData : bills.map(b => ({
        month: parseBillDate(b.billDate),
        units: b.units,
        amount: b.amount,
        status: "Paid"
    }));

    const totalPaid = billData.reduce((s, d) => s + d.amount, 0);
    const avgBill = billData.length > 0 ? Math.round(totalPaid / billData.length) : 0;
    const highest = billData.length > 0 ? billData.reduce((a, b) => (a.amount > b.amount ? a : b)) : { month: "—", amount: 0 };

    function handleLogout() {
        localStorage.removeItem("user");
        navigate("/login");
    }

    return (
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
                    <h2>Bill History</h2>

                    {isDemo && (
                        <div style={{
                            background: "#faf8ff",
                            border: "1.5px dashed #c4b5fd",
                            borderRadius: "12px",
                            padding: "16px 20px",
                            color: "#5b3df5",
                            marginBottom: "24px",
                            fontSize: "14.5px",
                            fontWeight: "500",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <span>Viewing demo data. Upload your first bill to see your actual bill history dashboard!</span>
                            <button 
                                onClick={() => navigate("/uploadbill")} 
                                style={{
                                    backgroundColor: "#6D4AFF",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    padding: "8px 16px",
                                    cursor: "pointer",
                                    fontWeight: "600",
                                    transition: "all 0.2s"
                                }}
                            >
                                Upload Bill
                            </button>
                        </div>
                    )}

                    <div className="bh-stats">
                        <div className="bh-stat-card">
                            <div className="bh-stat-icon" id="purple">
                                <IndianRupee size={22} color="#995cf1" />
                            </div>
                            <div>
                                <p className="bh-stat-label">Total Paid (2026)</p>
                                <p className="bh-stat-value">₹{totalPaid.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bh-stat-card">
                            <div className="bh-stat-icon" id="blue">
                                <TrendingUp size={22} color="#637be1" />
                            </div>
                            <div>
                                <p className="bh-stat-label">Average Monthly Bill</p>
                                <p className="bh-stat-value">₹{avgBill.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bh-stat-card">
                            <div className="bh-stat-icon" id="orange">
                                <TrendingDown size={22} color="#f8b537" />
                            </div>
                            <div>
                                <p className="bh-stat-label">Highest Bill Month</p>
                                <p className="bh-stat-value">{highest.month}</p>
                                <p className="bh-stat-sub">₹{highest.amount.toLocaleString()}</p>
                            </div>
                        </div>
                        <div className="bh-stat-card">
                            <div className="bh-stat-icon" id="green">
                                <Calendar size={22} color="#2ebc7f" />
                            </div>
                            <div>
                                <p className="bh-stat-label">Bills Recorded</p>
                                <p className="bh-stat-value">{billData.length} Months</p>
                            </div>
                        </div>
                    </div>

                    <div className="bh-main-grid">
                        <div className="bh-chart-card">
                            <h3>Monthly Bill Overview</h3>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={billData} margin={{ top: 10, right: 10, left: -5, bottom: 30 }}>
                                    <CartesianGrid vertical={false} stroke="#E5E7EB" />
                                    <XAxis dataKey="month" tick={{ fontSize: 11 }}
                                        tickFormatter={(v) => v.split(" ")[0]}
                                        label={{ value: "Month", position: "insideBottom", offset: -20 }} />
                                    <YAxis tickFormatter={(v) => `${v / 1000}K`} tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="amount" radius={[6, 6, 0, 0]} animationDuration={1200}>
                                        {billData.map((entry, i) => (
                                            <Cell key={i} fill={entry.amount === highest.amount ? "#6D4AFF" : "#C4B5FD"} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="bh-table-card">
                            <h3>Bill Details</h3>
                            <div className="bh-table-wrap">
                                <table className="bh-table">
                                    <thead>
                                        <tr>
                                            <th>Month</th>
                                            <th>Units (KWh)</th>
                                            <th>Amount</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {[...billData].reverse().map((row, i) => (
                                            <tr key={i}>
                                                <td>{row.month}</td>
                                                <td>{row.units}</td>
                                                <td>₹{row.amount.toLocaleString()}</td>
                                                <td>
                                                    <span className={`bh-badge ${row.status === "Paid" ? "paid" : "pending"}`}>
                                                        {row.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
