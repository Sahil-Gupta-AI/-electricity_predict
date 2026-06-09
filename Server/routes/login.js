const  express = require("express");
const { preinitModule } = require("react-dom");
const routes = express.Router();
const jwt = require('jsonwebtoken');
const User = require("../models/User");

routes.post("/login",async (req , res) =>{
    try{
      const {email , password} = req.body;
      const user =  await User.findOne({email});
      if(!user){
        return res.status(400).json({message: "User not found"});
      }
      const isMatch = await bcrypt.compare(password , user.password);
      if(!isMatch){
        return res.status(400).json({message: "Invalid credentials"});
      }
      const token = jwt.sign({id: user.id , email: user.email}, JWT_SECRET, {expiresIn: '1h'});
      
      res.json({message: "Registration successful!", 
         token });
} catch (error){
        console.error("Login error:", error.message);
}
});


module.exports = router;