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

        // Save to database
        const d = flaskRes.data;
        const unitsRaw = d.usage?.currUnits || "0";
        const amountRaw = d.usage?.currAmount || "0";
        const units = parseFloat(unitsRaw.replace(/[^\d\.]/g, "")) || 0;
        const amount = parseFloat(amountRaw.replace(/[^\d\.]/g, "")) || 0;

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

        // Save payment history as separate bills to update the dashboard graphs
        if (d.history && Array.isArray(d.history)) {
            for (const h of d.history) {
                const hAmt = parseFloat(h.amount.replace(/[^\d\.]/g, "")) || 0;
                if (hAmt > 0 && h.date) {
                    const existing = await Bill.findOne({ user: req.user.id, billDate: h.date });
                    if (!existing) {
                        let estUnits = 0;
                        const companyKey = getCompanyKey(d.company?.name);
                        const ocrFixed = d.summary?.fixed || "130";
                        const ocrEnergy = d.slabs && d.slabs.length > 0 ? d.slabs[0].rate : "4.28";
                        
                        const fixedVal = parseFloat(String(ocrFixed).replace(/[^\d\.]/g, "")) || 130;
                        const rateVal = parseFloat(String(ocrEnergy).replace(/[^\d\.]/g, "")) || 4.28;
                        
                        const subtotal = hAmt / 1.16;
                        const energyCharges = subtotal - fixedVal;
                        if (energyCharges > 0) {
                            let wheeling = 0.0;
                            if (rateVal === 4.28 || rateVal === 11.10) wheeling = 1.47;
                            else if (rateVal === 3.96 || rateVal === 10.80) wheeling = 1.60;
                            else if (rateVal === 4.43 || rateVal === 9.64) wheeling = 2.76;
                            else if (rateVal === 2.65 || rateVal === 5.85) wheeling = 2.28;
                            else if (rateVal === 2.10 || rateVal === 5.50) wheeling = 1.87;
                            
                            estUnits = Math.max(0, Math.round(energyCharges / (rateVal + wheeling)));
                        }
                        
                        const histBill = new Bill({
                            user: req.user.id,
                            company: d.company?.name || "—",
                            consumerName: d.consumer?.name || "—",
                            billDate: h.date,
                            dueDate: "—",
                            units: estUnits,
                            amount: hAmt
                        });
                        await histBill.save();
                        console.log(`Saved history bill in MongoDB: date=${h.date}, amount=${hAmt}, units=${estUnits}`);
                    }
                }
            }
        }

        // Save to Company Profile
        const companyKey = getCompanyKey(d.company?.name);
        if (companyKey !== "none") {
            const ocrFixed = d.summary?.fixed || "";
            const ocrFac = d.summary?.fac || "";
            const ocrDuty = d.summary?.duty || "";
            let ocrEnergy = "";
            if (d.slabs && d.slabs.length > 0) {
                ocrEnergy = d.slabs[0].rate || "";
            }

            const updateFields = {};
            if (ocrFixed && ocrFixed !== "—") updateFields.fixedCharge = ocrFixed;
            if (ocrEnergy && ocrEnergy !== "—") updateFields.energyRate = ocrEnergy;
            if (ocrFac && ocrFac !== "—") updateFields.fac = ocrFac;
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
                console.log(`Updated shared Company Profile tariff for key: ${companyKey}`);
            }
        }

        return res.json(d);
    } catch (err) {
        console.error("OCR proxy error:", err.message);
        return res.status(500).json({ error: "OCR extraction failed", detail: err.message });
    }
});

module.exports = router;
