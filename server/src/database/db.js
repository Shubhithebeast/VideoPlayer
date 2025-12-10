import mongoose from 'mongoose';
import { DB_NAME } from '../constants.js';

const connectDB = async()=>{
    try{
        const connection = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n Connected to MongoDB successfully😊... ${connection.connection.host}`);
    
    }catch (error){
        console.log('Error connecting to MongoDB😥:', error);
        process.exit(1);
    }
}


export default connectDB;
