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

router.post("/predict", async (req, res) => {

    try {

        const { month, unit, amount } = req.body;

        console.log(req.body);

        const response = await axios.post(
            "http://127.0.0.1:5001/predict",
            {
                month,
                unit,
                amount
            }
        );
        console.log("Flask replied:", response.data);
        console.log("Returning response to React");
        res.status(200).json(response.data);

    } catch (error) {

        console.log(error);

        res.status(500).json({
            message: "Prediction failed"
        });

    }

});

module.exports = router;