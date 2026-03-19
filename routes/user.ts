import express from "express";
import {
  login,
  signup,
  VerifyAccount,
  sendVerificationMail,
} from "../controller/user";
const user = express.Router();
user.post("/login", login);
user.post("/signup", signup);
user.post("/verify", VerifyAccount);
user.post("/sendToken", sendVerificationMail);
export { user };
