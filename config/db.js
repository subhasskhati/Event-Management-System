const mongoose = require('mongoose');
const dotenv = require('dotenv');

// load env vars
const result = dotenv.config();
if (result.error) {
    console.warn('Warning: Could not load .env file. This is expected if you are using environment variables directly.');
} else {
    console.log('.env file loaded successfully.');
}

// function to connect to database
const connectDB = async () => {
    try {
        // use common env names for mongo uri
        const mongoURI = process.env.MONGODB_URI || 
                         process.env.MONGO_URI || 
                         process.env.DB_URI || 
                         process.env.MONGODB_URL;
        
        if (!mongoURI) {
            console.warn('Warning: No MongoDB URI found in environment variables (tried MONGODB_URI, MONGO_URI, DB_URI, MONGODB_URL). Falling back to localhost.');
            // log available env keys (excluding sensitive ones)
            const availableKeys = Object.keys(process.env).filter(key => !key.includes('KEY') && !key.includes('SECRET'));
            console.log('Available environment variables:', availableKeys);
        }

        const uri = mongoURI || 'mongodb://localhost:27017/eventdb';
        
        // mask password for logging
        const maskedUri = uri.replace(/\/\/.*:.*@/, '//****:****@');
        console.log(`Attempting to connect to MongoDB: ${maskedUri}`);

        const conn = await mongoose.connect(uri);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error('Error connecting to MongoDB:', error.message);
        // if it's a server selection error, it's likely the URI is wrong or unreachable
        if (error.name === 'MongooseServerSelectionError') {
            console.error('Check if your MongoDB URI is correct and your database is accessible.');
        }
    }
};

module.exports = connectDB;
