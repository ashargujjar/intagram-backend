import { NextFunction, Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { ApiResponse } from "../types/Types";
// check that the user exists
export const checkValidUser = (
  req: AuthRequest,
  res: Response<ApiResponse>,
  next: NextFunction,
) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ success: false, message: "auth token not found or expires" });
  }
  next();
};
