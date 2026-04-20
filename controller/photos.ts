import { Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { ApiResponse, PhothoInterface } from "../types/Types";
import { PhotoClass } from "../model/Photho";
import { Profile, User } from "../schema/schema";
import cloudinary from "../util/cloudinary";
import { unlink } from "node:fs/promises";
import { openaiClient, promotForImageDescription } from "../util/openai";

const deleteTempFile = async (filePath?: string) => {
  if (!filePath) return;
  try {
    await unlink(filePath);
  } catch (error: any) {
    if (error?.code !== "ENOENT") {
      console.log("Error deleting temp upload:", error?.message || error);
    }
  }
};

export const uploadPhoto = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined;
  const imageFile = files?.image?.[0] || req.file;
  const audioFile = files?.audio?.[0];

  try {
    let photoUpload: PhothoInterface = {
      post: [],
      caption: "",
      descAudio: "",
      userId: req.user!.id,
    };
    const { text } = req.body;
    if (text) {
      photoUpload.caption = text;
    }
    if (!imageFile) {
      return res
        .status(400)
        .json({ success: false, message: "No image file uploaded" });
    }
    if (!imageFile.mimetype.startsWith("image/")) {
      throw new Error("Only images are allowed");
    }
    const imgResult = await cloudinary.uploader.upload(imageFile.path, {
      folder: "posts",
    });
    photoUpload.post = [imgResult.secure_url];
    photoUpload.imagePublicId = imgResult.public_id;

    if (audioFile) {
      const audioResult = await cloudinary.uploader.upload(audioFile.path, {
        resource_type: "video", // important for audio
        folder: "audios",
      });
      photoUpload.descAudio = audioResult.secure_url;
      photoUpload.audioPublicId = audioResult.public_id;
    }
    let upload = await PhotoClass.uploadPhoto(photoUpload);
    if (upload) {
      return res
        .status(200)
        .json({ success: true, message: "photo uploaded successfully" });
    } else {
      throw new Error("error saving the post in db");
    }
  } catch (err: unknown) {
    let message = "";
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = "internal server error please try again ";
    }
    return res.status(400).json({ success: false, message: message });
  } finally {
    await deleteTempFile(imageFile?.path);
    await deleteTempFile(audioFile?.path);
  }
};
export const getPhotos = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }

    const photos = await PhotoClass.getPhotos(userId);

    return res.status(200).json({
      success: true,
      message: "photos fetched successfully",
      data: { photos: photos ?? [] },
    });
  } catch (err: unknown) {
    let message = "";
    if (err instanceof Error) {
      message = err.message;
    } else {
      message = "internal server error please try again ";
    }
    return res.status(400).json({ success: false, message: message });
  }
};

export const getPhotosByUsername = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const currentUserId = req.user?.id;
    const username = req.params.username;
    if (!currentUserId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }
    if (!username) {
      return res
        .status(400)
        .json({ success: false, message: "username is required" });
    }

    const targetUser = await User.findOne({ username });
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const currentId = String(currentUserId);
    const targetId = String(targetUser._id);
    if (currentId !== targetId) {
      const targetProfile = await Profile.findOne({ userId: targetId })
        .select("private followdBy")
        .lean();
      if (targetProfile?.private) {
        const followers = Array.isArray(targetProfile.followdBy)
          ? targetProfile.followdBy
          : [];
        if (!followers.includes(currentId)) {
          return res.status(403).json({
            success: false,
            message: "This account is private",
          });
        }
      }
    }

    const photos = await PhotoClass.getPhotos(targetId);
    return res.status(200).json({
      success: true,
      message: "photos fetched successfully",
      data: { photos: photos ?? [] },
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error
        ? err.message
        : "internal server error please try again";
    return res.status(400).json({ success: false, message });
  }
};
export const likePost = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const { postId } = req.body;
    const userId = req.user!.id;
    if (!postId) throw new Error("postId is required");
    const post = await PhotoClass.Likepost(postId, userId);
    if (post) {
      return res
        .status(200)
        .json({ success: true, message: "post liked", data: post });
    }
    throw new Error("error deleting the post");
  } catch (err: any) {
    if (err instanceof Error) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};
export const disLike = async (req: AuthRequest, res: Response<ApiResponse>) => {
  try {
    const { postId } = req.body;
    const userId = req.user!.id;
    if (!postId) throw new Error("postId is required");
    const post = await PhotoClass.disLike(postId, userId);
    if (post) {
      return res
        .status(200)
        .json({ success: true, message: "post liked", data: post });
    }
    throw new Error("error deleting the post");
  } catch (err: any) {
    if (err instanceof Error) {
      return res.status(400).json({ success: false, message: err.message });
    }
  }
};

export const deletePost = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const postId = req.params.postId || req.body?.postId;
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }
    if (!postId) throw new Error("postId is required");

    const deleted = await PhotoClass.deletePost(postId, userId);
    return res.status(200).json({
      success: true,
      message: "post deleted successfully",
      data: deleted,
    });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};
export const getFollowingsPost = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }
    const posts = await PhotoClass.getFollowingsPost(String(userId));
    const list = Array.isArray(posts) ? posts : [];
    const currentUserId = String(userId);
    const data = list.map((post: any) => {
      const owner = post.userId;
      const ownerId = String(post.userId || "");
      const likedByList = Array.isArray(post.likedBy)
        ? post.likedBy.map((id: any) => String(id))
        : [];
      const profile = owner?.profile ?? null;
      return {
        _id: String(post._id),
        userId: ownerId,
        post: post.post,
        descAudio: post.descAudio ?? "",
        caption: post.caption ?? "",
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        likedBy: likedByList,
        isLiked: likedByList.includes(currentUserId),
        user: {
          id: ownerId,
          username: owner?.username ?? "",
          name: profile?.name ?? "",
          profilePhoto: profile?.profilePhoto ?? "",
        },
      };
    });
    const message =
      data.length === 0
        ? "no lattest post in feed follow more to get"
        : "Post data is fetched";
    return res.status(200).json({
      success: true,
      message,
      data,
    });
  } catch (err: any) {
    const message =
      err instanceof Error ? err.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};
export const getPhthosForExplore = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const posts = await PhotoClass.getPhothosForExplore();
    if (posts.length < 0) {
      throw new Error("Nothing to show right now");
    }
    return res.status(200).json({
      success: true,
      message: "Post fetched successfuly",
      data: posts,
    });
  } catch (error: any) {
    const message =
      error instanceof Error ? error.message : "internal server Error";
    return res.status(400).json({ success: false, message: message });
  }
};
export const enhancePhotoDescriptionText = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const { descText } = req.body;
    if (!descText) {
      throw new Error("Description text is required");
    }
    const prompt = promotForImageDescription(descText);
    const response = await openaiClient.chat.completions.create({
      model: "deepseek-chat",
      messages: [{ role: "user" as const, content: prompt }],
    });
    const description = response.choices[0].message.content || "";
    return res.status(200).json({
      success: true,
      message: "summarized successfully",
      data: description,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "internal server Error";
    return res.status(400).json({ success: false, message: message });
  }
};
