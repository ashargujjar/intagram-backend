import Openai from "openai";
const client = new Openai({
  baseURL: "https://api.deepseek.com",
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
export const promotForImageDescription = (text: string) => {
  const summariseDescription = `You are an AI writing assistant. Your job is to improve the user's text.

Follow these rules strictly:
- Fix all grammar and spelling mistakes
- Make the text clear and precise
- Enhance the tone based on this style: formal or casual according to context of the text
- Do not add extra explanation or commentary
- Only return the improved text, nothing else
- if the text does't make any sense just reply with the sort message small text
Original text:
${text}
`;
  return summariseDescription;
};
export const openaiClient = client;
