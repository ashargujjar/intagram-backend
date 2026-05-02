import { Response } from "express";
import { ApiResponse, Profileprop } from "../types/Types";
import { ProfileClass } from "../model/Profile";
import { AuthRequest } from "../middleware/verifyToken";
import { unlink } from "node:fs/promises";
import path from "node:path";
import { User } from "../schema/schema";
import cloudinary from "../util/cloudinary";
import { error } from "node:console";

const deleteLocalFile = async (url?: string) => {
  if (!url) return;
  const pathname =
    url.startsWith("http://") || url.startsWith("https://")
      ? new URL(url).pathname
      : url;
  const relativePath = pathname.replace(/^\/+/, "");
  const filePath = path.resolve(process.cwd(), relativePath);

  try {
    await unlink(filePath);
  } catch (fileError: any) {
    if (fileError.code !== "ENOENT") {
      throw new Error("Error deleting file: " + fileError.message);
    }
    console.log("File not found, continuing...");
  }
};
// ---------------- get Bio --------
export const getBio = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const username = req.params.username
      ? String(req.params.username)
      : req.user?.username;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: "Username required",
      });
    }

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const bio = await ProfileClass.getBioByUsername(username);
    if (bio === null || bio === undefined) {
      return res.status(404).json({
        success: false,
        message: "Bio not found for this user",
      });
    }

    const currentUserId = req.user?.id ? String(req.user.id) : "";
    const isCurrentUser = req.user?.username === username;
    const requestedList = Array.isArray(bio.requested) ? bio.requested : [];
    const followdByList = Array.isArray(bio.followdBy) ? bio.followdBy : [];
    const isFollowing = currentUserId
      ? followdByList.includes(currentUserId)
      : false;
    const relation = {
      isCurrentUser,
      isFollowing,
      isRequested:
        !isFollowing && currentUserId
          ? requestedList.includes(currentUserId)
          : false,
    };

    const userbio = {
      ...bio,
      username: targetUser.username,
      email: isCurrentUser ? req.user?.email : "",
    };
    return res.status(200).json({
      success: true,
      message: "Profile loaded successfully",
      data: { userbio, relation },
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
// ------------- delete profile photho ---------------
export const deleteProfile = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  if (!req.user?.username) {
    return res.status(401).json({
      success: false,
      message: "invalid token. user not found",
    });
  }

  const username = req.user.username;

  try {
    const profile = await ProfileClass.getBioByUsername(username);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const url = profile.ProfilePublicId;
    if (!url || url.trim() === "") {
      return res.status(200).json({
        success: true,
        message: "No profile photo to delete",
        data: {
          userbio: {
            ...profile,
            username: req.user?.username,
            email: req.user?.email,
          },
        },
      });
    }

    await cloudinary.uploader.destroy(url);

    const updatedProfile = await ProfileClass.updateProfilePhoto(
      username,
      "",
      "",
    );
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Photo removed successfully",
      data: {
        userbio: {
          ...updatedProfile,
          username: req.user?.username,
          email: req.user?.email,
        },
      },
    });
  } catch (error: unknown) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "something went wrong",
    });
  }
};

// ------------- upload intro audio ---------------
export const uploadIntroAudio = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  const tempFilePath = req.file?.path;
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "No audio file uploaded" });
    }

    const existingProfile = await ProfileClass.getBioByUsername(
      req.user!.username,
    );
    const previousUrl = existingProfile?.introAudio;
    const previousPublicId = existingProfile?.introAudioPublicId;
    const audioResult = await cloudinary.uploader.upload(req.file.path, {
      resource_type: "video",
      folder: "intro-audios",
    });

    const updatedProfile = await ProfileClass.updateIntroAudio(
      req.user!.username,
      audioResult.secure_url,
      audioResult.public_id,
    );
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this user",
      });
    }

    if (
      previousPublicId &&
      previousPublicId.trim() !== "" &&
      previousPublicId !== audioResult.public_id
    ) {
      await cloudinary.uploader.destroy(previousPublicId, {
        resource_type: "video",
      });
    } else if (
      previousUrl &&
      previousUrl.trim() !== "" &&
      previousUrl !== audioResult.secure_url
    ) {
      try {
        await deleteLocalFile(previousUrl);
      } catch (fileError: any) {
        console.log(
          "Error deleting old intro audio:",
          fileError?.message || fileError,
        );
      }
    }

    return res.status(200).json({
      success: true,
      message: "Intro audio updated successfully",
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
      message: "Unable to update intro audio",
    });
  } finally {
    if (tempFilePath) {
      try {
        await unlink(tempFilePath);
      } catch (fileError: any) {
        if (fileError?.code !== "ENOENT") {
          console.log(
            "Error deleting temp intro audio:",
            fileError?.message || fileError,
          );
        }
      }
    }
  }
};

// ------------- delete intro audio ---------------
export const deleteIntroAudio = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  if (!req.user?.username) {
    return res.status(401).json({
      success: false,
      message: "invalid token. user not found",
    });
  }

  const username = req.user.username;

  try {
    const profile = await ProfileClass.getBioByUsername(username);
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: "user not found",
      });
    }

    const url = profile.introAudio;
    const publicId = profile.introAudioPublicId;

    if (!url || url.trim() === "") {
      return res.status(200).json({
        success: true,
        message: "No intro audio to delete",
        data: {
          userbio: {
            ...profile,
            username: req.user?.username,
            email: req.user?.email,
          },
        },
      });
    }

    if (publicId && publicId.trim() !== "") {
      await cloudinary.uploader.destroy(publicId, {
        resource_type: "video",
      });
    } else {
      await deleteLocalFile(url);
    }

    const updatedProfile = await ProfileClass.updateIntroAudio(
      username,
      "",
      "",
    );
    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found for this user",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Intro audio removed successfully",
      data: {
        userbio: {
          ...updatedProfile,
          username: req.user?.username,
          email: req.user?.email,
        },
      },
    });
  } catch (error: unknown) {
    return res.status(400).json({
      success: false,
      message: error instanceof Error ? error.message : "something went wrong",
    });
  }
};
