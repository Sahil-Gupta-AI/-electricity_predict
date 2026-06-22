const express = require("express");
const router = express.Router();
const multer = require("multer");
const FormData = require("form-data");
const axios = require("axios");

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const allowed = ["application/pdf", "image/jpeg", "image/png", "image/jpg"];
        cb(null, allowed.includes(file.mimetype));
    },
});

router.post("/extract", upload.single("file"), async (req, res) => {
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

        return res.json(flaskRes.data);
    } catch (err) {
        console.error("OCR proxy error:", err.message);
        return res.status(500).json({ error: "OCR extraction failed", detail: err.message });
    }
});

module.exports = router;
