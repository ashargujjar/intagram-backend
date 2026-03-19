import { IUser } from "../types/Types";
import { User } from "../schema/schema";
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
}

export { UserClass };
