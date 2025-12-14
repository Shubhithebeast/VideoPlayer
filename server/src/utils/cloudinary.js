import {v2 as cloudinary} from "cloudinary";
import fs from "fs";


 // Configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });


const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath){
            throw new Error("File path is required");
        }
        const uploadResult = await cloudinary.uploader.upload(localFilePath,{
            resource_type: "auto"
        });

        console.log("File Uploaded successfully:", uploadResult.url);
        return uploadResult;
    }catch(error){
        fs.unlinkSync(localFilePath); // Delete the local file
        console.log("Error uploading file to Cloudinary:", error);
        throw error;
    }
};

export {uploadOnCloudinary};