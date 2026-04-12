import { Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { ApiResponse } from "../types/Types";
import { Notifications, Profile } from "../schema/schema";

export const getNotifications = async (
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
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const notifications = await Notifications.find({
      userId,
      createdAt: { $gte: oneWeekAgo },
    })
      .sort({ createdAt: -1 })
      .populate("fromUser", "username")
      .populate("postId", "post")
      .lean();

    const fromUserIds = notifications
      .map((notif: any) => {
        if (typeof notif.fromUser === "object" && notif.fromUser?._id) {
          return String(notif.fromUser._id);
        }
        return String(notif.fromUser || "");
      })
      .filter(Boolean);

    const profiles = await Profile.find({ userId: { $in: fromUserIds } })
      .select("userId name profilePhoto")
      .lean();
    const profileMap = new Map(
      profiles.map((profile) => [String(profile.userId), profile]),
    );

    const data = notifications.map((notif: any) => {
      const fromUser =
        typeof notif.fromUser === "object" ? notif.fromUser : null;
      const fromUserId = fromUser?._id
        ? String(fromUser._id)
        : String(notif.fromUser || "");
      const profile = profileMap.get(fromUserId);
      const postImage = Array.isArray(notif.postId?.post)
        ? notif.postId.post[0]
        : "";
      return {
        id: String(notif._id),
        type: notif.type,
        message: notif.message ?? "",
        read: Boolean(notif.read),
        createdAt: notif.createdAt,
        fromUser: {
          id: fromUserId,
          username: fromUser?.username ?? "",
          name: profile?.name ?? "",
          profilePhoto: profile?.profilePhoto ?? "",
        },
        postId: notif.postId?._id ? String(notif.postId._id) : "",
        postImage,
      };
    });

    return res.status(200).json({
      success: true,
      message: "notifications fetched",
      data: { notifications: data },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};
