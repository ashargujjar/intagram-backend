import { Types } from "mongoose";
import { Profile, User } from "../schema/schema";
import redisClient from "../util/redis";
class ProfileClass {
  static async getBioByUsername(username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      return null;
    }
    const redisKey = `user:profile:${user._id}`;

    const userProfile = await redisClient.hGet(redisKey, "profile");
    if (userProfile) {
      console.log("chach profile hit");
      return JSON.parse(userProfile);
    }
    const profile = await Profile.findOne({ userId: user._id });
    if (!profile) {
      return null;
    }
    console.log("backend is hit");
    const profileObj = profile.toObject();

    await redisClient
      .multi()
      .hSet(redisKey, "profile", JSON.stringify(profileObj))
      .expire(redisKey, Number(process.env.CHACH_EXPIRATION_TIME))
      .exec();

    return profileObj;
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

  static async updateProfilePhoto(username: string, profilePhoto: string) {
    const user = await User.findOne({ username });
    if (!user) {
      return null;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: user._id },
      { $set: { profilePhoto } },
      { new: true, upsert: true },
    );

    if (!profile) {
      return null;
    }
    const redisKey = `user:profile:${user._id}`;
    await redisClient.del(redisKey);
    return profile.toObject();
  }

  static async updateIntroAudio(username: string, introAudio: string) {
    const user = await User.findOne({ username });
    if (!user) {
      return null;
    }

    const profile = await Profile.findOneAndUpdate(
      { userId: user._id },
      { $set: { introAudio } },
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
