import { User } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { asyncHandler } from "../utils/asyncHandler"
import { jwt } from 'jsonwebtoken';

export const verifyJWT = asyncHandler(async (req, _ , next) => {

    try {
        const token = req.cookies?.accessToken  || req.header("Authorization")?.replace("Bearer ","");
    
        if(!token){
            throw new ApiError(401, "Unauthorized access, token missing");
        }
    
        const decoded = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    
        if(!decoded || !decoded._id){
            throw new ApiError(401, "Unauthorized access, invalid token");
        }
    
        const user = await User.findById(decoded?._id).select("-password -refreshToken");
    
        if(!user){
            throw new ApiError(401, "Unauthorized access, user not found");
        }
    
        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized access, invalid token");
    }


})