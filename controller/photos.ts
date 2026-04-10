import { Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { ApiResponse, PhothoInterface } from "../types/Types";
import { PhotoClass } from "../model/Photho";

export const uploadPhoto = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
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
    if (!req.files) {
      return res
        .status(400)
        .json({ success: false, message: "No image file uploaded" });
    }
    const filesArray: Express.Multer.File[] = Array.isArray(req.files)
      ? (req.files as Express.Multer.File[])
      : Object.values(
          req.files as Record<string, Express.Multer.File[]>,
        ).flat();
    let photoUrl: string[] = filesArray
      .filter((f) => f.mimetype.startsWith("image/"))
      .map((y) => `/uploads/${y.filename}`);
    if (photoUrl.length <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "no photo file uploaded " });
    }
    photoUpload.post = photoUrl;
    let audioUrl: string[] = filesArray
      .filter((y) => y.mimetype.startsWith("audio/"))
      .map((x) => `/uploads/${x.filename}`);
    if (audioUrl.length > 0) {
      photoUpload.descAudio = audioUrl[0];
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
