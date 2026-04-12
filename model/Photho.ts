import { isValidObjectId } from "mongoose";
import { Notifications, Posts, Profile } from "../schema/schema";
import { PhothoInterface } from "../types/Types";
import fs from "node:fs";
import path from "node:path";
class PhotoClass {
  static async uploadPhoto(photo: PhothoInterface) {
    const upload = await Posts.create({
      userId: photo.userId,
      caption: photo.caption,
      descAudio: photo.descAudio,
      post: photo.post,
    });
    await Profile.findOneAndUpdate(
      { userId: photo.userId },
      { $inc: { posts: 1 } },
    );
    return upload;
  }
  static async getPhotos(userId: string) {
    const photos = Posts.find({ userId: userId }).populate(
      "comments.userId",
      "username profilePhoto",
    );
    return photos;
  }
  static async postComment(
    postId: string,
    userId: string,
    text?: string,
    audio?: string,
  ) {
    if (!text && !audio) {
      throw new Error("Either text or audio is required");
    }
    const commentData: any = {
      userId,
    };

    if (text) commentData.text = text;
    if (audio) commentData.audio = audio;
    const post = await Posts.findByIdAndUpdate(
      postId,
      {
        $push: {
          comments: commentData,
        },
        $inc: {
          commentsCount: 1,
        },
      },
      { new: true },
    ).populate("comments.userId", "username profilePhoto");
    if (!post) {
      throw new Error("error posting the comment");
    }
    const notification = await Notifications.create({
      userId: post?.userId,
      fromUser: userId,
      postId: postId,
      type: "comment",
      message: "Commented on your Post",
    });
    return post;
  }
  static async delteComment(commentId: string, postId: string, userId: any) {
    const post = await Posts.findOne({ _id: postId });
    if (!post) {
      throw new Error("Post not found");
    }
    const isValid = post.comments.find((c: any) => c._id == commentId);
    console.log(isValid);
    if (!isValid) throw new Error("comment not founr");
    if (isValid.userId.toString() !== userId) throw new Error("invalid user");
    const audioUrl = isValid?.audio; // e.g. "/uploads/12345.webm"
    if (audioUrl && audioUrl.startsWith("/uploads/")) {
      const filePath = path.resolve("uploads", path.basename(audioUrl));
      await fs.promises.unlink(filePath).catch((err) => {
        if (err.code !== "ENOENT") throw err;
      });
    }

    const delComment = await Posts.findByIdAndUpdate(
      postId,
      {
        $pull: {
          comments: { _id: commentId },
        },
        $inc: { commentsCount: -1 },
      },
      { new: true },
    );

    return delComment;
  }
  static async Likepost(postId: string, userId: any) {
    const post = await Posts.findById({ _id: postId });
    if (!post) throw new Error("Post not found!!");
    const notification = await Notifications.create({
      userId: post.userId,
      fromUser: userId,
      postId: postId,
      type: "like",
      message: "Liked your Post",
    });

    const isLiked = post.likedBy.find((p) => p == userId);
    if (isLiked) throw new Error("post is already Liked!");
    const like = await Posts.findByIdAndUpdate(
      postId,
      {
        $inc: { likesCount: 1 },
        $push: { likedBy: userId },
      },
      { new: true },
    );
    return like;
  }
  static async disLike(postId: string, userId: any) {
    const post = await Posts.findById({ _id: postId });
    if (!post) throw new Error("Post not found!!");
    const isLiked = post.likedBy.find((p) => p == userId);
    if (!isLiked) throw new Error("post is already DisLiked!");
    const like = await Posts.findByIdAndUpdate(
      postId,
      {
        $inc: { likesCount: -1 },
        $pull: { likedBy: userId },
      },
      { new: true },
    );
    return like;
  }

  static async deletePost(postId: string, userId: string) {
    if (!isValidObjectId(postId)) {
      throw new Error("invalid postId");
    }

    const post = await Posts.findOne({ _id: postId, userId });
    if (!post) {
      throw new Error("Post not found");
    }

    const mediaUrls: string[] = [];
    if (Array.isArray(post.post)) {
      mediaUrls.push(...post.post);
    }
    if (post.descAudio) {
      mediaUrls.push(post.descAudio);
    }

    for (const url of mediaUrls) {
      if (!url) continue;
      const pathname =
        url.startsWith("http://") || url.startsWith("https://")
          ? new URL(url).pathname
          : url;
      const relativePath = pathname.replace(/^\/+/, "");
      const filePath = path.resolve(process.cwd(), relativePath);
      try {
        await fs.promises.unlink(filePath);
      } catch (fileError: any) {
        if (fileError?.code !== "ENOENT") {
          throw fileError;
        }
      }
    }

    await Posts.deleteOne({ _id: postId, userId });
    const count = await Posts.countDocuments({ userId });
    await Profile.findOneAndUpdate({ userId }, { $set: { posts: count } });

    return post;
  }
  // --------- get Followers latest Post ---------
  static async getFollowingsPost(userId: string) {
    const followings = await Profile.findOne({ userId: userId })
      .select("followed")
      .lean();
    const followedIds = Array.isArray(followings?.followed)
      ? followings.followed
      : [];
    if (followedIds.length === 0) {
      return [];
    }
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const posts = await Posts.find({
      userId: { $in: followedIds },
      createdAt: { $gte: oneWeekAgo },
    })
      .select(
        "userId post descAudio caption likesCount commentsCount likedBy",
      )
      .populate({
        path: "userId",
        select: "username",
        populate: {
          path: "profile",
          select: "name profilePhoto",
        },
      })
      .sort({ createdAt: -1 })
      .exec();
    return posts;
  }
}
export { PhotoClass };
