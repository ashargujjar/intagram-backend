import express from "express";
import {
  login,
  sendVerificationMail,
  signup,
  updatePassword,
  uploadProfile,
  VerifyAccount,
} from "../controller/user";
import { verifyToken } from "../middleware/verifyToken";
import { deleteProfile, getBio, updateBio } from "../controller/profile";
import { uploadSingle } from "../middleware/multerConfig";
const user = express.Router();
user.post("/login", login);
user.post("/signup", signup);
user.post("/verify", VerifyAccount);
user.post("/sendToken", sendVerificationMail);
user.post("/profile/photo", verifyToken, uploadSingle, uploadProfile);
user.get("/bio", verifyToken, getBio);
user.put("/bio", verifyToken, updateBio);
user.put("/password", verifyToken, updatePassword);
user.delete("/profilePhoto", verifyToken, deleteProfile);
export { user };
