import { Types } from "mongoose";
import { Profile, User } from "../schema/schema";
import redisClient from "../util/redis";
import { Profileprop } from "../types/Types";
class ProfileClass {
  static async getBioByUsername(username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      return null;
    }
    const redisKey = `user:profile:${user._id}`;

    const userProfile = await redisClient.hGet(redisKey, "profile");
    if (userProfile) {
      return JSON.parse(userProfile) as Profileprop;
    }
    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      throw new Error("User profile not found");
    }
    const profileObj = profile.toObject();

    await redisClient
      .multi()
      .hSet(redisKey, "profile", JSON.stringify(profileObj))
      .expire(redisKey, Number(process.env.CHACH_EXPIRATION_TIME))
      .exec();

    return profileObj as Profileprop;
  }
  static async saveBio(id: Types.ObjectId, username: string) {
    const save = await Profile.create({ userId: id });
    // key delete
    const redisKey = `user:profile:${id}`;
    await redisClient.del(redisKey);
  }
  static async updateBio(
    username: string,
    updates: { name?: string; bio?: string; url?: string; private?: boolean },
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      return null;
    }

    const update: {
      name?: string;
      bio?: string;
      url?: string;
      private?: boolean;
    } = {};
    if (typeof updates.name === "string") {
      update.name = updates.name;
    }
    if (typeof updates.bio === "string") {
      update.bio = updates.bio;
    }
    if (typeof updates.url === "string") {
      update.url = updates.url;
    }
    if (typeof updates.private === "boolean") {
      update.private = updates.private;
    }
    if (Object.keys(update).length === 0) {
      return null;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: user._id },
      { $set: update },
      { new: true, upsert: true },
    );

    if (!profile) {
      return null;
    }
    const redisKey = `user:profile:${user._id}`;

    await redisClient.del(redisKey);

    return profile.toObject();
  }

  static async updateProfilePhoto(
    username: string,
    profilePhoto: string,
    ProfilePublicId: string,
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      throw new Error("User not found");
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: user._id },
      { $set: { profilePhoto, ProfilePublicId } },
      { new: true, upsert: true },
    );

    if (!profile) {
      throw new Error("Error uploading the profile");
    }
    const redisKey = `user:profile:${user._id}`;
    await redisClient.del(redisKey);
    return profile.toObject();
  }

  static async updateIntroAudio(
    username: string,
    introAudio: string,
    introAudioPublicId = "",
  ) {
    const user = await User.findOne({ username });
    if (!user) {
      return null;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: user._id },
      { $set: { introAudio, introAudioPublicId } },
      { new: true, upsert: true },
    );

    if (!profile) {
      return null;
    }
    const redisKey = `user:profile:${user._id}`;
    await redisClient.del(redisKey);
    return profile.toObject();
  }
}

export { ProfileClass };
