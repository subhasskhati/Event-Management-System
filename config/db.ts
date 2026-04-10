import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// function to connect to database
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/eventdb');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        // don't exit process in this environment
    }
};

export default connectDB;
