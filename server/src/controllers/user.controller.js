import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { apiResponse } from "../utils/apiResponse.js";

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

export { registerUser };