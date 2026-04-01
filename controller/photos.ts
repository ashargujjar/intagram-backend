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
    let photoUrl: string[] = (req.files as Express.Multer.File[])
      .filter((f) => f.mimetype.startsWith("image/"))
      .map((y) => `/uploads/${y.filename}`);
    if (photoUrl.length < 0) {
      return res
        .status(400)
        .json({ success: false, message: "no photo file uploaded " });
    }
    photoUpload.post = photoUrl;
    let audioUrl: string[] = (req.files as Express.Multer.File[])
      .filter((y) => y.mimetype.startsWith("audio/"))
      .map((x) => `/uploads/${x.filename}`);
    if (audioUrl.length == 0) {
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
