import { z } from "zod";

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
