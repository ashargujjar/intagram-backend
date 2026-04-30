import { boolean, string, z } from "zod";

const username = z
  .string({ message: "Username is required" })
  .min(4, "username must be min 4 chraracter long");
const password = z
  .string({ message: "Password is required" })
  .min(4, "Password must be at least 4 characters long");
// signup
export const VERIFY_USER_SIGNUP = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format")
    .describe("user unique signin email"),
  password: password,
  username: username,
  intrest: z.array(z.string()).min(1, "At least one interest is required"),
});
// login
export const VERIFY_USER_LOGIN = z.object({
  username: username,
  password: password,
});
//
export const RESET_PASSWORD = z.object({
  password: password,
  token: z.string({ message: "token is required" }),
});
export const UPDATE_BIO = z.object({
  name: string()
    .min(3, "name must be greater then 3")
    .max(11, "username must not greater then  11")
    .optional(),
  bio: string()
    .min(10, "bio must be greater then 10 of length")
    .max(150, "Bio must be less then the 150 words")
    .optional(),
  url: string()
    .min(5, "url must be greater then 5 of length")
    .max(200, "url must be less then 200 of length"),
  private: boolean(),
});

export const POST_COMMENT = z.object({
  text: z
    .string()
    .max(200, "comment text must be less then the length of 200")
    .optional(),
  postId: z.string(),
  audio: z.string().optional(),
});
export const AI_CHAT = z.object({
  message: z
    .string("message is required")
    .min(5, "message must be greater then 5 of length")
    .max(200, "message must be less then 200 words"),
});
