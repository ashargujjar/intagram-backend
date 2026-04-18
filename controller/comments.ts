import { Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { ApiResponse } from "../types/Types";
import { PhotoClass } from "../model/Photho";
import { openaiClient, PromptForCommentSummary } from "../util/openai";
import redisClient from "../util/redis";

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
export const getCommentsAiSummary = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const postId: string = String(req.params.postId);
    if (!postId) {
      return res.status(400).json({
        success: false,
        message: "PostId not found",
      });
    }

    const commentsArray: string[] =
      await PhotoClass.getCommentsforSummary(postId);
    if (!commentsArray.length) {
      return res.status(400).json({
        success: false,
        message: "comments not found for this post",
      });
    }
    let summary: string = "";
    const redisKey = `summary:${postId}`;
    // make sure empty red in the del add comment add it ok
    const hasSummary = await redisClient.get(redisKey);

    if (hasSummary) {
      console.log("REDIS SUMAMRY CHACHE IS HIT");
      summary = JSON.parse(hasSummary);
      return res.status(200).json({
        success: true,
        message: "Summary of comments fetched succesfully",
        data: summary,
      });
    } else {
      const prompt = PromptForCommentSummary(commentsArray);
      const response = await openaiClient.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      summary = response.choices[0].message.content || "";
      await redisClient.set(redisKey, JSON.stringify(summary));
      return res.status(200).json({
        success: true,
        message: "Summary of comments fetched succesfully",
        data: summary,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "some thing went wrong with the server";
  }
};
