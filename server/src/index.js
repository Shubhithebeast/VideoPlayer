import connectDB from './database/db.js';
import {app} from './app.js';

import dotenv from 'dotenv';
dotenv.config({
    path: './.env'
});
 
connectDB().then(() => {
    app.on("error", (error) => {
        console.log('Error in server😥:', error);
        throw error;
    });
    app.listen(process.env.PORT || 8000 , () => {
        console.log(`Server is running on port ${process.env.PORT}🚀...`);
    });
    
}).catch((error) => {
    console.log('Failed to connect to the database:', error);
    process.exit(1);
});   

/*
import express from 'express';
const app = express();

// IIFE to connect to MongoDB
(async () => {
    try{
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log('Connected to MongoDB successfully😊...');
        app.on("error", (error) => {
            console.log('Error in server😥:', error);
            throw error;
        });

        app.listen(process.env.PORT, () => {
            console.log(`Server is running on port ${process.env.PORT}🚀...`);
        });
    }catch(error){
        console.log('Error connecting to MongoDB😥:', error);
        throw error;
    }
})()

*/



