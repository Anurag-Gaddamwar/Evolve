// D:\PROJECTS\BACKEND\evolve\src\dbConfig\dbConfig.ts

import mongoose from 'mongoose';

export async function connect() {
    try {
        // read the connection string from env; common names are MONGODB_URI or MONGO_URL
        const mongoURL = process.env.MONGODB_URI || process.env.MONGO_URL;
        if (!mongoURL) {
            throw new Error('MongoDB connection string is missing. Set MONGODB_URI or MONGO_URL in .env');
        }

        // make sure it starts with the correct scheme
        if (!mongoURL.startsWith('mongodb://') && !mongoURL.startsWith('mongodb+srv://')) {
            throw new Error('Invalid MongoDB URI. It must start with "mongodb://" or "mongodb+srv://"');
        }

        await mongoose.connect(mongoURL);
        const connection = mongoose.connection;

        connection.on('connected', () => {
            console.log('MongoDB connected successfully');
        });

        connection.on('error', (err) => {
            console.log('MongoDB connection error. Please make sure MongoDB is running. ' + err);
            process.exit(1);
        });

    } catch (error) {
        console.error('MongoDB connection failed:', error);
        process.exit(1);
    }
}
