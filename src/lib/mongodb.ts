
// src/lib/mongodb.ts
import mongoose from 'mongoose';

// global is used here to maintain a cached connection across hot reloads
// in development. This prevents connections from growing exponentially
// during API Route usage.
let cached = (global as any).mongoose;

if (!cached) {
  cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    console.error('MongoDB URI not found. Please define MONGODB_URI in your .env.local file.');
    // This error will be caught by the API route's try/catch
    throw new Error('Server configuration error: MONGODB_URI is not defined.');
  }

  if (cached.conn) {
    // console.log("Using cached MongoDB connection.");
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable mongoose buffering if connection is slow to fail fast
      // serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    };
    console.log("Attempting new MongoDB connection...");
    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log("MongoDB connection promise resolved successfully.");
      return mongooseInstance;
    }).catch(err => {
      console.error("Initial MongoDB connection failed:", err.message);
      cached.promise = null; // Clear promise on initial failure to allow retry
      throw err; // Re-throw to be caught by the awaiter in the API route
    });
  }

  try {
    // console.log("Awaiting MongoDB connection promise...");
    cached.conn = await cached.promise;
    console.log("MongoDB Connected via awaited promise.");
    return cached.conn;
  } catch (e: any) {
    console.error("Failed to establish MongoDB connection from cached promise:", e.message);
    // Important: Nullify cached.promise if the connection attempt from the promise fails,
    // so that the next call to dbConnect attempts to re-establish the connection.
    cached.promise = null;
    throw e; // Re-throw to be caught by the API route's error handler
  }
}

export default dbConnect;
