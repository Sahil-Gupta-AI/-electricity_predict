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
    if (n.includes("tata")) return "tata";
    if (n.includes("adani")) return "adani";
    if (n.includes("torrent")) return "torrent";
    if (n.includes("msedcl") || n.includes("mahavitaran") || n.includes("maharashtra state") || n.includes("महावितरण") || n.includes("महाराष्ट्र राज्य")) return "msedcl";
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
            updateFields.companyName = d.company?.name || companyKey;
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
