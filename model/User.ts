import { IUser } from "../types/Types";
import { Profile, User } from "../schema/schema";
import bcrypt from "bcrypt";
class UserClass {
  username: string;
  email: string;
  password: string;
  intrest: string[];

  constructor(user: IUser) {
    this.username = user.username;
    this.email = user.email;
    this.password = user.password;
    this.intrest = user.intrest;
  }
  async save() {
    const user = await User.findOne({ username: this.username });
    if (user) {
      throw new Error("User with this username already exists");
    }
    this.password = await bcrypt.hash(this.password, 5);
    const save = await User.create(this as IUser);
    if (!save) {
      throw new Error("error creating the user");
    }
    return save;
  }
  static async Login() {}
  static async GetUserByUsername(username: string) {
    const user = await User.findOne({ username: username });
    return user;
  }
  static async SearchUser(username: string, currentUserId?: string) {
    const users = await User.find({
      username: { $regex: username, $options: "i" },
    })
      .select("_id username")
      .limit(10)
      .lean();
    if (users.length === 0) {
      return [];
    }
    let followedSet = new Set<string>();
    if (currentUserId) {
      const currentProfile = await Profile.findOne({ userId: currentUserId })
        .select("followed")
        .lean();
      const followed = Array.isArray(currentProfile?.followed)
        ? currentProfile!.followed
        : [];
      followedSet = new Set(followed.map((id) => String(id)));
    }
    const userIds = users.map((user) => user._id);
    const profiles = await Profile.find({ userId: { $in: userIds } })
      .select("userId name profilePhoto private followers followings posts")
      .lean();
    const profileMap = new Map(
      profiles.map((profile) => [String(profile.userId), profile]),
    );
    return users.map((user) => {
      const profile = profileMap.get(String(user._id));
      return {
        id: user._id.toString(),
        username: user.username,
        name: profile?.name ?? "",
        profilePhoto: profile?.profilePhoto ?? "",
        private: profile?.private ?? false,
        followers: profile?.followers ?? 0,
        followings: profile?.followings ?? 0,
        posts: profile?.posts ?? 0,
        isFollowing: followedSet.has(String(user._id)),
      };
    });
  }
  static async getFollowersFollowings(
    userId: string,
    requestedUserId: string,
    requestFor: "followed" | "followdBy",
  ) {
    const user = await Profile.findOne({ userId: requestedUserId }).lean();
    const currUser = await Profile.findOne({ userId });
    if (!user || !currUser) {
      throw new Error("user not found");
    }
    type ProfileType = typeof user;
    const requested: string[] = user[requestFor];
    const profiles: ProfileType[] = await Profile.find(
      {
        userId: { $in: requested },
      },
      {
        userId: 1,
        followdBy: 1,
        followed: 1,
        name: 1,
        private: 1,
        followers: 1,
        profilePhoto: 1,
        url: 1,
      },
    ).populate("userId", "username");
    type DataType = {
      profiles: ProfileType[];
      currUser: any;
    };
    let data: DataType = {
      profiles: [],
      currUser: null,
    };
    data = { profiles, currUser };
    return data;
  }
  static async getFollowers(userId: string, requestedUserId: string) {
    return this.getFollowersFollowings(userId, requestedUserId, "followdBy");
  }
  static async getFollowings(userId: string, requestedUserId: string) {
    return this.getFollowersFollowings(userId, requestedUserId, "followed");
  }
}

export { UserClass };
