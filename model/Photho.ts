import { Posts } from "../schema/schema";
import { PhothoInterface } from "../types/Types";
class PhotoClass {
  static async uploadPhoto(photo: PhothoInterface) {
    const upload = Posts.create({
      userId: photo.userId,
      caption: photo.caption,
      descAudio: photo.descAudio,
      post: photo.post,
    });
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
    return post;
  }
  static async delteComment(commentId: string, postId: string) {
    const delPost = await Posts.findByIdAndUpdate(
      postId,
      {
        $pull: {
          comments: { _id: commentId },
        },
        $inc: { commentsCount: -1 },
      },
      { new: true },
    );
    return delPost;
  }
}
export { PhotoClass };
