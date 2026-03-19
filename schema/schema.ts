import mongoose, { mongo } from "mongoose";
const userschema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
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
  verified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});
const forgotPasswordSchema = new mongoose.Schema({
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 260,
  },
});
const otpSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 5 * 60 * 1000), //  5 min default
    index: { expires: 0 }, // TTL
  },
});
export const Otp = mongoose.model("Otp", otpSchema);
export const User = mongoose.model("User", userschema);
export const ForgotPassword = mongoose.model(
  "ForgotPassword",
  forgotPasswordSchema,
);
