import { User } from "../models/user.model.js";
import { apiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js"
import jwt  from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async (req, _ , next) => {

    try {
        const token = req.cookies?.accessToken  || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new apiError(401, "Unauthorized access, token missing");
        }
    
        const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        if(!decoded || !decoded._id){
            throw new apiError(401, "Unauthorized access, invalid token");
        }
    
        const user = await User.findById(decoded?._id).select("-password -refreshToken");
    
        if(!user){
            throw new apiError(401, "Unauthorized access, user not found");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new apiError(401, "Unauthorized access, invalid token");
    }


})