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
import {
  deleteIntroAudio,
  deleteProfile,
  getBio,
  updateBio,
  uploadIntroAudio,
} from "../controller/profile";
import {
  uploadMultiple,
  uploadSingle,
  uploadSingleAudio,
} from "../middleware/multerConfig";
import { checkValidUser } from "../util/functions";
import { getPhotos, uploadPhoto } from "../controller/photos";
import { verify } from "node:crypto";
const user = express.Router();
user.post("/login", login);
user.post("/signup", signup);
user.post("/verify", VerifyAccount);
user.post("/sendToken", sendVerificationMail);
user.post(
  "/profile/photo",
  verifyToken,
  checkValidUser,
  uploadSingle,
  uploadProfile,
);
user.post(
  "/profile/intro-audio",
  verifyToken,
  checkValidUser,
  uploadSingleAudio,
  uploadIntroAudio,
);
user.post("/photo", verifyToken, checkValidUser, uploadMultiple, uploadPhoto);
user.get("/bio", verifyToken, getBio);
user.get("/photo", verifyToken, checkValidUser, getPhotos);
user.put("/bio", verifyToken, updateBio);
user.put("/password", verifyToken, checkValidUser, updatePassword);
user.delete("/profilePhoto", verifyToken, deleteProfile);
user.delete("/profile/intro-audio", verifyToken, deleteIntroAudio);
export { user };
