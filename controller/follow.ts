import { Response } from "express";
import { isValidObjectId } from "mongoose";
import { AuthRequest } from "../middleware/verifyToken";
import { ApiResponse } from "../types/Types";
import { Profile, User } from "../schema/schema";
import { UserClass } from "../model/User";

const resolveTargetUser = async (value: string) => {
  if (isValidObjectId(value)) {
    return await User.findById(value);
  }
  return await User.findOne({ username: value });
};

export const FollowUser = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const currentUserId = req.user?.id;
    const targetValue = req.params.username || req.body?.username;
    if (!currentUserId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }
    if (!targetValue) {
      return res
        .status(400)
        .json({ success: false, message: "username is required" });
    }
    if (targetValue === req.user?.username) {
      return res
        .status(400)
        .json({ success: false, message: "cannot follow yourself" });
    }

    const targetUser = await resolveTargetUser(targetValue);
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const currentId = String(currentUserId);
    const targetId = String(targetUser._id);
    if (currentId === targetId) {
      return res
        .status(400)
        .json({ success: false, message: "cannot follow yourself" });
    }

    const [currentProfile, targetProfile] = await Promise.all([
      Profile.findOne({ userId: currentId }),
      Profile.findOne({ userId: targetId }),
    ]);
    if (!currentProfile || !targetProfile) {
      return res
        .status(404)
        .json({ success: false, message: "profile not found" });
    }

    const followedList = Array.isArray(currentProfile.followed)
      ? currentProfile.followed
      : [];
    const requestedList = Array.isArray(targetProfile.requested)
      ? targetProfile.requested
      : [];

    const alreadyFollowing = followedList.includes(targetId);
    const alreadyRequested = requestedList.includes(currentId);

    let isFollowing = alreadyFollowing;
    let isRequested = alreadyRequested;
    let didRequest = false;
    if (isFollowing) {
      isRequested = false;
    }

    if (targetProfile.private) {
      if (!alreadyFollowing && !alreadyRequested) {
        await Profile.updateOne(
          { userId: targetId },
          { $addToSet: { requested: currentId } },
        );
        isRequested = true;
        didRequest = true;
      }
    } else if (!alreadyFollowing) {
      await Promise.all([
        Profile.updateOne(
          { userId: currentId },
          { $addToSet: { followed: targetId }, $inc: { followings: 1 } },
        ),
        Profile.updateOne(
          { userId: targetId },
          {
            $addToSet: { followdBy: currentId },
            $pull: { requested: currentId },
            $inc: { followers: 1 },
          },
        ),
      ]);
      isFollowing = true;
      isRequested = false;
    }

    const freshTarget = await Profile.findOne({ userId: targetId }).lean();

    const message = isFollowing
      ? "following"
      : isRequested
        ? didRequest
          ? "follow request sent"
          : "already requested"
        : "already requested";

    return res.status(200).json({
      success: true,
      message,
      data: {
        relation: {
          isFollowing,
          isRequested,
        },
        target: {
          followers: freshTarget?.followers ?? 0,
          followings: freshTarget?.followings ?? 0,
          posts: freshTarget?.posts ?? 0,
        },
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};

export const UnfollowUser = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const currentUserId = req.user?.id;
    const targetValue = req.params.username || req.body?.username;
    if (!currentUserId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }
    if (!targetValue) {
      return res
        .status(400)
        .json({ success: false, message: "username is required" });
    }

    const targetUser = await resolveTargetUser(targetValue);
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const currentId = String(currentUserId);
    const targetId = String(targetUser._id);
    if (currentId === targetId) {
      return res
        .status(400)
        .json({ success: false, message: "cannot unfollow yourself" });
    }

    const [currentProfile, targetProfile] = await Promise.all([
      Profile.findOne({ userId: currentId }),
      Profile.findOne({ userId: targetId }),
    ]);
    if (!currentProfile || !targetProfile) {
      return res
        .status(404)
        .json({ success: false, message: "profile not found" });
    }

    const followedList = Array.isArray(currentProfile.followed)
      ? currentProfile.followed
      : [];
    const requestedList = Array.isArray(targetProfile.requested)
      ? targetProfile.requested
      : [];

    const isFollowing = followedList.includes(targetId);
    const isRequested = requestedList.includes(currentId);

    if (isRequested) {
      await Profile.updateOne(
        { userId: targetId },
        { $pull: { requested: currentId } },
      );
    }

    if (isFollowing) {
      await Promise.all([
        Profile.updateOne(
          { userId: currentId },
          { $pull: { followed: targetId }, $inc: { followings: -1 } },
        ),
        Profile.updateOne(
          { userId: targetId },
          { $pull: { followdBy: currentId }, $inc: { followers: -1 } },
        ),
      ]);
    }

    const freshTarget = await Profile.findOne({ userId: targetId }).lean();

    return res.status(200).json({
      success: true,
      message: isRequested
        ? "request cancelled"
        : isFollowing
          ? "unfollowed"
          : "no action",
      data: {
        relation: {
          isFollowing: false,
          isRequested: false,
        },
        target: {
          followers: freshTarget?.followers ?? 0,
          followings: freshTarget?.followings ?? 0,
          posts: freshTarget?.posts ?? 0,
        },
      },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};

export const RemoveFollower = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const currentUserId = req.user?.id;
    const targetValue = req.params.userId || req.body?.userId;
    if (!currentUserId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }
    if (!targetValue) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const targetUser = await resolveTargetUser(targetValue);
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const currentId = String(currentUserId);
    const targetId = String(targetUser._id);
    if (currentId === targetId) {
      return res
        .status(400)
        .json({ success: false, message: "invalid request" });
    }

    const [currentProfile, targetProfile] = await Promise.all([
      Profile.findOne({ userId: currentId }),
      Profile.findOne({ userId: targetId }),
    ]);
    if (!currentProfile || !targetProfile) {
      return res
        .status(404)
        .json({ success: false, message: "profile not found" });
    }

    const followerList = Array.isArray(currentProfile.followdBy)
      ? currentProfile.followdBy
      : [];
    const targetFollowedList = Array.isArray(targetProfile.followed)
      ? targetProfile.followed
      : [];

    const isFollower = followerList.includes(targetId);
    const isFollowingCurrent = targetFollowedList.includes(currentId);

    if (!isFollower && !isFollowingCurrent) {
      return res.status(200).json({
        success: true,
        message: "no action",
      });
    }

    await Promise.all([
      Profile.updateOne(
        { userId: currentId },
        isFollower
          ? { $pull: { followdBy: targetId }, $inc: { followers: -1 } }
          : { $pull: { followdBy: targetId } },
      ),
      Profile.updateOne(
        { userId: targetId },
        isFollowingCurrent
          ? { $pull: { followed: currentId }, $inc: { followings: -1 } }
          : { $pull: { followed: currentId } },
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: "follower removed",
      data: { id: targetId },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};

export const GetFollowRequests = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const currentUserId = req.user?.id;
    if (!currentUserId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }

    const profile = await Profile.findOne({ userId: String(currentUserId) })
      .select("requested")
      .lean();
    const requestedIds = Array.isArray(profile?.requested)
      ? profile!.requested
      : [];

    if (requestedIds.length === 0) {
      return res.status(200).json({
        success: true,
        message: "no requests",
        data: { requests: [] },
      });
    }

    const users = await User.find({ _id: { $in: requestedIds } })
      .select("_id username")
      .lean();
    const profiles = await Profile.find({ userId: { $in: requestedIds } })
      .select("userId name profilePhoto")
      .lean();
    const profileMap = new Map(
      profiles.map((item) => [String(item.userId), item]),
    );

    const requests = users.map((user) => {
      const info = profileMap.get(String(user._id));
      return {
        id: String(user._id),
        username: user.username,
        name: info?.name ?? "",
        profilePhoto: info?.profilePhoto ?? "",
      };
    });

    return res.status(200).json({
      success: true,
      message: "requests fetched",
      data: { requests },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};

export const ConfirmFollowRequest = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const currentUserId = req.user?.id;
    const requesterValue = req.params.userId || req.body?.userId;
    if (!currentUserId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }
    if (!requesterValue) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const requesterUser = await resolveTargetUser(requesterValue);
    if (!requesterUser) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const currentId = String(currentUserId);
    const requesterId = String(requesterUser._id);
    if (currentId === requesterId) {
      return res
        .status(400)
        .json({ success: false, message: "invalid request" });
    }

    const currentProfile = await Profile.findOne({ userId: currentId })
      .select("requested")
      .lean();
    const requestedList = Array.isArray(currentProfile?.requested)
      ? currentProfile!.requested
      : [];
    if (!requestedList.includes(requesterId)) {
      return res.status(200).json({
        success: true,
        message: "request already handled",
      });
    }

    await Promise.all([
      Profile.updateOne(
        { userId: currentId },
        {
          $pull: { requested: requesterId },
          $addToSet: { followdBy: requesterId },
          $inc: { followers: 1 },
        },
      ),
      Profile.updateOne(
        { userId: requesterId },
        { $addToSet: { followed: currentId }, $inc: { followings: 1 } },
      ),
    ]);

    return res.status(200).json({
      success: true,
      message: "request accepted",
      data: { id: requesterId },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};

export const RejectFollowRequest = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const currentUserId = req.user?.id;
    const requesterValue = req.params.userId || req.body?.userId;
    if (!currentUserId) {
      return res
        .status(401)
        .json({ success: false, message: "invalid token. user not found" });
    }
    if (!requesterValue) {
      return res
        .status(400)
        .json({ success: false, message: "userId is required" });
    }

    const requesterUser = await resolveTargetUser(requesterValue);
    if (!requesterUser) {
      return res
        .status(404)
        .json({ success: false, message: "user not found" });
    }

    const currentId = String(currentUserId);
    const requesterId = String(requesterUser._id);
    if (currentId === requesterId) {
      return res
        .status(400)
        .json({ success: false, message: "invalid request" });
    }

    await Profile.updateOne(
      { userId: currentId },
      { $pull: { requested: requesterId } },
    );

    return res.status(200).json({
      success: true,
      message: "request rejected",
      data: { id: requesterId },
    });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "internal server error";
    return res.status(400).json({ success: false, message });
  }
};

export const getFollowings = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const userId = req.user?.id;
    const requestedUserId = String(req.params.requestedUserId);

    const user = await UserClass.getFollowings(userId!, requestedUserId);
    return res
      .status(200)
      .json({ success: true, message: "followers get", data: user });
  } catch (error: any) {
    if (error instanceof Error) {
      return res.status(404).json({ success: false, message: error.message });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "internal sevrer error" });
    }
  }
};
export const getFollowers = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {
  try {
    const userId = req.user?.id;
    const requestedUserId: string = String(req.params.requestedUserId);
    if (!requestedUserId) {
      throw new Error("userId is required");
    }
    const user = await UserClass.getFollowers(userId!, requestedUserId!);
    return res
      .status(200)
      .json({ success: true, message: "followers get", data: user });
  } catch (error: any) {
    if (error instanceof Error) {
      return res.status(404).json({ success: false, message: error.message });
    } else {
      return res
        .status(404)
        .json({ success: false, message: "internal sevrer error" });
    }
  }
};
