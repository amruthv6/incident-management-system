import mongoose from "mongoose";
import { logger } from "./logger";

let isConnected = false;
export let connectionError: Error | null = null;

export async function connectMongoDB(): Promise<void> {
  if (isConnected) return;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    const err = new Error(
      "MONGODB_URI environment variable is not set. Please provide your MongoDB connection string."
    );
    connectionError = err;
    throw err;
  }

  await mongoose.connect(uri);
  isConnected = true;
  connectionError = null;
  logger.info("Connected to MongoDB");
}

export function isMongoConnected(): boolean {
  return isConnected;
}
