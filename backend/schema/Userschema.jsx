const mongoose = require("mongoose");

const Userschema=new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    resetPasswordToken:String,
    resetPasswordTokenExpiresIn:Date
});
module.exports= Userschema;