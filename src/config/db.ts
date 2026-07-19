import mongoose from "mongoose";
import env from "./env.js";

let connectionPromise: Promise<typeof mongoose> | undefined;

const connectDB = async (): Promise<void> => {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  try {
    connectionPromise ??= mongoose.connect(env.mongoUri);
    const conn = await connectionPromise;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch {
    connectionPromise = undefined;
    throw new Error(
      "Database connection failed. Verify that MongoDB is running and MONGO_URI is valid.",
    );
  }
};

export default connectDB;
