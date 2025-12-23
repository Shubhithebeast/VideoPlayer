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

const deleteFromCloudinary = async (publicId) => {
    try {

        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET 
        });

        if(!publicId){
            throw new Error("Public ID is required..");
        }

        const deleteResult = await cloudinary.uploader.destroy(publicId, {resource_type: "auto"});
        return deleteResult;

        
    } catch (error) {
        throw new Error("Error deleting file from Cloudinary:", error);
    }

}

const extractPublicIdFromUrl = (url) => {
    try {
        
        if(!url){
            throw new Error("URL is required to extract public ID.");
        }

        // Extract the public_id from Cloudinary URL
        // URL format: https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<public_id>.<format>
        const urlParts = url.split('/');
        const fileNameWithExtension = urlParts[urlParts.length - 1];
        const publicId = fileNameWithExtension.substring(0, fileNameWithExtension.lastIndexOf('.'));

        return publicId;

    } catch (error) {
        throw new Error("Error extracting public ID from URL:", error);
    }


}

export {uploadOnCloudinary, deleteFromCloudinary, extractPublicIdFromUrl};