import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";
import { jwt } from 'jsonwebtoken';

const generateAccessAndRefreshTokens = async(userid) => {
    try{
        const user = await User.findById(userid);
        if(!user){
            throw new ApiError(404, "User not found");
        }
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        // save refresh token in db
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});

        return {accessToken, refreshToken};

    }catch(error){
        throw new ApiError(500, "Failed to generate Access and Refresh Tokens: " + error.message);
    }
}

const getCurrentUser = asyncHandler(async (req, res, next) => {
    return res
    .status(200)
    .json(new apiResponse(200, "Current user fetched successfully", req.user));

});


const registerUser = asyncHandler(async (req, res, next) => {

    // get user data from frontend
    const { username, email, fullname, password } = req.body;
    // console.log(" Request body: ", req.body);


    // validate user data
    if([fullname, username, email, password].some((field) => field?.trim() === "")){
        throw new ApiError(400, "All fields are required");
    }

    if(username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)){
        throw new ApiError(400, "Invalid username. It should be 3-30 characters long and can only contain letters, numbers, and underscores.");
    }

    if(email && !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)){
        throw new ApiError(400, "Invalid email address");
    }

    if(password && (password.length < 6 || password.length > 50)){
        throw new ApiError(400, "Password must be between 6 and 50 characters long");
    }


    // check if user already exists
    User.findOne({ $or: [{ email }, { username }] }).then((existingUser) => {
        if (existingUser) {
            throw new ApiError(409, "User with this email or username already exists");
        }
    });


    // check for images, check for avatar
    const avatarLocalPath =  req.files?.avatar[0]?.path;
    // const coverImageLocalPath =  req.files?.coverImage[0]?.path;

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }


    // upload images to cloudinary, avatar is mandatory
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(500, "Failed to upload avatar image");
    }

    // create user in db
    const user = await User.create({
        username: username.toLowerCase(),
        email,
        fullname,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
    });


    // remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )


    // check for user creation success
    if(!createdUser){
        throw new ApiError(500, "Failed to create user");
    }


    //return response
    return res.status(201).json(
        new apiResponse(200,"User registered successfully", createdUser)
    );
});


const loginUser = asyncHandler(async (req, res, next) => {
    // get login data from request body
    const {email, username, password} = req.body;
    if(!password && !(username || email)){
        throw new ApiError(400, "Email or username is required for login");
    }

    // login through email or username
    // find user in db
    const user =  await User.findOne({ $or: [{email}, {username}] });
    if(!user){
        throw new ApiError(404, "Invalid user credentials");
    }


    // compare password
    const isPasswordValid =  await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(404, "Invalid user credentials");
    }

    
    // access token and refresh token
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");


    // send cookies 
    const cookieOptions = {
        httpOnly: true,
        secure:true,
    };

    // return response
    return res
    .status(200)
    .cookie("accessToken", accessToken, cookieOptions)
    .cookie("refreshToken", refreshToken, cookieOptions)
    .json(new apiResponse(200, "User logged in successfully", {
        user: loggedInUser,
        accessToken,
        refreshToken
    })
    );

});


const logoutUser = asyncHandler(async (req, res, next) => {

    const userId = req.user._id;

    // find user in db
    const user = await User.findByIdAndUpdate(userId,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true,
        }
    );

    if(!user){
        throw new ApiError(404, "User not found");
    }

    const cookieOptions = {
        httpOnly: true,
        secure:true,
    };

    return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new apiResponse(200, "User logged out successfully"));

});


const refreshAccessToken = asyncHandler(async (req, res, next) => {

    try {
        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
    
        if(!incomingRefreshToken){
            throw new ApiError(401, "Refresh token is missing");
        } 
    
        // verify refresh token
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);
    
        if(!decodedToken || !decodedToken._id){
            throw new ApiError(401, "Invalid refresh token");
        }
    
        const user = await User.findById(decodedToken._id);
    
        if(!user || user?.refreshToken !== incomingRefreshToken){
            throw new ApiError(401, "Invalid refresh token");
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        const cookieOptions = {
            httpOnly: true,
            secure:true,
        };
    
        return res
        .status(200)
        .cookie("accessToken", newAccessToken, cookieOptions)
        .cookie("refreshToken", newRefreshToken, cookieOptions)
        .json(new apiResponse(200, "Tokens refreshed successfully", {
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        }));
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");        
    }

});


const changeCurrentUserPassword = asyncHandler(async (req, res, next) => {
    
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    if(!user){
        throw new ApiError(404, "User not found");
    }

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400, "Old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new apiResponse(200, "Password changed successfully", {}));

});


const updateAccountDetails = asyncHandler(async (req, res, next) => {
    
    const {fullname, email} = req.body;

    if(!fullname || !email){
        throw new ApiError(400, "Fullname and email are required");
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                fullname,
                email: email
            }
        },
        {new:true}
    ).select("-password -refreshToken");


    return res
    .status(200)
    .json(new apiResponse(200, "Account details updated successfully", user));
});


const updateUserAvatar = asyncHandler(async (req, res, next) => {

    const avatarLocalPath = req.file?.path;
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar image is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar.url){
        throw new ApiError(500, "Failed to upload avatar image");
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password"); 
    
    return res
    .status(200)
    .json(new apiResponse(200, "User avatar updated successfully", user));       

});

const updateUserCoverImage = asyncHandler(async (req, res, next) => {

    const coverImageLocalPath = req.file?.path;
    if(!coverImageLocalPath){
        throw new ApiError(400, "Cover image is required");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage.url){
        throw new ApiError(500, "Failed to upload cover image");
    }

    const user = await User.findByIdAndUpdate(req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password"); 
    
    return res
    .status(200)
    .json(new apiResponse(200, "User cover image updated successfully", user));       

});


export { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentUserPassword, updateAccountDetails, getCurrentUser, updateUserAvatar, updateUserCoverImage };