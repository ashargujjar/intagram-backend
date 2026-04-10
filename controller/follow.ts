import { Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { ApiResponse } from "../types/Types";

export const FollowUser = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {};
export const UnfollowUser = async (
  req: AuthRequest,
  res: Response<ApiResponse>,
) => {};
