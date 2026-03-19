import mongoose from "mongoose";
export const connectDB = async (cb?: () => void) => {
  try {
    const url = process.env.MONGODB_URL;

    if (!url) {
      throw new Error("MONGODB_URL is not defined in .env");
    }
    await mongoose.connect(url);
    console.log("mongodb database connected");
    if (cb) {
      cb();
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1); // stop server if DB fails
  }
};
