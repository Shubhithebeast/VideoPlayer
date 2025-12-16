import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

const uploadOnCloudinary = async (localFilePath) => {
    try{
        // Configure Cloudinary (reads env vars at runtime, not import time)
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET 
        });

        if(!localFilePath){
            throw new Error("File path is required");
        }
        const uploadResult = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        });

        // console.log("File Uploaded successfully:", uploadResult.url);
        fs.unlinkSync(localFilePath); // Delete the local file after upload
        return uploadResult;
    }catch(error){
        fs.unlinkSync(localFilePath); // Delete the local file
        console.log("Error uploading file to Cloudinary:", error);
        throw error;
    }
};

export {uploadOnCloudinary};