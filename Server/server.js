const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
dotenv.config();

connectDB();

const app = express();
app.use(cors());

app.use(express.json());


// Routes
app.use("/api/auth", authRoutes);


app.get("/", (req, res) => {
  res.send("API Running...");
  console.log("Server is run on / port")
});
app.get("/test", (req, res) => {
  console.log("Test route accessed");
  res.json({ message: "Server is working" });
});
const PORT = process.env.PORT;

app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});