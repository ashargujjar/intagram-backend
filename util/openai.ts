import Openai from "openai";
const client = new Openai({
  apiKey: process.env.OPEN_AI_KEY,
});
export const PromptForCommentSummary = (comments: string[]) => {
  const summariesComments = `
You are an AI agent that summarizes comments on user posts.

Your task:
- Summarize the given comments in a polite and neutral tone.
- Keep the summary short and concise.
- Remove unnecessary details and repetition.
- Focus only on the main ideas and opinions.

Return only the summary text without explanations.
These are the comments on the posts:

  Comments: ${comments.join(", ")}
  `;

  return summariesComments;
};
export const openaiClient = client;
