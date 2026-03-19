import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { user } from "./routes/user";
import { connectDB } from "./database/mongodb";
import cors from "cors";
const app = express();
app.use(cors({ origin: process.env.FRONT_END_URL, credentials: true }));

app.use(express.json());

app.use(user);
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  connectDB(() => {
    console.log(`server is running on port ${PORT}`);
  });
});
