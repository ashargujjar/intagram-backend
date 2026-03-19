import { NextFunction, Request, Response } from "express";
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

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// -------------------- SINUP
export const signup = async (
  req: Request<{}, {}, IUser>,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  const { email, password, username, intrest } = req.body;

  try {
    const User = new UserClass({ username, email, password, intrest });
    const save = await User.save();
    const payload: LpayLoad = {
      username: username,
      email: email,
      id: save._id,
    };
    const token = await jwt.sign(payload, process.env.JWT_SECRET_KEY!, {
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
    const html = buildVerificationEmailHtml(username, verifyUrl);

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
    const { username, password } = req.body || {};
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
      expiresIn: "1h",
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
  const { password, token } = req.body || {};
  if (!password || !token) {
    return res.status(400).json({
      success: false,
      message: "Password and token are required",
    });
  }
  if (!process.env.JWT_SECRET_KEY) {
    return res.status(500).json({
      success: false,
      message: "JWT secret not found",
    });
  }
  try {
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
