const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const predictRoute = require("./routes/predictRoute");

dotenv.config();

connectDB();

const app = express();

app.use(cors());
app.use(express.json());


// Routes
app.use("/api/auth", authRoutes);
app.use("/api", predictRoute);

app.get("/", (req, res) => {
  res.send("API Running...");
  console.log("Server is run on / port")
});

const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});