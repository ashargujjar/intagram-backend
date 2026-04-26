import { Request, Response } from "express";
import { ApiResponse, IUser, LpayLoad, LUser } from "../types/Types";
import { UserClass } from "../model/User";
import { Otp, User } from "../schema/schema";
import bcrypt from "bcrypt";
import jwt, { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import {
  SendMAil,
  buildVerificationEmailHtml,
  buildOtpEmailHtml,
} from "../emails/mails";
import { ProfileClass } from "../model/Profile";
import { AuthRequest } from "../middleware/verifyToken";
import { unlink } from "node:fs/promises";
import path from "node:path";
import {
  RESET_PASSWORD,
  VERIFY_USER_LOGIN,
  VERIFY_USER_SIGNUP,
} from "../schema/zode";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------- SINUP
export const signup = async (
  req: Request<{}, {}, IUser>,
  res: Response<ApiResponse>,
) => {
  try {
    const result = VERIFY_USER_SIGNUP.safeParse(req.body);
    if (!result.success) {
      throw new Error(result.error.issues[0].message);
    }
    const { email, password, username, intrest } = result.data;

    const User = new UserClass({ username, email, password, intrest });
    const save = await User.save();
    const payload: LpayLoad = {
      username: username,
      email: email,
      id: save._id,
    };
    const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY!, {
      expiresIn: "1h",
    }); // verification token snet to gmail

    const frontEndUrl = process.env.FRONT_END_URL;
    if (!frontEndUrl) {
      return res.status(500).json({
        success: false,
        message: "FRONT_END_URL is not configured",
      });
    }
    const baseUrl = frontEndUrl.replace(/\/+$/, "");
    const verifyUrl = `${baseUrl}/verify-account/verify?token=${encodeURIComponent(token)}`;
    const html = buildVerificationEmailHtml(username, verifyUrl);
    await ProfileClass.saveBio(save._id, save.username);
    await SendMAil(email, "Verify your Rabta account", html);

    return res.status(201).json({
      success: true,
      message: `${username} your account created Successfully. Verify now email sent to you`,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Some thing went wrong try again";
    return res.status(401).json({
      success: false,
      message: message || "error creating account",
    });
  }
};
// ---------------------- LOGIN
export const login = async (
  req: Request<{}, {}, LUser>,
  res: Response<ApiResponse>,
) => {
  try {
    const result = VERIFY_USER_LOGIN.safeParse(req.body);
    if (!result.success) {
      throw new Error(result.error.issues[0].message);
    }
    const { username, password } = result.data;
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "username and password are required",
      });
    }
    const user = await UserClass.GetUserByUsername(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this username does not exist",
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect Password",
      });
    }
    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "JWT secret not found",
      });
    }
    if (!user.verified) {
      return res
        .status(403)
        .json({ success: false, message: "Verify account first" });
    }
    const payload: LpayLoad = {
      id: user._id,
      username: user.username,
      email: user.email,
    };

    const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1d",
    });
    return res.status(200).json({
      success: true,
      message: "login successfull",
      data: { token: token },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Some thing went wrong try again";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};
// ------ verify account
export const VerifyAccount = async (
  req: Request,
  res: Response<ApiResponse>,
) => {
  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({
      success: false,
      message: "Token is required",
    });
  }
  if (!process.env.JWT_SECRET_KEY) {
    return res.status(500).json({
      success: false,
      message: "JWT secret not found",
    });
  }
  try {
    const verified = (await jwt.verify(
      token,
      process.env.JWT_SECRET_KEY,
    )) as LpayLoad;
    const user = await UserClass.GetUserByUsername(verified.username);
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid token or user not found" });
    }
    if (user.verified) {
      return res
        .status(401)
        .json({ success: false, message: "Account already verified" });
    }
    user.verified = true;
    await user.save();
    return res
      .status(200)
      .json({ success: true, message: "Account verified successfully" });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({ success: false, message: "Token expired" });
    } else if (error instanceof JsonWebTokenError) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    } else {
      return res
        .status(500)
        .json({ success: false, message: "Something went wrong" });
    }
  }
};

// ------------ send verification mail
export const sendVerificationMail = async (
  req: Request,
  res: Response<ApiResponse>,
) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Username is required",
    });
  }
  try {
    const user = await UserClass.GetUserByUsername(username);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User with this username does not exist",
      });
    }
    if (user.verified) {
      return res.status(409).json({
        success: false,
        message: "Account already verified",
      });
    }
    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "JWT secret not found",
      });
    }
    const payload: LpayLoad = {
      id: user._id,
      username: user.username,
      email: user.email,
    };
    const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    const frontEndUrl = process.env.FRONT_END_URL;
    if (!frontEndUrl) {
      return res.status(500).json({
        success: false,
        message: "FRONT_END_URL is not configured",
      });
    }
    const baseUrl = frontEndUrl.replace(/\/+$/, "");
    const verifyUrl = `${baseUrl}/verify-account/verify?token=${encodeURIComponent(token)}`;
    const html = buildVerificationEmailHtml(user.username, verifyUrl);

    await SendMAil(user.email, "Verify your Rabta account", html);

    return res.status(200).json({
      success: true,
      message: "Verification email sent",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Some thing went wrong try again";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};
// ------------ FORGOT PASSWORD -----------------
export const sendOTP = async (req: Request, res: Response<ApiResponse>) => {
  const { username } = req.body || {};
  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Username is required",
    });
  }
  try {
    const user = await UserClass.GetUserByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User with this username not found!",
      });
    }

    const otp = generateOTP();
    await Otp.deleteMany({ userId: user._id.toString() });
    await Otp.create({ userId: user._id.toString(), otp });

    const html = buildOtpEmailHtml(user.username, otp, "Password Reset");
    await SendMAil(user.email, "Rabta Password Reset OTP", html);

    return res.status(200).json({
      success: true,
      message: "OTP sent to your email",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Some thing went wrong try again";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};
export const verifyOtp = async (req: Request, res: Response<ApiResponse>) => {
  const { otp } = req.body || {};
  if (!otp) {
    return res.status(400).json({
      success: false,
      message: "OTP is required",
    });
  }
  try {
    const record = await Otp.findOne({ otp });
    if (!record) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired OTP",
      });
    }
    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({
        success: false,
        message: "JWT secret not found",
      });
    }
    const payload = {
      userId: record.userId,
      purpose: "reset password",
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET_KEY, {
      expiresIn: "1h",
    });

    await Otp.deleteOne({ _id: record._id });

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
      data: {
        token: token,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Some thing went wrong try again";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};
// -------------- ResetPassword -----------------------
export const resetPassword = async (
  req: Request,
  res: Response<ApiResponse>,
) => {
  if (!process.env.JWT_SECRET_KEY) {
    return res.status(500).json({
      success: false,
      message: "JWT secret not found",
    });
  }
  try {
    const result = RESET_PASSWORD.safeParse(req.body);
    if (!result.success) {
      throw new Error(result.error.issues[0].message);
    }
    const { password, token } = result.data;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY) as {
      userId: string;
      purpose: string;
    };
    if (!decoded?.userId || decoded?.purpose !== "reset password") {
      return res.status(401).json({
        success: false,
        message: "Invalid reset token",
      });
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.password = await bcrypt.hash(password, 5);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      return res.status(401).json({ success: false, message: "Token expired" });
    }
    if (error instanceof JsonWebTokenError) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }
    const message =
      error instanceof Error
        ? error.message
        : "Some thing went wrong try again";
    return res.status(500).json({
      success: false,
      message,
    });
  }
};
// ---------- update password ------------
export const updatePassword = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  const { currentPassword, newPassword } = req.body || {};

  if (!currentPassword || !newPassword) {
    return res.status(400).json({
      success: false,
      message: "currentPassword and newPassword are required",
    });
  }
  if (currentPassword === newPassword) {
    return res.status(400).json({
      success: false,
      message: "New password must be different from current password",
    });
  }
  const username: string = req.user!?.username;
  try {
    const user = await UserClass.GetUserByUsername(username);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "user not found" });
    }
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Incorrect Password",
      });
    }
    const hash = await bcrypt.hash(newPassword, 5);
    user.password = hash;
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "an error accoured" });
  }
};

//  ---------- profile photho upload -------------
export const uploadProfile = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No image file uploaded" });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    const existingProfile = await ProfileClass.getBioByUsername(
      req.user!.username,
    );
    const previousUrl = existingProfile?.profilePhoto;
    const updatedProfile = await ProfileClass.updateProfilePhoto(
      req.user!.username,
      photoUrl,
    );
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this user",
      });
    }
    if (previousUrl && previousUrl.trim() !== "" && previousUrl !== photoUrl) {
      const pathname =
        previousUrl.startsWith("http://") || previousUrl.startsWith("https://")
          ? new URL(previousUrl).pathname
          : previousUrl;
      const relativePath = pathname.replace(/^\/+/, "");
      const filePath = path.resolve(process.cwd(), relativePath);
      try {
        await unlink(filePath);
      } catch (fileError: any) {
        if (fileError?.code !== "ENOENT") {
          console.log(
            "Error deleting old profile photo:",
            fileError?.message || fileError,
          );
        }
      }
    }
    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      data: {
        userbio: {
          ...updatedProfile,
          username: req.user?.username,
          email: req.user?.email,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to update profile photo",
    });
  }
};
export const SearchUser = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const { username } = req.body || {};
    const currentUserId = req.user?.id;
    const users = await UserClass.SearchUser(username, currentUserId);
    return res.status(200).json({
      success: true,
      message: users.length > 0 ? "User found" : "No users found",
      data: { users },
    });
  } catch (error: any) {
    return res
      .status(400)
      .json({ success: false, message: "something went wrong" });
  }
};
