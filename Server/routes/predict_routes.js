const express = require("express");
const routes = reouter.Router();
const Prediction = require("../models/predict_schema");

routes.post("/predict", async (req, res) =>{
  const {month, units, amount} = req.body;

  const response = await axios.post("http://localhost:5000/predict",{
    month,
    units,
    amount
  });

const data = response.data;

  await Prediction.create({
    month,
    amount,
    unit,

    ensemble:data.ensemble,

    prediction:data.prediction
  });

  res.json(data);

});