import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { user } from "./routes/user";
import { connectDB } from "./database/mongodb";
import cors, { CorsOptions } from "cors";
import path from "node:path";

const app = express();
app.use(express.json());
app.use("/uploads", express.static(path.resolve("uploads")));

app.use(
  cors({
    origin: ["http://localhost:5173", "https://intagram-frontend.vercel.app"],
    credentials: true,
  }),
);

app.use(user);
const PORT = Number(process.env.PORT) || 3000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, () => {
      console.log(`server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server startup failed:", err);
    process.exit(1);
  }
};

startServer();
