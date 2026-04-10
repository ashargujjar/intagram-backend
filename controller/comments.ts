import { Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { ApiResponse } from "../types/Types";
import { PhotoClass } from "../model/Photho";

export const PostComment = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const { text, postId, audio } = req.body;
    const userId = req.user?.id;
    const audioUrl = req.file ? `/uploads/${req.file.filename}` : audio || "";
    let post = await PhotoClass.postComment(postId, userId!, text, audioUrl);

    if (post) {
      return res.status(201).json({
        success: true,
        message: "comment added successfully",
        data: post,
      });
    }
    throw new Error("error posting the comment");
  } catch (err: any) {
    if (err instanceof Error) {
      return res.status(400).json({ success: false, message: err.message });
    }
    return res
      .status(400)
      .json({ success: false, message: "internal server error" });
  }
};
export const deleteCommnet = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const { postId, commentId } = req.body;
    if (!postId || !commentId) {
      throw new Error("post and the commentId both required ");
    }
    const userId = req.user!.id;
    const delComment = await PhotoClass.delteComment(commentId, postId, userId);
    if (delComment) {
      return res
        .status(200)
        .json({ success: true, message: "comment deleted", data: delComment });
    }
    throw new Error("error deleting the comment");
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ success: false, message: error.message });
    }
    return res
      .status(400)
      .json({ success: false, message: "internal server error" });
  }
};
