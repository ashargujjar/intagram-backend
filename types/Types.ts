import { Types } from "mongoose";
export type ApiResponse<T = any> = {
  success: boolean;
  message?: string | object;
  data?: T;
};
export interface IUser {
  username: string;
  email: string;
  password: string;
  intrest: string[];
}
// login user
export type LUser = {
  username: string;
  password: string;
};
// token payload
export type LpayLoad = {
  id: Types.ObjectId;
  username: string;
  email: string;
};
export interface Profileprop {
  name?: string;
  bio?: string;
  url?: string;
  introAudio?: string;
  profilePhoto?: string;
  private?: boolean;
  followers?: number;
  following?: number;
  posts?: number;
}
