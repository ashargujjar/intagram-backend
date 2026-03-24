import { Response } from "express";
import { ApiResponse, Profileprop } from "../types/Types";
import { ProfileClass } from "../model/Profile";
import { AuthRequest } from "../middleware/verifyToken";
// ---------------- get Bio --------
export const getBio = async (req: AuthRequest, res: Response<ApiResponse>) => {
  if (!req.user?.username) {
    return res.status(400).json({
      success: false,
      message: "Username is required",
    });
  }

  try {
    const bio = await ProfileClass.getBioByUsername(req.user?.username);
    if (bio === null || bio === undefined) {
      return res.status(404).json({
        success: false,
        message: "Bio not found for this user",
      });
    }
    let userbio = {
      ...bio,
      username: req.user?.username,
      email: req.user?.email,
    };
    return res.status(200).json({
      success: true,
      message: "Profile loaded successfully",
      data: { userbio },
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
// ----------- update Bio ---------
export const updateBio = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  const username = req.user?.username;
  if (!username) {
    return res.status(400).json({
      success: false,
      message: "Username is required",
    });
  }
  const body = req.body as Profileprop;
  const updates: {
    name?: string;
    bio?: string;
    url?: string;
    private?: boolean;
  } = {};
  if (typeof body?.name === "string") {
    updates.name = body.name;
  }
  if (typeof body?.bio === "string") {
    updates.bio = body.bio;
  }
  if (typeof body?.url === "string") {
    updates.url = body.url;
  }
  if (typeof body?.private === "boolean") {
    updates.private = body.private;
  }
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({
      success: false,
      message: "At least one of name, bio, url, or private is required",
    });
  }

  try {
    const updatedProfile = await ProfileClass.updateBio(username, updates);
    if (updatedProfile === null || updatedProfile === undefined) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        userbio: {
          ...updatedProfile,
          username: req.user?.username,
          email: req.user?.email,
        },
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
