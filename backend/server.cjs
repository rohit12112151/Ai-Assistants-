const express=require('express');
const cors=require('cors');
const bodyParser=require('body-parser');
const mongoose = require('mongoose');
const bcrypt=require('bcrypt');
const crypto=require('crypto');
// const Userschema =require('./schema/Userschema');
const validator = require('validator');
const jwt=require('jsonwebtoken');
const app=express();
app.use(cors());
app.use(bodyParser.json());
const sendEmail=require('./controller/email.js');


const OpenAI = require('openai');

// const config = new OpenAI.Configuration({
//   apiKey: "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"
// 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
// });

const myopenai = new OpenAI({
    apiKey: "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"
});


const mytext="Rohit//#$@";
const saltround=10;

const createToken=(id)=>{
    return jwt.sign({id},"thisissecretkey");
}

const userSchema=new mongoose.Schema({
    user_name:String,
    email:String,
    password:String,
    resetPasswordToken:String,
    resetPasswordTokenExpiresIn:Date
});
mongoose.connect("mongodb://127.0.0.1:27017/my-content");
const userModel=mongoose.model('user',userSchema);
const st_pass={minLength: 8, minLowercase: 1, minUppercase: 1, minNumbers: 1, minSymbols: 1}



app.post('/register',async(req,res)=>{
    const user=req.body;
    const data=new userModel(user);
    const founduser=await userModel.find({email:data.email});
    if(founduser)return res.json({type:"user exist"});
    
    if(!req.body.email)return res.json({type:"noEmail"});
    else if(!validator.isEmail(user.email))return res.json({type:"email"});
    else if(!validator.isStrongPassword(user.password,st_pass))return res.json({type:"strongPassword",strong_pass:st_pass});
     
    
    bcrypt.genSalt(saltround)
         .then((resp)=>{bcrypt.hash(req.body.password,resp)
            .then((resp)=>{data.password=resp,data.save()
                .then(console.log("stored")).catch((err)=>{console.log("error")})})});
    
    
     
    res.json(user);
    // console.log(user);
})

app.use('/login',async(req,res)=>{
    const user=req.body;
    const data=new userModel(user);
    const founduser= await userModel.findOne({email:data.email});
    // console.log(founduser);
    if(!founduser)return res.json({message:"user not found"});
    //console.log(user.password);
    //console.log(founduser.password);
    const isMatch=await bcrypt.compare(user.password,founduser.password);
    // console.log(isMatch);
    if(!isMatch)return res.json({message:"enter correct password"});
    
    // if(founduser)return res.json(founduser);
    const token=createToken(founduser._id);
    // console.log(token);
    return res.json({founduser,token});

});

app.post("/forgetpassword",async(req,res,next)=>{
    const user=new userModel(req.body);
    const founduser=await userModel.find({email:user.email});
    if(!founduser)res.json({message:"user not found"});

    //using crypto we can make less strong hash;and we also get a randomByte function;
    const resetToken=crypto.randomBytes(32).toString('hex');
                                             //algo used in hashing
    const resetPassToken=crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetPasswordTokenExpiresIn=Date.now()+10*60*1000;
    user.resetPasswordToken=resetPassToken;
    user.resetPasswordTokenExpiresIn=resetPasswordTokenExpiresIn;
    user.save();
    sendEmail();





    // console.log(resetToken,resetPassToken);
})






app.post("/routes2",async(req,res)=>{
    console.log(req.body.topic);




    const basePromptPrefix =
`Write me a detailed table of contents for a blog post with the title below.
Title:`
    
const baseCompletion = await myopenai.completions.create({
    model: 'gpt-3.5-turbo-instruct',
    // response_format:{ type: "json_object" },
    prompt: "This story begins",
    temperature: 0.8,
    max_tokens: 250,
  });
    //   console.log(chatCompletion.choices[0].message);
    const basePromptOutput = baseCompletion.choices[0].text;

    const secondPrompt = 
  `
  Take the table of contents and title of the blog post below and generate a blog post written in thwe style of Paul Graham. Make it feel like a story. Don't just list the points. Go deep into each one. Explain why.

  Title:travel

  Table of Contents: ${basePromptOutput.text}

  Blog Post:
  `

  const secondPromptCompletion = await myopenai.completions.create({
    model: 'gpt-3.5-turbo-instruct',
    prompt: `${secondPrompt}`,
    // I set a higher temperature for this one. Up to you!
    temperature: 0.85,
		// I also increase max_tokens.
    max_tokens: 1250,
  });

  const secondPromptOutput = secondPromptCompletion.choices[0].text;

  console.log(secondPromptOutput);




    return res.json({message:secondPromptOutput})



})






app.listen(5000,()=>{console.log("connected")});