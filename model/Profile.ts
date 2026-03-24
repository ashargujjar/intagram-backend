import { Types } from "mongoose";
import { Profile, User } from "../schema/schema";

class ProfileClass {
  static async getBioByUsername(username: string) {
    const user = await User.findOne({ username });
    if (!user) {
      return null;
    }

    const profile = await Profile.findOne({ userId: user._id });
    console.log(profile);
    if (!profile) {
      return null;
    }

    return profile.toObject();
  }
  static async saveBio(id: Types.ObjectId) {
    const save = await Profile.create({ userId: id });
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

    return profile.toObject();
  }
}

export { ProfileClass };
