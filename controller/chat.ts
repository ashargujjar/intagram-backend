import { Response } from "express";
import { AuthRequest } from "../middleware/verifyToken";
import { deepSeekAgent } from "../util/agent";
import { HumanMessage } from "@langchain/core/messages";
type agentResponse = {
  user: string;
  success?: boolean;
  content: string;
};
export const Chat = async (
  req: AuthRequest,
  res: Response<agentResponse[]>,
) => {
  const { message } = req.body;
  const hummanMessage = new HumanMessage(message);
  const agent = await deepSeekAgent();
  const config = { configurable: { thread_id: req.user?.id! } };

  const result = await agent.invoke({ messages: [hummanMessage] }, config);
  if (result?.messages?.length) {
    const lastMessage = result.messages[result.messages.length - 1];
    return res.status(200).json([
      {
        success: true,
        user: "agent",
        content: lastMessage?.content as string,
      },
      {
        user: "user",
        content: message,
      },
    ]);
  } else {
    return res.status(400).json([]);
  }
};
