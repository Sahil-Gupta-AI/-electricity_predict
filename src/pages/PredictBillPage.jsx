import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import "../styles/predictbill.css";
import Sidebar_Menu from "./Sidebar_Menu";
import { Menu, ChevronDown } from "lucide-react";
import { DatePicker } from "antd";
import { CalendarOutlined } from "@ant-design/icons";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";
import Select from "react-select";
import axios from "axios";

dayjs.extend(customParseFormat);
// Symbol Or Icon Imports
import { Info } from "lucide-react";
import { LockKeyhole } from "lucide-react";
import { Zap } from "lucide-react";
import { Dessert } from "lucide-react";
import { ReceiptText } from "lucide-react";
import { HousePlus } from "lucide-react";
import { RadioTower } from "lucide-react";
import { ChevronUp } from "lucide-react";
import { IndianRupee, Banknote } from "lucide-react";

export default function PredictBillPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const initialBillDetails = location.state?.billDetails;

  const user = JSON.parse(localStorage.getItem("user"));
  const userdetail = {
    name: user?.name,
    initials: user?.initials,
  };

  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [showTariff, setShowTariff] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [provider, setProvider] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [activeTab, setActiveTab] = useState("history");
  const [hasBills, setHasBills] = useState(true);
  const [tariffCategory, setTariffCategory] = useState({ value: "Residential", label: "Residential" });
  const [visibleLags, setVisibleLags] = useState(2);

  const defaultAppliances = [
    { id: "ac", name: "Air Conditioner", tonnage: "1.5", watts: 1500, hours: 6, quantity: 1, active: false },
    { id: "fridge", name: "Refrigerator", watts: 250, hours: 24, quantity: 1, active: true },
    { id: "geyser", name: "Geyser / Water Heater", watts: 2000, hours: 1, quantity: 1, active: false },
    { id: "tv", name: "Television (LED)", watts: 100, hours: 5, quantity: 1, active: true },
    { id: "fan", name: "Ceiling Fan", watts: 75, hours: 12, quantity: 3, active: true },
    { id: "bulb", name: "LED Bulb", watts: 12, hours: 8, quantity: 5, active: true },
    { id: "wm", name: "Washing Machine", watts: 500, hours: 1, quantity: 1, active: false },
    { id: "comp", name: "Desktop Computer", watts: 200, hours: 4, quantity: 1, active: false },
    { id: "other", name: "Other", customName: "", watts: 100, hours: 2, quantity: 1, active: false },
  ];
  const [appliances, setAppliances] = useState(defaultAppliances);

  function handleApplianceToggle(id) {
    setAppliances(prev => prev.map(app => 
      app.id === id ? { ...app, active: !app.active } : app
    ));
  }

  function handleApplianceChange(id, field, value) {
    setAppliances(prev => prev.map(app => {
      if (app.id === id) {
        const updated = { ...app, [field]: value };
        const currentHours = field === "hours" ? parseFloat(value) : parseFloat(app.hours);
        const currentQty = field === "quantity" ? parseFloat(value) : parseFloat(app.quantity);
        if (currentHours > 0 && currentQty > 0) {
          updated.active = true;
        } else {
          updated.active = false;
        }
        return updated;
      }
      return app;
    }));
  }

  // company options
  const options = [
    { value: "none", label: "None" },
    { value: "best", label: "Best Power" },
    { value: "adani", label: "Adani Electricity Mumbai Limited (AEML)" },
    { value: "tata", label: "Tata Power" },
    { value: "msedcl", label: "MSEDCL (Mahavitaran)" },
    { value: "torrent", label: "Torrent Power" },
  ];

  // tariff category options
  const categoryOptions = [
    { value: "Residential", label: "Residential" },
    { value: "Commercial", label: "Commercial" },
    { value: "Industrial", label: "Industrial" },
  ];

  const [providerData, setProviderData] = useState({
    none: null,

    tata: {
      logo: "src/assets/tata-power-logo.png",
      name: "Tata Power Tariff Details",
      fixedCharge: "₹135",
      energyRate: "₹12.40",
      fac: "₹0.00",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },

    adani: {
      logo: "src/assets/Adani-logo.png",
      name: "Adani Electricity Tariff Details",
      fixedCharge: "₹135",
      energyRate: "₹8.13",
      fac: "₹0.65",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },

    msedcl: {
      logo: "src/assets/MSEDCL-logo.png",
      name: "MSEDCL Tariff Details",
      fixedCharge: "₹130",
      energyRate: "₹12.40",
      fac: "₹0.25",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },

    torrent: {
      logo: "src/assets/torrent-power-logo.png",
      name: "Torrent Power Tariff Details",
      fixedCharge: "₹130",
      energyRate: "₹12.57",
      fac: "₹0.15",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },

    best: {
      logo: "src/assets/Best-power-logo.png",
      name: "BEST Power Tariff Details",
      fixedCharge: "₹135",
      energyRate: "₹7.37",
      fac: "₹0.75",
      duty: "16%",
      category: "Residential",
      connection: "LT",
    },
  });

  useEffect(() => {
    const fetchTariffs = async () => {
      try {
        const res = await axios.get("/api/companies/tariff");
        setProviderData(prev => {
          const updated = { ...prev };
          Object.keys(res.data).forEach(key => {
            if (updated[key]) {
              const dbVal = res.data[key];
              if (dbVal.fixedCharge) updated[key].fixedCharge = dbVal.fixedCharge;
              if (dbVal.energyRate) updated[key].energyRate = dbVal.energyRate;
              if (dbVal.fac) updated[key].fac = dbVal.fac;
              if (dbVal.duty) updated[key].duty = dbVal.duty;
            }
          });
          return updated;
        });
      } catch (err) {
        console.error("Failed to load company tariffs from database, using defaults:", err);
      }
    };
    fetchTariffs();
  }, []);

  useEffect(() => {
    const checkUserBills = async () => {
      const token = localStorage.getItem("token");
      if (!user || !token) {
        setHasBills(true);
        return;
      }
      if (initialBillDetails) {
        setHasBills(true);
        return;
      }
      try {
        const res = await axios.get("/api/history/bills", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.data && res.data.length > 0) {
          setHasBills(true);
        } else {
          setHasBills(false);
        }
      } catch (err) {
        console.error("Failed to fetch bill history to check existence:", err);
        setHasBills(true);
      }
    };
    checkUserBills();
  }, [initialBillDetails]);

  const selectedCompany =
    provider && provider.value !== "none" ? providerData[provider.value] : null;

  const [customTariff, setCustomTariff] = useState(null);

  const displayCompany = selectedCompany ? {
    ...selectedCompany,
    fixedCharge: customTariff?.fixedCharge || selectedCompany.fixedCharge,
    energyRate: customTariff?.energyRate || selectedCompany.energyRate,
    fac: customTariff?.fac || selectedCompany.fac,
    duty: customTariff?.duty || selectedCompany.duty,
  } : null;

  useEffect(() => {
    if (provider && initialBillDetails) {
      const companyName = initialBillDetails.company?.name || "";
      const matches = companyName.toLowerCase().includes(provider.value);
      if (!matches) {
        setCustomTariff(null);
      }
    } else {
      setCustomTariff(null);
    }
  }, [provider]);

  // Tariff Details
  const [lastudated, setLastUpdated] = useState(" 01 Mar 2026");
  const [company_status, set_company_Status] = useState("Active");
  const [city, setCity] = useState("Mumbai");

  const [form, setForm] = useState({
    month: "",
    amount: "",
    unit: "",
    amount2: "",
    unit2: "",
    month2: "",
    amount3: "",
    unit3: "",
    month3: "",
    amount4: "",
    unit4: "",
    month4: "",
    amount5: "",
    unit5: "",
    month5: "",
    amount6: "",
    unit6: "",
    month6: "",
  });
  function handleChange(e) {
    const { id, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [id]: value,
    }));
  }

  const handleProviderChange = (selected) => {
    setProvider(selected);
    const provider_to_city = {
        tata: "Mumbai",
        adani: "Mumbai",
        msedcl: "Mumbai",
        torrent: "Thane",
        best: "Mumbai",
        none: "Mumbai"
    };
    if (selected && provider_to_city[selected.value]) {
        setCity(provider_to_city[selected.value]);
    }
  };

  useEffect(() => {
    if (initialBillDetails) {
      // 1. Identify and set the provider
      const companyName = initialBillDetails.company?.name || "";
      const matchedOption = options.find(opt => 
        companyName.toLowerCase().includes(opt.value) && opt.value !== "none"
      );
      if (matchedOption) {
        setProvider(matchedOption);
      }

      // Set the city from OCR or default mapping
      if (initialBillDetails.consumer?.city) {
        setCity(initialBillDetails.consumer.city);
      } else if (matchedOption) {
        const provider_to_city = {
            tata: "Mumbai",
            adani: "Mumbai",
            msedcl: "Mumbai",
            torrent: "Thane",
            best: "Mumbai",
            none: "Mumbai"
        };
        setCity(provider_to_city[matchedOption.value] || "Mumbai");
      }

      // 2. Extract units (remove KWh and trim)
      const unitsRaw = initialBillDetails.usage?.currUnits || "";
      const cleanedUnits = parseFloat(unitsRaw.replace(/[^\d\.]/g, "")) || "";

      // 3. Extract amount (remove ₹ and trim)
      const amountRaw = initialBillDetails.usage?.currAmount || "";
      const cleanedAmount = parseFloat(amountRaw.replace(/[^\d\.]/g, "")) || "";

      // 4. Extract bill date month (e.g. "10-JAN-26" -> "Jan 2026")
      const rawDate = initialBillDetails.consumer?.billDate || "";
      let parsedMonth = "";
      if (rawDate && rawDate !== "—") {
        const parts = rawDate.split(/[\/\-\s]/);
        if (parts.length >= 3) {
          const monthPart = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
          const yearPart = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
          parsedMonth = `${monthPart} ${yearPart}`;
        }
      }

      // Extract tariff details from OCR
      const ocrFixed = initialBillDetails.summary?.fixed;
      const ocrFac = initialBillDetails.summary?.fac;
      const ocrDuty = initialBillDetails.summary?.duty;
      let ocrEnergy = "";
      if (initialBillDetails.slabs && initialBillDetails.slabs.length > 0) {
        ocrEnergy = initialBillDetails.slabs[0].rate;
      }

      setCustomTariff({
        fixedCharge: ocrFixed && ocrFixed !== "—" ? ocrFixed : null,
        energyRate: ocrEnergy && ocrEnergy !== "—" ? ocrEnergy : null,
        fac: null, // Fallback to company default unit rate to avoid using total charge
        duty: null, // Fallback to company default percentage
      });

      // Pre-fill tariff category from OCR if available
      const ocrTariffCat = initialBillDetails.consumer?.tariffCategory;
      if (ocrTariffCat) {
        setTariffCategory({ value: ocrTariffCat, label: ocrTariffCat });
      }

      // Extract and map all 6 previous months from billing/payment history
      const lags = {};
      for (let i = 2; i <= 6; i++) {
        lags[`amount${i}`] = "";
        lags[`unit${i}`] = "";
        lags[`month${i}`] = "";
      }

      if (initialBillDetails.history && parsedMonth) {
        initialBillDetails.history.forEach(h => {
          const parts = h.date.split(/[\/\-\s]/);
          if (parts.length >= 3) {
            const mPart = parts[1].charAt(0).toUpperCase() + parts[1].slice(1).toLowerCase();
            const yPart = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            const hMonthStr = `${mPart} ${yPart}`;
            
            const diff = dayjs(parsedMonth, "MMM YYYY").diff(dayjs(hMonthStr, "MMM YYYY"), 'month');
            const lagIdx = diff + 1;
            
            if (lagIdx >= 2 && lagIdx <= 6) {
              const hAmt = parseFloat(h.amount.replace(/[^\d\.]/g, "")) || 0;
              lags[`amount${lagIdx}`] = hAmt ? String(hAmt) : "";
              lags[`month${lagIdx}`] = hMonthStr;
              
              // Estimate units for this lag
              let estUnits = "";
              if (hAmt > 0) {
                const fixedVal = parseFloat(String(ocrFixed || "130").replace(/[^\d\.]/g, "")) || 130;
                const rateVal = parseFloat(String(ocrEnergy || "4.28").replace(/[^\d\.]/g, "")) || 4.28;
                const subtotal = hAmt / 1.16;
                const energyCharges = subtotal - fixedVal;
                if (energyCharges > 0) {
                  let wheeling = 0.0;
                  if (rateVal === 4.28 || rateVal === 11.10) wheeling = 1.47;
                  else if (rateVal === 3.96 || rateVal === 10.80) wheeling = 1.60;
                  else if (rateVal === 4.43 || rateVal === 9.64) wheeling = 2.76;
                  else if (rateVal === 2.65 || rateVal === 5.85) wheeling = 2.28;
                  else if (rateVal === 2.10 || rateVal === 5.50) wheeling = 1.87;
                  estUnits = String(Math.max(0, Math.round(energyCharges / (rateVal + wheeling))));
                }
              }
              lags[`unit${lagIdx}`] = estUnits;
            }
          }
        });
      }

      // Interpolate any missing lags in the sequence
      for (let i = 2; i <= 6; i++) {
        if (!lags[`amount${i}`]) {
          let prevVal = parseFloat(cleanedAmount) || 0;
          let prevUnit = parseFloat(cleanedUnits) || 0;
          if (i > 2 && lags[`amount${i-1}`]) {
            prevVal = parseFloat(lags[`amount${i-1}`]) || 0;
            prevUnit = parseFloat(lags[`unit${i-1}`]) || 0;
          }
          
          let nextVal = 0;
          let nextUnit = 0;
          for (let j = i + 1; j <= 6; j++) {
            if (lags[`amount${j}`]) {
              nextVal = parseFloat(lags[`amount${j}`]) || 0;
              nextUnit = parseFloat(lags[`unit${j}`]) || 0;
              break;
            }
          }
          
          if (nextVal > 0) {
            lags[`amount${i}`] = String(Math.round((prevVal + nextVal) / 2));
            lags[`unit${i}`] = String(Math.round((prevUnit + nextUnit) / 2));
          } else {
            lags[`amount${i}`] = String(Math.round(prevVal));
            lags[`unit${i}`] = String(Math.round(prevUnit));
          }
          
          if (parsedMonth) {
            lags[`month${i}`] = dayjs(parsedMonth, "MMM YYYY").subtract(i - 1, "month").format("MMM YYYY");
          }
        }
      }

      // Find maximum lag index that has data to set initial visibility
      let maxLag = 2;
      for (let i = 2; i <= 6; i++) {
        if (lags[`amount${i}`]) {
          maxLag = i;
        }
      }
      setVisibleLags(maxLag);

      setForm(prev => ({
        ...prev,
        unit: cleanedUnits ? String(cleanedUnits) : prev.unit,
        amount: cleanedAmount ? String(cleanedAmount) : prev.amount,
        month: parsedMonth || prev.month,
        ...lags
      }));
    }
  }, [initialBillDetails]);

  const nextMonth = dayjs(form.month, "MMM YYYY")
    .add(1, "month")
    .format("MMM YYYY");

  const calculateEstimatedUnits = () => {
    let units = -12.3411; // Model Intercept

    // Add Month coefficient (Month ranges from 1 to 12)
    if (form.month) {
      const monthNum = dayjs(form.month, "MMM YYYY").month() + 1;
      units += monthNum * 0.9114;
    } else {
      units += (dayjs().month() + 1) * 0.9114;
    }

    // Add Appliance coefficients based on the trained model
    appliances.forEach(app => {
      if (app.active) {
        const usageProduct = parseFloat(app.hours || 0) * parseFloat(app.quantity || 0);
        if (app.id === "fan") {
          units += usageProduct * 0.8996;
        } else if (app.id === "fridge") {
          units += usageProduct * 0.0; // Baseline is constant (24 hrs) and absorbed by intercept
        } else if (app.id === "ac") {
          units += usageProduct * 50.3841;
        } else if (app.id === "tv") {
          units += usageProduct * 7.1221;
        } else if (app.id === "comp") {
          units += usageProduct * 8.0354;
        } else if (app.id === "geyser") {
          units += usageProduct * 66.8053;
        } else if (app.id === "bulb") {
          units += usageProduct * 7.3836;
        } else if (app.id === "wm") {
          units += usageProduct * 36.2937;
        } else if (app.id === "other") {
          units += usageProduct * (100 * 30 / 1000);  // 3 kWh per hour of daily usage
        }
      }
    });

    return Math.max(0, Math.round(units * 100) / 100);
  };

  const getEstimatedBill = (units) => {
    if (!displayCompany) return 0;
    const fixed = parseFloat(displayCompany.fixedCharge.replace(/[^\d\.]/g, "")) || 0;
    const rate = parseFloat(displayCompany.energyRate.replace(/[^\d\.]/g, "")) || 0;
    const fac = parseFloat(displayCompany.fac.replace(/[^\d\.]/g, "")) || 0;
    const dutyStr = displayCompany.duty || "";
    let dutyPercent = 16;
    if (typeof dutyStr === "string" && dutyStr.includes("%")) {
      dutyPercent = parseFloat(dutyStr.replace(/[^\d\.]/g, "")) || 16;
    } else if (typeof dutyStr === "number") {
      dutyPercent = dutyStr;
    }

    const energyCharge = units * rate;
    const facCharge = units * fac;
    const subtotal = fixed + energyCharge + facCharge;
    const duty = subtotal * (dutyPercent / 100);
    return Math.round((subtotal + duty) * 100) / 100;
  };

  async function handleApplianceSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.month) {
      setError("Please select a month");
      return;
    }

    if (!provider || provider.value === "none") {
      setError("Please select an electricity provider");
      return;
    }

    const estimatedUnits = calculateEstimatedUnits();
    if (estimatedUnits <= 0) {
      setError("Please select at least one active appliance with non-zero usage");
      return;
    }

    const estimatedBill = getEstimatedBill(estimatedUnits);

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const res = await axios.post("/api/predict", {
        prediction_type: "appliances",
        provider: provider.value,
        city: city,
        month: form.month,
        amount: estimatedBill,
        unit: estimatedUnits,
        fixedCharge: displayCompany.fixedCharge,
        energyRate: displayCompany.energyRate,
        fac: displayCompany.fac,
        duty: displayCompany.duty,
        appliances: {
          fan: appliances.find(a => a.id === "fan")?.active ? appliances.find(a => a.id === "fan").hours : 0,
          fan_qty: appliances.find(a => a.id === "fan")?.active ? appliances.find(a => a.id === "fan").quantity : 0,
          fridge: appliances.find(a => a.id === "fridge")?.active ? appliances.find(a => a.id === "fridge").hours : 0,
          fridge_qty: appliances.find(a => a.id === "fridge")?.active ? appliances.find(a => a.id === "fridge").quantity : 0,
          ac: appliances.find(a => a.id === "ac")?.active ? appliances.find(a => a.id === "ac").hours : 0,
          ac_qty: appliances.find(a => a.id === "ac")?.active ? appliances.find(a => a.id === "ac").quantity : 0,
          tv: appliances.find(a => a.id === "tv")?.active ? appliances.find(a => a.id === "tv").hours : 0,
          tv_qty: appliances.find(a => a.id === "tv")?.active ? appliances.find(a => a.id === "tv").quantity : 0,
          monitor: appliances.find(a => a.id === "comp")?.active ? appliances.find(a => a.id === "comp").hours : 0,
          monitor_qty: appliances.find(a => a.id === "comp")?.active ? appliances.find(a => a.id === "comp").quantity : 0,
          bulb: appliances.find(a => a.id === "bulb")?.active ? appliances.find(a => a.id === "bulb").hours : 0,
          bulb_qty: appliances.find(a => a.id === "bulb")?.active ? appliances.find(a => a.id === "bulb").quantity : 0,
          geyser: appliances.find(a => a.id === "geyser")?.active ? appliances.find(a => a.id === "geyser").hours : 0,
          geyser_qty: appliances.find(a => a.id === "geyser")?.active ? appliances.find(a => a.id === "geyser").quantity : 0,
          wm: appliances.find(a => a.id === "wm")?.active ? appliances.find(a => a.id === "wm").hours : 0,
          wm_qty: appliances.find(a => a.id === "wm")?.active ? appliances.find(a => a.id === "wm").quantity : 0,
          other: appliances.find(a => a.id === "other")?.active ? appliances.find(a => a.id === "other").hours : 0,
          other_qty: appliances.find(a => a.id === "other")?.active ? appliances.find(a => a.id === "other").quantity : 0,
          motorPump: 0
        }
      }, {
        headers: headers
      });

      const nextMonthName = dayjs(form.month, "MMM YYYY")
        .add(1, "month")
        .format("MMM YYYY");

      navigate("/home", {
        state: {
          amount: estimatedBill,
          unit: estimatedUnits,
          nextMonth: nextMonthName,
          month: form.month,
          predictUnit: res.data.predictUnit,
          predictAmount: res.data.predictAmount,
        },
      });
    } catch (err) {
      let msg = err.response?.data?.message || "Something went wrong";
      if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("jwt")) {
        msg = "Session expired. Please log out and log back in to refresh your session.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

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

    for (let i = 2; i <= visibleLags; i++) {
      if ((form[`unit${i}`] && !form[`amount${i}`]) || (!form[`unit${i}`] && form[`amount${i}`])) {
        setError(`Please fill in both Units and Amount for Lag Month ${i}, or leave both empty.`);
        return;
      }
    }

    try {
      setLoading(true);

      const token = localStorage.getItem("token");
      const headers = token ? { "Authorization": `Bearer ${token}` } : {};

      const payload = {
        month: form.month,
        amount: form.amount,
        unit: form.unit,
        provider: provider ? provider.value : "none",
        city: city,
        fixedCharge: displayCompany.fixedCharge,
        energyRate: displayCompany.energyRate,
        fac: displayCompany.fac,
        duty: displayCompany.duty,
        tariffCategory: tariffCategory ? tariffCategory.value : "Residential",
      };

      if (form.unit2 && form.amount2 && visibleLags >= 2) {
        payload.unit2 = form.unit2;
        payload.amount2 = form.amount2;
        payload.month2 = form.month2 || dayjs(form.month, "MMM YYYY").subtract(1, "month").format("MMM YYYY");
      }
      for (let i = 3; i <= visibleLags; i++) {
        if (form[`unit${i}`] && form[`amount${i}`]) {
          payload[`unit${i}`] = form[`unit${i}`];
          payload[`amount${i}`] = form[`amount${i}`];
          payload[`month${i}`] = form[`month${i}`] || dayjs(form.month, "MMM YYYY").subtract(i - 1, "month").format("MMM YYYY");
        }
      }

      const res = await axios.post("/api/predict", payload, {
        headers: headers
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
          unit2: res.data.unit2 || "",
          amount2: res.data.amount2 || "",
          month2: form.month2 || "",
        },
      });
    } catch (err) {
      let msg = err.response?.data?.message || "Something went wrong";
      if (msg.toLowerCase().includes("token") || msg.toLowerCase().includes("expired") || msg.toLowerCase().includes("jwt")) {
        msg = "Session expired. Please log out and log back in to refresh your session.";
      }
      setError(msg);
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

            {!hasBills && (
              <div style={{
                background: "#f5f3ff",
                border: "1.5px dashed #c4b5fd",
                borderRadius: "12px",
                padding: "16px 20px",
                color: "#6d4aff",
                marginBottom: "24px",
                fontSize: "14.5px",
                fontWeight: "500",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center"
              }}>
                <span>Tip: You can upload an electricity bill to automatically extract your previous usage and tariff details, or enter them manually below.</span>
                <button 
                  onClick={() => navigate("/uploadbill")} 
                  style={{
                    backgroundColor: "#6d4aff",
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

            <div className="predict-layout">
              {/* LEFT SIDE */}
              <div className="form-card">
                <form onSubmit={activeTab === "history" ? handleSubmit : handleApplianceSubmit}>
                  <h2>Enter Information</h2>
                  <p>All fields are required</p>

                  <div className="top-fields" style={{ gridTemplateColumns: window.innerWidth > 640 ? "repeat(3, 1fr)" : "1fr" }}>
                    <div className="field">
                      <label>Select Month</label>
                      <DatePicker
                        picker="month"
                        inputReadOnly={true}
                        disabled={loading}
                        required
                        className="month-picker"
                        format="MMM YYYY"
                        placeholder="Select Month"
                        value={form.month && dayjs(form.month, "MMM YYYY").isValid() ? dayjs(form.month, "MMM YYYY") : null}
                        onChange={(date, dateString) =>
                          setForm((prev) => {
                            const updated = { ...prev, month: dateString };
                            if (dateString) {
                              const baseDate = dayjs(dateString, "MMM YYYY");
                              for (let i = 2; i <= 6; i++) {
                                if (baseDate.isValid()) {
                                  updated[`month${i}`] = baseDate.subtract(i - 1, "month").format("MMM YYYY");
                                }
                              }
                            } else {
                              for (let i = 2; i <= 6; i++) {
                                updated[`month${i}`] = "";
                              }
                            }
                            return updated;
                          })
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
                        onChange={handleProviderChange}
                        isDisabled={loading}
                        classNamePrefix="provider"
                        placeholder="Select Provider"
                        components={{
                          IndicatorSeparator: () => null,
                        }}
                      />
                    </div>

                    <div className="field">
                      <label>Tariff Category</label>
                      <Select
                        isSearchable={false}
                        options={categoryOptions}
                        value={tariffCategory}
                        onChange={(selected) => setTariffCategory(selected)}
                        isDisabled={loading}
                        classNamePrefix="provider"
                        placeholder="Select Category"
                        components={{
                          IndicatorSeparator: () => null,
                        }}
                      />
                    </div>
                  </div>

                  {displayCompany && (
                    <div className="company-box">
                      <div className="company-detail">
                        <div className="company-logo">
                          <img
                            src={displayCompany.logo}
                            alt={displayCompany.name}
                          />
                        </div>

                        <div className="company-info">
                          <div className="company-header">
                            <div className="left-header">
                              <h3>{displayCompany.name}</h3>

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
                                    {displayCompany.fixedCharge}
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
                                    {displayCompany.energyRate}
                                  </p>
                                  <p> / kWh</p>
                                </div>
                              </div>

                              <div>
                                <div>
                                  <Dessert className="grid-logo" />
                                  <h4>Fuel Adjustment Charge (FAC)</h4>
                                </div>
                                <div>
                                  <p className="grid-values">
                                    {displayCompany.fac}
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
                                    {displayCompany.duty}
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
                                    {displayCompany.category}
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
                                    {displayCompany.connection}
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

                  {initialBillDetails?.history && initialBillDetails.history.length > 0 && (
                    <div style={{
                      background: "linear-gradient(135deg, #fdfbf7 0%, #f5f3ff 100%)",
                      border: "1px solid #e9d5ff",
                      borderRadius: "12px",
                      padding: "16px",
                      marginTop: "20px"
                    }}>
                      <h4 style={{ fontSize: "14px", fontWeight: "600", color: "#581c87", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                        <Banknote size={15} color="#7c3aed" /> Extracted Billing &amp; Payment History
                      </h4>
                      <p style={{ fontSize: "12px", color: "#6b7280", marginBottom: "12px" }}>These values are extracted from your PDF and used to improve model predictions.</p>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {initialBillDetails.history.map((h, i) => (
                          <div key={i} style={{
                            backgroundColor: "white",
                            border: "1px solid #e9d5ff",
                            borderRadius: "8px",
                            padding: "8px 12px",
                            fontSize: "13px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "2px",
                            boxShadow: "0 1px 2px 0 rgba(0,0,0,0.05)"
                          }}>
                            <span style={{ color: "#6b7280", fontSize: "10.5px" }}>{h.date}</span>
                            <span style={{ color: "#111827", fontWeight: "700" }}>{h.amount}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB SWITCHER */}
                  <div className="predict-tabs" style={{ marginTop: "24px" }}>
                    <button 
                      type="button" 
                      className={`predict-tab ${activeTab === "history" ? "active" : ""}`} 
                      onClick={() => setActiveTab("history")}
                    >
                      Predict with History
                    </button>
                    <button 
                      type="button" 
                      className={`predict-tab ${activeTab === "appliances" ? "active" : ""}`} 
                      onClick={() => setActiveTab("appliances")}
                    >
                      Predict with Appliances
                    </button>
                  </div>

                  {activeTab === "history" ? (
                    <>
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
                            disabled={loading}
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
                            disabled={loading}
                          />
                             <IndianRupee className="rupee-icon" />
                           </div>
                        </div>
                      </div>

               
                      <div className="history-box">
                        <h3>Add Historical Data (Lags 2 to 6)</h3>
                        <p>
                          Providing more past months' data will use the new 6-month prediction model.
                        </p>

                        {Array.from({ length: visibleLags - 1 }, (_, index) => {
                          const i = index + 2;
                          return (
                            <div key={i} className="history-grid" style={{
                              borderBottom: i < visibleLags ? "1px dashed #e5e7eb" : "none",
                              paddingBottom: i < visibleLags ? "16px" : "0",
                              marginBottom: i < visibleLags ? "16px" : "0"
                            }}>
                              <div className="field">
                                <label>{form[`month${i}`] ? `${form[`month${i}`]} Units` : `Month ${i} Units`} (kWh)</label>
                                <div className="input-wrapper">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  id={`unit${i}`}
                                  placeholder="Enter Units"
                                  value={form[`unit${i}`]}
                                  onChange={handleChange}
                                  disabled={loading}
                                />
                                <span className="unit-text"> kWh </span>
                                  </div>
                              </div>
                              <div className="field">
                                <label>{form[`month${i}`] ? `${form[`month${i}`]} Amount` : `Month ${i} Amount`} (₹)</label>
                                 <div className="input-wrapper">
                                <input
                                  type="number"
                                  min="0"
                                  step="any"
                                  id={`amount${i}`}
                                  placeholder="Enter Amount"
                                  value={form[`amount${i}`]}
                                  onChange={handleChange}
                                  disabled={loading}
                                />
                                    <IndianRupee className="rupee-icon" />
                                 </div>
                              </div>
                              <div className="field">
                                <label>Select Month</label>
                                <DatePicker
                                  picker="month"
                                  inputReadOnly={true}
                                  disabled={loading}
                                  className="month-picker"
                                  format="MMM YYYY"
                                  placeholder="Select Month"
                                  value={form[`month${i}`] && dayjs(form[`month${i}`], "MMM YYYY").isValid() ? dayjs(form[`month${i}`], "MMM YYYY") : null}
                                  onChange={(date, dateString) =>
                                    setForm((prev) => ({
                                      ...prev,
                                      [`month${i}`]: dateString,
                                    }))
                                  }
                                  suffixIcon={<CalendarOutlined />}
                                />
                              </div>
                            </div>
                          );
                        })}

                        <div style={{ display: "flex", gap: "12px", marginTop: "16px" }}>
                          {visibleLags < 6 && (
                            <button
                              type="button"
                              onClick={() => setVisibleLags(prev => Math.min(6, prev + 1))}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: "1px solid #6d4aff",
                                background: "#f5f3ff",
                                color: "#6d4aff",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              + Add History Month
                            </button>
                          )}
                          {visibleLags > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                setForm(prev => ({
                                  ...prev,
                                  [`amount${visibleLags}`]: "",
                                  [`unit${visibleLags}`]: "",
                                  [`month${visibleLags}`]: ""
                                }));
                                setVisibleLags(prev => Math.max(2, prev - 1));
                              }}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                padding: "8px 14px",
                                borderRadius: "8px",
                                border: "1px solid #ef4444",
                                background: "#fef2f2",
                                color: "#ef4444",
                                fontSize: "13px",
                                fontWeight: "600",
                                cursor: "pointer",
                                transition: "all 0.2s"
                              }}
                            >
                              - Remove Last Month
                            </button>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="appliance-section" style={{ marginTop: "20px" }}>
                      <h3 style={{ fontSize: "20px", marginBottom: "8px", color: "#18191b" }}>Appliance Profiler</h3>
                      <p style={{ color: "#74788F", fontSize: "14.5px", marginBottom: "20px" }}>
                        Toggle the appliances active in your household and customize their quantity &amp; daily usage hours to calculate a precise consumption baseline.
                      </p>

                      <div className="appliance-table-wrapper" style={{ overflowX: "auto" }}>
                        <table className="appliance-table" style={{ width: "100%", borderCollapse: "collapse", minWidth: "500px" }}>
                          <thead>
                            <tr style={{ borderBottom: "2px solid #e5e7eb", textAlign: "left" }}>
                              <th style={{ padding: "12px 8px", color: "#4b5563", fontWeight: "600" }}>Active</th>
                              <th style={{ padding: "12px 8px", color: "#4b5563", fontWeight: "600" }}>Appliance</th>
                              <th style={{ padding: "12px 8px", color: "#4b5563", fontWeight: "600" }}>Watts</th>
                              <th style={{ padding: "12px 8px", color: "#4b5563", fontWeight: "600" }}>Qty</th>
                              <th style={{ padding: "12px 8px", color: "#4b5563", fontWeight: "600" }}>Hours/Day</th>
                              <th style={{ padding: "12px 8px", color: "#4b5563", fontWeight: "600", textAlign: "right" }}>Est. Monthly KWh</th>
                            </tr>
                          </thead>
                          <tbody>
                            {appliances.map(app => {
                              const estMonthlyKWh = Math.round(((app.watts * app.hours * app.quantity * 30) / 1000) * 100) / 100;
                              return (
                                <tr key={app.id} style={{ borderBottom: "1px solid #e5e7eb", background: app.active ? "#faf8ff" : "transparent" }}>
                                  <td style={{ padding: "12px 8px" }}>
                                    <input 
                                      type="checkbox" 
                                      checked={app.active} 
                                      onChange={() => handleApplianceToggle(app.id)}
                                      disabled={loading}
                                      style={{ width: "18px", height: "18px", accentColor: "#6D4AFF", cursor: "pointer" }}
                                    />
                                  </td>
                                  <td style={{ padding: "12px 8px", fontWeight: "500", color: app.active ? "#1f2937" : "#9ca3af", display: "flex", alignItems: "center", gap: "8px", borderBottom: "none" }}>
                                    {app.id === "other" ? (
                                      <input 
                                        type="text" 
                                        placeholder="Enter appliance name"
                                        value={app.customName}
                                        onChange={(e) => handleApplianceChange(app.id, "customName", e.target.value)}
                                        disabled={loading}
                                        style={{ height: "34px", padding: "0 8px", borderRadius: "6px", border: "1px solid #d1d5db", width: "160px" }}
                                      />
                                    ) : (
                                      <span>{app.name}</span>
                                    )}

                                    {app.id === "ac" && (
                                      <select
                                        value={app.tonnage}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          const watts = val === "1.0" ? 1000 : val === "1.5" ? 1500 : val === "2.0" ? 2000 : 2500;
                                          handleApplianceChange(app.id, "tonnage", val);
                                          handleApplianceChange(app.id, "watts", watts);
                                        }}
                                        disabled={loading}
                                        style={{ height: "34px", padding: "0 4px", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", fontWeight: "600", cursor: "pointer" }}
                                      >
                                        <option value="1.0">1.0 Ton (1000W)</option>
                                        <option value="1.5">1.5 Ton (1500W)</option>
                                        <option value="2.0">2.0 Ton (2000W)</option>
                                        <option value="2.5">2.5 Ton (2500W)</option>
                                      </select>
                                    )}
                                  </td>
                                  <td style={{ padding: "12px 8px" }}>
                                    <input 
                                      type="number" 
                                      value={app.watts} 
                                      onChange={(e) => handleApplianceChange(app.id, "watts", parseInt(e.target.value) || 0)}
                                      disabled={loading}
                                      style={{ width: "80px", height: "34px", padding: "0 8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                      min="1"
                                    />
                                  </td>
                                  <td style={{ padding: "12px 8px" }}>
                                    <input 
                                      type="number" 
                                      value={app.quantity} 
                                      onChange={(e) => handleApplianceChange(app.id, "quantity", parseInt(e.target.value) || 0)}
                                      disabled={loading}
                                      style={{ width: "60px", height: "34px", padding: "0 8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                      min="1"
                                    />
                                  </td>
                                  <td style={{ padding: "12px 8px" }}>
                                    <input 
                                      type="number" 
                                      value={app.hours} 
                                      onChange={(e) => handleApplianceChange(app.id, "hours", parseFloat(e.target.value) || 0)}
                                      disabled={loading}
                                      style={{ width: "60px", height: "34px", padding: "0 8px", borderRadius: "6px", border: "1px solid #d1d5db" }}
                                      min="0"
                                      max="24"
                                      step="0.5"
                                    />
                                  </td>
                                  <td style={{ padding: "12px 8px", textAlign: "right", fontWeight: "600", color: app.active ? "#6D4AFF" : "#9ca3af" }}>
                                    {estMonthlyKWh} KWh
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* LIVE PREVIEW BANNER */}
                      <div style={{
                        marginTop: "24px",
                        background: "#faf8ff",
                        border: "1.5px dashed #c4b5fd",
                        borderRadius: "12px",
                        padding: "16px 20px",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <div style={{ textAlign: "left" }}>
                          <p style={{ color: "#5b3df5", fontSize: "14.5px", fontWeight: "700", margin: 0 }}>Calculated Monthly Baseline</p>
                          <p style={{ color: "#6b7280", fontSize: "13px", marginTop: "4px", margin: 0 }}>
                            Estimates baseline consumption. Predict to refine with weather &amp; AI models.
                          </p>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <p style={{ fontSize: "28px", fontWeight: "800", color: "#5b3df5", margin: 0 }}>
                            {calculateEstimatedUnits()} <span style={{ fontSize: "16px", fontWeight: "500" }}>KWh</span>
                          </p>
                          {displayCompany && (
                            <p style={{ fontSize: "13px", color: "#4b5563", marginTop: "2px", fontWeight: "600", margin: 0 }}>
                              Est. Tariff Bill: ₹{getEstimatedBill(calculateEstimatedUnits())}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
                  {activeTab === "history" ? (
                    <>
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
                          accuracy{" "}
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="step">
                        <div className="step-no"> 1 </div>
                        <p> Select month and electricity provider</p>
                      </div>

                      <div className="step">
                        <div className="step-no"> 2 </div>
                        <p> Toggle active appliances and adjust quantity &amp; hours </p>
                      </div>

                      <div className="step">
                        <div className="step-no"> 3 </div>
                        <p> Review live baseline consumption &amp; tariff bill calculation </p>
                      </div>
                    </>
                  )}

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
