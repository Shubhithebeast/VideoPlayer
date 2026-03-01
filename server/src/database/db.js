import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';
import logger from '../utils/logger.js';

const resolveMongoUri = () => {
    const configuredUri = process.env.MONGO_URI || process.env.MONGODB_URL;

    if (!configuredUri) {
        throw new Error("Missing Mongo connection string (MONGO_URI or MONGODB_URL)");
    }

    const parsed = new URL(configuredUri);

    // If no explicit DB in URI, append configured DB name safely.
    if (!parsed.pathname || parsed.pathname === "/") {
        parsed.pathname = `/${DB_NAME}`;
    }

    return parsed.toString();
};

const connectDB = async()=>{
    try{
        const mongoUri = resolveMongoUri();
        const connection = await mongoose.connect(mongoUri);
        logger.info(`Connected to MongoDB successfully at ${connection.connection.host}/${connection.connection.name}`);
    
    }catch (error){
        logger.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
}


export default connectDB;
