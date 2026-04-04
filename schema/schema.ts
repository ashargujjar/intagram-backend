import mongoose from "mongoose";
const def = { type: String, required: true };
const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: def,
  password: def,
  intrest: {
    type: [String],
    required: true,
    validate: {
      validator: function (v: string[]) {
        return v.length == 5;
      },
      message: "Interest must contain exactly 5 items",
    },
  },
  verified: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});

const forgotPasswordSchema = new mongoose.Schema({
  otp: def,
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 260,
  },
});

const otpSchema = new mongoose.Schema({
  userId: def,
  otp: def,
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000),
    index: { expires: 300 },
  },
});
const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  name: { type: String, default: "" },
  bio: { type: String, default: "" },
  url: { type: String, default: "" },
  introAudio: { type: String, default: "" },
  profilePhoto: { type: String, default: "" },
  private: { type: Boolean, default: false },
  followers: { type: Number, default: 0 },
  followings: { type: Number, default: 0 },
  posts: { type: Number, default: 0 },
});
const replySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    text: { type: String, trim: true, default: "" },
    audio: { type: String, default: "" },
    replies: { type: [replySchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: true },
);

const postSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    post: { type: [String], default: [] },
    descAudio: { type: String, default: "" },
    caption: { type: String, default: "" },
    likesCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    likedBy: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      default: [],
    },
    comments: { type: [commentSchema], default: [] },
  },
  { timestamps: true },
);
export const Posts = mongoose.model("Post", postSchema);
export const Otp = mongoose.model("Otp", otpSchema);
export const User = mongoose.model("User", userschema);
export const Profile = mongoose.model("Profile", profileSchema);
export const ForgotPassword = mongoose.model(
  "ForgotPassword",
  forgotPasswordSchema,
);
