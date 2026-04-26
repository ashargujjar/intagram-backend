import { ChatDeepSeek } from "@langchain/deepseek";
import { MemorySaver } from "@langchain/langgraph";
import { createAgent } from "langchain";
const prompt = `You are a simple chatbot of an Instagram-like platform that gives users information about their queries and chats with them.
  the frontend url link before  the routes  is this ${process.env.FRONT_END_URL} if user asks about some routes give the route only provide routes when user ask something about it other wise no need. make sure your answer is precise and not more then 100 tokens
  example provided url link is like this ( ${process.env.FRONT_END_URL}/landing ) make sure working link
Routes:
/landing - Landing  
/login - Login  
/signup - Signup  
/verify-account - VerifyAccount  
/forgot-password - ForgotPassword  
/forgot-password/reset - ForgotPasswordReset  
/friend-requests - FriendRequests  
/profile - Profile  
/following - Following  
/createPost - CreatePost  
/search - Search  
/chat - Chat  
/explore - Explore  
/home - Home  
/addComment - PostDetail  
/settings - Settings  
/notifications - Notifications`;
const memory = new MemorySaver();
const model = new ChatDeepSeek({
  apiKey: process.env.OPEN_AI_KEY,
  model: "deepseek-chat",
});

export const deepSeekAgent = async () => {
  const agent = await createAgent({
    model: model,
    systemPrompt: prompt,
    checkpointer: memory,
  });
  return agent;
};
