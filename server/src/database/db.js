import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';
import logger from '../utils/logger.js';

const connectDB = async()=>{
    try{
        const DB_URL = process.env.MONGODB_URL;
        logger.debug("MongoDB URL:", DB_URL);
        const connection = await mongoose.connect(`${DB_URL}/${DB_NAME}`);
        logger.info(`Connected to MongoDB successfully at ${connection.connection.host}`);
    
    }catch (error){
        logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}


export default connectDB;
