import {v2 as cloudinary} from "cloudinary";
import fs from "fs";

// Configure Cloudinary once at module level
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

// // Debug: Log to verify env vars are loaded (remove after testing)
// console.log("Cloudinary Config:", {
//     cloud_name: process.env.CLOUDINARY_NAME,
//     api_key: process.env.CLOUDINARY_API_KEY ? "***" + process.env.CLOUDINARY_API_KEY.slice(-4) : "NOT SET",
//     api_secret: process.env.CLOUDINARY_API_SECRET ? "***SET***" : "NOT SET"
// });

const uploadOnCloudinary = async (localFilePath) => {
    try{

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

const deleteFromCloudinary = async (publicId, type) => {
    try {

        if(!publicId){
            throw new Error("Public ID is required..");
        }

        const deleteResult = await cloudinary.uploader.destroy(publicId, {resource_type: type || "image"});
        return deleteResult;

        
    } catch (error) {
        console.log("Cloudinary delete error details:", error);
        throw error;
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