const express = require("express");
const router = express.Router();
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");
const auth = require("../middleware/auth");
const Bill = require("../models/Bill");
const CompanyProfile = require("../models/CompanyProfile");

function getCompanyKey(name) {
    if (!name) return "none";
    const n = name.toLowerCase();
    if (n.includes("torrent")) return "torrent";
    if (n.includes("msedcl") || n.includes("mahavitaran") || n.includes("mahadiscom") || n.includes("maharashtra state") || n.includes("महावितरण") || n.includes("महाराष्ट्र राज्य")) return "msedcl";
    if (n.includes("tata")) return "tata";
    if (n.includes("adani")) return "adani";
    if (n.includes("best")) return "best";
    return "none";
}

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        cb(null, allowed.includes(file.mimetype));
    },
});

router.post("/extract", auth, upload.single("file"), async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });

        const form = new FormData();
        form.append("file", req.file.buffer, {
            filename: req.file.originalname,
            contentType: req.file.mimetype,
        });

        const flaskRes = await axios.post("http://localhost:5001/extract", form, {
            headers: form.getHeaders(),
            maxBodyLength: Infinity,
        });

        const d = flaskRes.data;

        // Save to database (Graceful fallback if MongoDB Atlas is unreachable or offline)
        try {
            const unitsRaw = d.usage?.currUnits || "0";
            const amountRaw = d.usage?.currAmount || "0";
            const units = parseFloat(unitsRaw.replace(/[^\d\.]/g, "")) || 0;
            const amount = parseFloat(amountRaw.replace(/[^\d\.]/g, "")) || 0;

            if (req.user && req.user.id) {
                // Clean old bill history for this user to avoid stale entries
                await Bill.deleteMany({ user: req.user.id });

                const bill = new Bill({
                    user: req.user.id,
                    company: d.company?.name || "—",
                    consumerName: d.consumer?.name || "—",
                    billDate: d.consumer?.billDate || "—",
                    dueDate: d.consumer?.dueDate || "—",
                    units: units,
                    amount: amount
                });

                await bill.save();
                console.log(`Saved extracted bill in MongoDB for user: ${req.user.email}`);

                // Save payment history as separate bills to update dashboard graphs
                if (d.history && Array.isArray(d.history)) {
                    for (const h of d.history) {
                        const hUnits = parseFloat((h.units || "").replace(/[^\d\.]/g, "")) || 0;
                        let hAmt = parseFloat((h.amount || "").replace(/[^\d\.]/g, "")) || 0;

                        if (hAmt === 0 && hUnits > 0) {
                            const ocrFixed = parseFloat(String(d.summary?.fixed || "135").replace(/[^\d\.]/g, "")) || 135;
                            const ocrEnergy = d.slabs && d.slabs.length > 0 ? (parseFloat(String(d.slabs[0].rate).replace(/[^\d\.]/g, "")) || 2.10) : 2.10;
                            const ocrWheeling = parseFloat(String(d.summary?.wheeling || "0").replace(/[^\d\.]/g, "")) || 0;
                            const ocrFac = parseFloat(String(d.summary?.fac || "0").replace(/[^\d\.]/g, "")) || 0;
                            
                            const energyTotal = hUnits * ocrEnergy;
                            const subtotal = energyTotal + ocrFixed + ocrWheeling + ocrFac;
                            hAmt = Math.round(subtotal * 1.16);
                        }

                        if ((hAmt > 0 || hUnits > 0) && h.date) {
                            const histBill = new Bill({
                                user: req.user.id,
                                company: d.company?.name || "—",
                                consumerName: d.consumer?.name || "—",
                                billDate: h.date,
                                dueDate: "—",
                                units: hUnits,
                                amount: hAmt
                            });
                            await histBill.save();
                        }
                    }
                }

                // Save to Company Profile
                const companyKey = getCompanyKey(d.company?.name);
                if (companyKey !== "none") {
                    const ocrFixed = d.summary?.fixed || "";
                    const ocrFac = d.summary?.fac || "";
                    const ocrDuty = d.summary?.duty || "";
                    const ocrWheeling = d.summary?.wheeling || "";
                    let ocrEnergy = "";
                    if (d.slabs && d.slabs.length > 0) {
                        ocrEnergy = d.slabs[0].rate || "";
                    }

                    const updateFields = {};
                    if (ocrFixed && ocrFixed !== "—") updateFields.fixedCharge = ocrFixed;
                    if (ocrEnergy && ocrEnergy !== "—") updateFields.energyRate = ocrEnergy;
                    if (ocrFac && ocrFac !== "—") updateFields.fac = ocrFac;
                    if (ocrWheeling && ocrWheeling !== "—") updateFields.wheeling = ocrWheeling;
                    if (ocrDuty && ocrDuty !== "—") updateFields.duty = ocrDuty;
                    
                    const cleanNames = {
                        msedcl: "MSEDCL (Mahavitaran)",
                        tata: "Tata Power",
                        adani: "Adani Electricity",
                        torrent: "Torrent Power",
                        best: "BEST"
                    };
                    updateFields.companyName = cleanNames[companyKey] || d.company?.name || companyKey;
                    updateFields.updatedAt = new Date();

                    if (Object.keys(updateFields).length > 2) {
                        await CompanyProfile.findOneAndUpdate(
                            { companyKey },
                            { $set: updateFields },
                            { upsert: true, new: true }
                        );
                    }
                }
            }
        } catch (dbErr) {
            console.warn("MongoDB operation warning (non-fatal):", dbErr.message);
        }

        return res.json(d);
    } catch (err) {
        console.error("OCR proxy error:", err.message);
        return res.status(500).json({ error: "OCR extraction failed", detail: err.message });
    }
});

module.exports = router;
