require('dotenv').config();
const MongoDB=require('./../MongoDB/MongoDB');
const jwt = require('jsonwebtoken');
const passwordHash=require('password-hash');


exports.login=async (email, password)=>{
    try{
        const mongodb = new MongoDB();
        var user=await mongodb.getUserByEmail(email);
        if(user==null){
            return {response:false,error:'User does not Exist'};
        }

        const verification=passwordHash.verify(password,user.password);
        if(verification==false){
            return {response:false,error:'Incorrect Password'};
        }else{
            let accessToken=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'24h'});
            return {email:email, accessToken:accessToken};
        }
        
    }catch(err){
        console.log(err)
    }
};

exports.signup=async (name, email, password, role)=>{
    try{
        const mongodb = new MongoDB();
        const user={
            name:name,
            email:email,
            password:passwordHash.generate(password),
        };

        if(role)
            user.postedQuestions=[]
        else
            user.solvedQuestions=[]
        
        let res=await mongodb.insertOneUserData(user);
        if(!res.response)
            return res;
        
        let accessToken=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET,{expiresIn:'24h'});
        return {email:email,accessToken:accessToken};
        
    }catch(err){
        console.log(err);
    }
};

exports.authenticate=(request, response, next) => {
    const authJWTToken=request.headers.authorizationtoken;
    console.log(request.headers)
    if(authJWTToken==null)
        return response.sendStatus(401);
    
    jwt.verify(authJWTToken,process.env.ACCESS_TOKEN_SECRET,(err,username)=>{
        if(err)
            return response.sendStatus(403);

        request.body.email=username.email;
        next();
    })
};