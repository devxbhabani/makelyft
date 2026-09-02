const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const rate_limiter = require('express-rate-limit')

// Pre-defined limits (dynamic by level)
const limits = {
    strict:   { windowMs: 15 * 60 * 1000, max: 500 },   // 15 mins, 500 requests (Auth) {for testing purpoese}
    standard: { windowMs: 1 * 60 * 1000,  max: 20 },  // 1 min, 20 requests (Feedback)
    relaxed:  { windowMs: 10 * 1000,      max: 50 }   // 10 sec, 50 requests (Chat)
};

const API_Limiter = (level = "standard") => {
    const config = limits[level] || limits.standard;
    return rate_limiter({
        windowMs: config.windowMs,
        max: config.max,
        message: {
            success: false,
            status: 429,
            error: `Too many requests, please try again later.`
        }, 
        standardHeaders: true,
        legacyHeaders: false,
    });
};

const FN_verifyTkn = (req, res, next) =>{
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if(!token){
        res.statusCode = 401;
        return next(new Error("Unauthorized User Access! Please login"));
    }

    try{
        const verifyTkn = jwt.verify(token, process.env.JWT_SECRET);
        req.user = verifyTkn; //this adds a new section to the json called user which has jwt contents
        next();
    }catch(err){
        res.statusCode = 403;
        next(new Error("Invalid or Expiered token for session, please re Login..."))
    }
    
};

const FN_verifyAdmin = (req, res, next) => {
    FN_verifyTkn(req, res, (err) => {
        if (err) return next(err);
        if (req.user && req.user.role === 'admin') {
            next();
        } else {
            res.status(403);
            return next(new Error("Forbidden: Administrator access required."));
        }
    });
};


const handle404 = (req, res, next) => {
    res.status(404);
    
    const error = new Error(`NOT FOUND : ${req.originalUrl}`);
    next(error); //sending error to next function
}

const masterErrorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    console.log("Error: ", statusCode);
    res.status(statusCode).json({
        sucess: false,
        status: statusCode,
        error: err.message ||"Internal Server Error"
    });
};

module.exports = {handle404, masterErrorHandler, FN_verifyTkn, FN_verifyAdmin, API_Limiter}