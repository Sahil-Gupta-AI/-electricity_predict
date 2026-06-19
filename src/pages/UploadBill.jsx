import "../styles/home.css";
import "../styles/uploadbill.css";
import { useState, useRef } from "react";
import {
    Menu, ChevronDown, Upload, Camera, Image, Clipboard,
    CheckCircle, FileText, AlertCircle, Download, RefreshCw, Zap
} from "lucide-react";
import Sidebar_Menu from "./Sidebar_Menu";
import { useNavigate } from "react-router-dom";

const mockExtracted = {
    company: {
        name: "Tata Power Delhi Distribution Ltd.",
        cin: "U40109DL2001PLC111626",
        website: "www.tatapower-ddl.com",
        toll: "19124 (Toll Free)",
        office: "NDPL House, Hudson Lines,\nKingsway Camp, Delhi - 110009",
        gstin: "07AABCT2062E1ZV",
    },
    consumer: {
        name: "Amit Kumar",
        id: "30001234567",
        connection: "1122334455",
        billDate: "01 Jun 2024",
        dueDate: "15 Jun 2024",
    },
    usage: {
        prevUnits: "320 KWh",
        prevAmount: "₹2,450",
        currUnits: "350 KWh",
        currAmount: "₹2,730",
        status: "Paid",
    },
    slabs: [
        { range: "0 – 100", rate: "₹4.21", desc: "First 100 units" },
        { range: "101 – 300", rate: "₹6.00", desc: "Next 200 units" },
        { range: "301 – 500", rate: "₹7.50", desc: "Next 200 units" },
        { range: "501+", rate: "₹8.75", desc: "Above 500 units" },
    ],
    summary: {
        energy: "₹2,100",
        fixed: "₹140",
        fac: "₹145",
        duty: "₹45",
        other: "₹300",
        total: "₹2,730",
    },
};

export default function UploadBill() {
    const [collapsed, setCollapsed] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [activeTab, setActiveTab] = useState("upload");
    const [dragOver, setDragOver] = useState(false);
    const [file, setFile] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [extracted, setExtracted] = useState(false);
    const fileRef = useRef();
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem("user"));

    function handleLogout() {
        localStorage.removeItem("user");
        navigate("/login");
    }

    function processFile(f) {
        if (!f) return;
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        if (!allowed.includes(f.type)) return;
        setFile(f);
        setProcessing(true);
        setExtracted(false);
        setTimeout(() => {
            setProcessing(false);
            setExtracted(true);
        }, 2000);
    }

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        processFile(e.dataTransfer.files[0]);
    }

    function handleFileInput(e) {
        processFile(e.target.files[0]);
    }

    function handleReExtract() {
        setExtracted(false);
        setFile(null);
        setProcessing(false);
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
                    <h2>Upload Your Bill &amp; View Details</h2>
                    <p className="ub-subtitle">Upload your electricity bill PDF or image to extract and view important details.</p>

                    <div className="ub-tabs">
                        <button
                            className={`ub-tab ${activeTab === "upload" ? "active" : ""}`}
                            onClick={() => setActiveTab("upload")}>
                            Upload &amp; Extract
                        </button>
                        <button
                            className={`ub-tab ${activeTab === "details" ? "active" : ""}`}
                            onClick={() => setActiveTab("details")}>
                            Extracted Details
                        </button>
                    </div>

                    {activeTab === "upload" && (
                        <div className="ub-body">
                            <div className="ub-left">
                                <div
                                    className={`ub-dropzone ${dragOver ? "dragover" : ""} ${processing ? "processing" : ""} ${extracted ? "done" : ""}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    onClick={() => !processing && !extracted && fileRef.current.click()}>
                                    <input
                                        ref={fileRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        style={{ display: "none" }}
                                        onChange={handleFileInput} />

                                    {!file && !processing && (
                                        <>
                                            <div className="ub-drop-icon">
                                                <Upload size={40} color="#6D4AFF" />
                                            </div>
                                            <p className="ub-drop-title">Drag &amp; drop your bill here</p>
                                            <p className="ub-drop-sub">Supports PDF, JPG, PNG (Max 10MB)</p>
                                            <p className="ub-drop-or">or</p>
                                            <button className="ub-choose-btn" onClick={(e) => { e.stopPropagation(); fileRef.current.click(); }}>
                                                Choose File
                                            </button>
                                            <p className="ub-formats">Supports PDF, JPG, PNG</p>
                                        </>
                                    )}

                                    {processing && (
                                        <div className="ub-processing">
                                            <div className="ub-spinner" />
                                            <p>Extracting bill details...</p>
                                            <p className="ub-file-name">{file?.name}</p>
                                        </div>
                                    )}

                                    {extracted && !processing && (
                                        <div className="ub-success">
                                            <CheckCircle size={44} color="#16A34A" />
                                            <p className="ub-success-title">Extraction Successful!</p>
                                            <p className="ub-file-name">{file?.name}</p>
                                        </div>
                                    )}
                                </div>

                                <div className="ub-other-ways">
                                    <p className="ub-other-title">Other ways to upload</p>
                                    <div className="ub-other-list">
                                        <div className="ub-other-item">
                                            <div className="ub-other-icon">
                                                <Camera size={20} color="#6D4AFF" />
                                            </div>
                                            <div>
                                                <p className="ub-other-name">Take a Photo</p>
                                                <p className="ub-other-desc">Use camera to capture bill</p>
                                            </div>
                                        </div>
                                        <div className="ub-other-item">
                                            <div className="ub-other-icon">
                                                <Image size={20} color="#6D4AFF" />
                                            </div>
                                            <div>
                                                <p className="ub-other-name">Upload from Gallery</p>
                                                <p className="ub-other-desc">Choose from your device</p>
                                            </div>
                                        </div>
                                        <div className="ub-other-item">
                                            <div className="ub-other-icon">
                                                <Clipboard size={20} color="#6D4AFF" />
                                            </div>
                                            <div>
                                                <p className="ub-other-name">Paste from Clipboard</p>
                                                <p className="ub-other-desc">Paste image from clipboard</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="ub-right">
                                <div className="ub-info-card">
                                    <h4 className="ub-info-title">How it works?</h4>
                                    <div className="ub-steps">
                                        {[
                                            "Upload your electricity bill (PDF or image)",
                                            "Our AI extracts important details from the bill",
                                            "View previous usage, amount and tariff details",
                                            "Use the data to predict and manage your next bill",
                                        ].map((step, i) => (
                                            <div key={i} className="ub-step">
                                                <div className="ub-step-num">{i + 1}</div>
                                                <p>{step}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="ub-info-card">
                                    <div className="ub-formats-header">
                                        <FileText size={18} color="#6D4AFF" />
                                        <h4>Supported Formats</h4>
                                    </div>
                                    <div className="ub-format-tags">
                                        {["PDF", "JPG", "PNG"].map(f => (
                                            <span key={f} className="ub-format-tag">{f}</span>
                                        ))}
                                    </div>
                                    <p className="ub-max-size">Max file size: 10MB</p>
                                </div>

                                <div className="ub-info-card ub-note-card">
                                    <div className="ub-formats-header">
                                        <AlertCircle size={18} color="#f59e0b" />
                                        <h4>Note</h4>
                                    </div>
                                    <p className="ub-note-text">
                                        Make sure the bill is clear and all details are visible for best results.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === "upload" && extracted && (
                        <div className="ub-extracted-section">
                            <div className="ub-extracted-header">
                                <div className="ub-extracted-title-row">
                                    <h3>Extracted Bill Details</h3>
                                    <span className="ub-success-badge">
                                        <CheckCircle size={13} /> Success
                                    </span>
                                </div>
                                <button className="ub-reextract-btn" onClick={handleReExtract}>
                                    <RefreshCw size={14} /> Re-extract
                                </button>
                            </div>
                            <ExtractedContent />
                        </div>
                    )}

                    {activeTab === "details" && (
                        <div className="ub-extracted-section">
                            {extracted ? (
                                <>
                                    <div className="ub-extracted-header">
                                        <div className="ub-extracted-title-row">
                                            <h3>Extracted Bill Details</h3>
                                            <span className="ub-success-badge">
                                                <CheckCircle size={13} /> Success
                                            </span>
                                        </div>
                                        <button className="ub-reextract-btn" onClick={handleReExtract}>
                                            <RefreshCw size={14} /> Re-extract
                                        </button>
                                    </div>
                                    <ExtractedContent />
                                </>
                            ) : (
                                <div className="ub-no-data">
                                    <Upload size={48} color="#c4b5fd" />
                                    <p>Upload a bill first to see extracted details</p>
                                    <button className="ub-choose-btn" onClick={() => setActiveTab("upload")}>
                                        Go to Upload
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}

function ExtractedContent() {
    const d = mockExtracted;
    return (
        <>
            <div className="ub-company-card">
                <h4>Company Information</h4>
                <div className="ub-company-body">
                    <div className="ub-company-left">
                        <div className="ub-company-logo">
                            <Zap size={28} color="#6D4AFF" />
                        </div>
                        <div>
                            <p className="ub-company-name">{d.company.name}</p>
                            <p className="ub-company-detail">CIN: {d.company.cin}</p>
                            <p className="ub-company-detail">🌐 {d.company.website}</p>
                            <p className="ub-company-detail">📞 {d.company.toll}</p>
                        </div>
                    </div>
                    <div className="ub-company-right">
                        <p className="ub-company-label">Registered Office</p>
                        <p className="ub-company-detail">{d.company.office}</p>
                    </div>
                    <div>
                        <p className="ub-company-label">GSTIN</p>
                        <p className="ub-company-detail">{d.company.gstin}</p>
                    </div>
                </div>
            </div>

            <div className="ub-consumer-grid">
                {[
                    { label: "Consumer Name", value: d.consumer.name, icon: "👤" },
                    { label: "Consumer ID", value: d.consumer.id, icon: "🪪" },
                    { label: "Connection Number", value: d.consumer.connection, icon: "🔌" },
                    { label: "Bill Date", value: d.consumer.billDate, icon: "📅" },
                    { label: "Due Date", value: d.consumer.dueDate, icon: "📅" },
                    { label: "Bill Status", value: d.usage.status, icon: "✅", highlight: true },
                ].map((item, i) => (
                    <div key={i} className="ub-consumer-cell">
                        <p className="ub-cell-label">{item.icon} {item.label}</p>
                        <p className={`ub-cell-value ${item.highlight ? "paid" : ""}`}>{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="ub-usage-grid">
                {[
                    { label: "Previous Month Units", value: d.usage.prevUnits, icon: "⚡" },
                    { label: "Previous Amount", value: d.usage.prevAmount, icon: "💵" },
                    { label: "Current Month Units", value: d.usage.currUnits, icon: "⚡" },
                    { label: "Current Amount", value: d.usage.currAmount, icon: "💰" },
                ].map((item, i) => (
                    <div key={i} className="ub-usage-cell">
                        <p className="ub-cell-label">{item.icon} {item.label}</p>
                        <p className="ub-cell-value">{item.value}</p>
                    </div>
                ))}
            </div>

            <div className="ub-bottom-grid">
                <div className="ub-slab-card">
                    <h4>Slab Wise Unit Charges</h4>
                    <p className="ub-slab-sub">Range based tariff structure</p>
                    <table className="ub-slab-table">
                        <thead>
                            <tr>
                                <th>Slab Range (Units)</th>
                                <th>Unit Charge (₹/Unit)</th>
                                <th>Description</th>
                            </tr>
                        </thead>
                        <tbody>
                            {d.slabs.map((s, i) => (
                                <tr key={i}>
                                    <td>{s.range}</td>
                                    <td>{s.rate}</td>
                                    <td>{s.desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <p className="ub-slab-note">* Above rates are indicative and may vary as per your electricity provider.</p>
                </div>

                <div className="ub-summary-card">
                    <h4>Bill Summary</h4>
                    <div className="ub-summary-rows">
                        <div className="ub-summary-row"><span>Energy Charges</span><span>{d.summary.energy}</span></div>
                        <div className="ub-summary-row"><span>Fixed Charge</span><span>{d.summary.fixed}</span></div>
                        <div className="ub-summary-row"><span>Fuel Adjustment (FAC)</span><span>{d.summary.fac}</span></div>
                        <div className="ub-summary-row"><span>Electricity Duty</span><span>{d.summary.duty}</span></div>
                        <div className="ub-summary-row"><span>Other Charges</span><span>{d.summary.other}</span></div>
                        <div className="ub-summary-total">
                            <span>Total Amount</span>
                            <span>{d.summary.total}</span>
                        </div>
                    </div>
                    <button className="ub-download-btn">
                        <Download size={16} /> Download Extracted Data
                    </button>
                </div>
            </div>
        </>
    );
}
