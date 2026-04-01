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
    const photos = Posts.find({ userId: userId });
    return photos;
  }
}
export { PhotoClass };
