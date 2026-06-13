const preictSchema = new mongoose.Schema({
  month:Number,
  units:Number,
  amount:Number,

  ensemble_model:Number,
  prediction:Number,

  createdAt:{
    type:Date,
    default:Date.now
  }
  
});

const Prediction = mongoose.model("Prediction",PredictionSchema);
module.exports = Prediction