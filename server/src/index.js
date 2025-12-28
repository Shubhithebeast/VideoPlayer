import dotenv from 'dotenv';
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


dotenv.config({
    path: path.join(__dirname, "../.env")
});

// dotenv.config({
//     path: './.env'
// });

import connectDB from './database/db.js';
import {app} from './app.js';
import logger from './utils/logger.js';
 
connectDB().then(() => {
    app.on("error", (error) => {
        logger.error('Error in server:', error);
        throw error;
    });
    app.listen(process.env.PORT || 8000 , () => {
        logger.info(`🚀 Server is running at http://localhost:${process.env.PORT}/api/v1/healthcheck/liveness`);
    });
    
}).catch((error) => {
    logger.error('Failed to connect to the database:', error);
    process.exit(1);
});   

/*
import express from 'express';
const app = express();

// IIFE to connect to MongoDB
(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        logger.info('Connected to MongoDB successfully');
        app.on("error", (error) => {
            logger.error('Error in server:', error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            logger.info(`Server is running on port ${process.env.PORT}`);
        });
    }catch(error){
        logger.error('Error connecting to MongoDB:', error);
        throw error;
    }
})()

*/



