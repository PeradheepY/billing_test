import mongoose from "mongoose";

let isConnected = false;

export default async function dbconnect() {
   if (isConnected) {
      return;
   }

   try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 40000,
        maxPoolSize: 10,
      });
      isConnected = true;
      console.log("MongoDB connected successfully");
   } catch (error) {
      console.error("MongoDB connection error:", error);
      throw new Error("Database connection failed");
   }
}
  
