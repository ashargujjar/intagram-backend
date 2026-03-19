import express from "express";
import {
  login,
  signup,
  VerifyAccount,
  sendVerificationMail,
  sendOTP,
  verifyOtp,
  resetPassword,
} from "../controller/user";
const user = express.Router();
user.post("/login", login);
user.post("/signup", signup);
user.post("/verify", VerifyAccount);
user.post("/sendToken", sendVerificationMail);
user.post("/send-otp", sendOTP);
user.post("/verify-otp", verifyOtp);
user.post("/reset-password", resetPassword);
export { user };
