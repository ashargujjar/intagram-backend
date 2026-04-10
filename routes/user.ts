import express from "express";
import {
  login,
  SearchUser,
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
  uploadSingle,
  uploadSingleAudio,
  uploadPostMedia,
} from "../middleware/multerConfig";
import { checkValidUser } from "../util/functions";
import {
  disLike,
  deletePost,
  getPhotosByUsername,
  getPhotos,
  likePost,
  uploadPhoto,
} from "../controller/photos";
import {
  ConfirmFollowRequest,
  FollowUser,
  GetFollowRequests,
  RejectFollowRequest,
  UnfollowUser,
} from "../controller/follow";
import { verify } from "node:crypto";
import { deleteCommnet, PostComment } from "../controller/comments";
const user = express.Router();
// --------- POST ---------
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
user.post("/photo", verifyToken, checkValidUser, uploadPostMedia, uploadPhoto);
user.post(
  "/comment",
  verifyToken,
  checkValidUser,
  uploadSingleAudio,
  PostComment,
);
user.post("/user", verifyToken, SearchUser);

// __________ GET ___________
user.get("/bio", verifyToken, getBio);
user.get("/bio/:username",verifyToken,getBio)
user.get("/photo", verifyToken, checkValidUser, getPhotos);
user.get("/photo/:username", verifyToken, checkValidUser, getPhotosByUsername);

// ____________ PUT ______________
user.put("/bio", verifyToken, updateBio);
user.put("/password", verifyToken, checkValidUser, updatePassword);
user.put("/like", verifyToken, checkValidUser, likePost);
user.put("/dislike", verifyToken, checkValidUser, disLike);
user.post("/follow/:username", verifyToken, checkValidUser, FollowUser);
user.delete("/follow/:username", verifyToken, checkValidUser, UnfollowUser);
user.get("/follow/requests", verifyToken, checkValidUser, GetFollowRequests);
user.post(
  "/follow/requests/:userId/confirm",
  verifyToken,
  checkValidUser,
  ConfirmFollowRequest,
);
user.post(
  "/follow/requests/:userId/reject",
  verifyToken,
  checkValidUser,
  RejectFollowRequest,
);

// ____________ delete ____________
user.delete("/profilePhoto", verifyToken, deleteProfile);
user.delete("/profile/intro-audio", verifyToken, deleteIntroAudio);
user.delete("/comment", verifyToken, checkValidUser, deleteCommnet); // delete commment
user.delete("/photo/:postId", verifyToken, checkValidUser, deletePost);
export { user };
