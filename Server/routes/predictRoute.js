// const express = require("express");
// const router = express.Router();
// // const Prediction = require("../models/predict_schema");

// // routes.post("/predict", async (req, res) =>{
// //   const {month, units, amount} = req.body;

// //   const response = await axios.post("http://localhost:5000/predict",{
// //     month,
// //     units,
// //     amount
// //   });

// // const data = response.data;

// //   await Prediction.create({
// //     month,
// //     amount,
// //     unit,

// //     ensemble:data.ensemble,

// //     prediction:data.prediction
// //   });

// //   res.json(data);

// // });

// router.post("/predict", async (req, res) => {
//     console.log(req.body);


//     res.status(200).json({
//         amount:req.body.amount,
//         unit:req.body.unit,
//         predictUnit: 1234,
//         predictAmount: 1234
//     })
// });

// module.exports = router;


const express = require("express");
const router = express.Router();
const axios = require("axios");
const Prediction = require("../models/Prediction");
const CompanyProfile = require("../models/CompanyProfile");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET || "ElectricityAnalyser";

// Optional authentication middleware for guest predictions
const authOptional = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Contains id and email
        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

router.post("/predict", authOptional, async (req, res) => {
    try {
        console.log("Forwarding to Flask:", req.body);

        const response = await axios.post(
            "http://127.0.0.1:5001/predict",
            req.body
        );
        console.log("Flask replied");
        console.log(response.data);

        // Save prediction to database if user is logged in
        if (req.user && req.user.id) {
            const prediction = new Prediction({
                user: req.user.id,
                prediction_type: req.body.prediction_type || "history",
                month: req.body.month,
                inputUnit: parseFloat(req.body.unit) || 0,
                inputAmount: parseFloat(req.body.amount) || 0,
                predictUnit: parseFloat(response.data.predictUnit) || 0,
                predictAmount: parseFloat(response.data.predictAmount) || 0,
                fixedCharge: req.body.fixedCharge || "",
                energyRate: req.body.energyRate || "",
                fac: req.body.fac || "",
                duty: req.body.duty || ""
            });

            await prediction.save();
            console.log(`Saved prediction in MongoDB for user: ${req.user.email || req.user.id}`);
        } else {
            console.log("Guest prediction processed successfully");
        }

        res.status(200).json(response.data);
        console.log("Node reached");
        console.log(req.body);

    } catch (error) {
        console.log(error);
        res.status(500).json({
            message: "Prediction failed"
        });
    }
});

// GET /api/companies/tariff
router.get("/companies/tariff", async (req, res) => {
    try {
        const profiles = await CompanyProfile.find({});
        const tariffMap = {};
        profiles.forEach(p => {
            tariffMap[p.companyKey] = {
                name: p.companyName,
                fixedCharge: p.fixedCharge,
                energyRate: p.energyRate,
                fac: p.fac,
                duty: p.duty
            };
        });
        res.status(200).json(tariffMap);
    } catch (error) {
        console.error("Failed to fetch company tariffs:", error);
        res.status(500).json({ message: "Failed to fetch company tariffs" });
    }
});

module.exports = router;