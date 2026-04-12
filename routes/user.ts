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
  getFollowingsPost,
} from "../controller/photos";
import {
  ConfirmFollowRequest,
  FollowUser,
  getFollowers,
  getFollowings,
  GetFollowRequests,
  RemoveFollower,
  RejectFollowRequest,
  UnfollowUser,
} from "../controller/follow";
import { getNotifications } from "../controller/notification";
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
user.get("/bio/:username", verifyToken, getBio);
user.get("/photo", verifyToken, checkValidUser, getPhotos);
user.get("/notifications", verifyToken, checkValidUser, getNotifications);
user.get("/follow/requests", verifyToken, checkValidUser, GetFollowRequests);
user.get("/photo/:username", verifyToken, checkValidUser, getPhotosByUsername);
user.get(
  "/followers/:requestedUserId",
  verifyToken,
  checkValidUser,
  getFollowers,
);
user.get(
  "/followings/:requestedUserId",
  verifyToken,
  checkValidUser,
  getFollowings,
);
// --- get the followings post ------
user.get("/post", verifyToken, checkValidUser, getFollowingsPost);
user.get("/get", verifyToken, checkValidUser, getFollowingsPost);
// ____________ PUT ______________
user.put("/bio", verifyToken, updateBio);
user.put("/password", verifyToken, checkValidUser, updatePassword);
user.put("/like", verifyToken, checkValidUser, likePost);
user.put("/dislike", verifyToken, checkValidUser, disLike);
user.post("/follow/:username", verifyToken, checkValidUser, FollowUser);
user.delete("/follow/:username", verifyToken, checkValidUser, UnfollowUser);
user.delete("/followers/:userId", verifyToken, checkValidUser, RemoveFollower);
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
