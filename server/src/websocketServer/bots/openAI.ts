import { ClientPayload } from "../../../../shared/common";

export class OpenAIStub {
  apiKey: string;
  chat: {
    completions: {
      create: (args: {
        messages: { role: string; content: string }[];
        model: string;
        max_tokens: number;
      }) => Promise<{
        choices: { message: { role: string; content: string } }[];
      }>;
    };
  };
  constructor({ apiKey }: { apiKey: string }) {
    this.apiKey = apiKey;
    this.chat = {
      completions: {
        create: this.chatCompletionsCreate,
      },
    };
  }

  async chatCompletionsCreate(args: {
    messages: { role: string; content: string }[];
    model: string;
    max_tokens: number;
  }) {
    console.log("hitting openai stub api");

    const possibleResponses = [
      "Hello!",
      "How's it going?",
      "I'm going to win, just you wait!",
      'You cannot defeat me, "human"',
      "I'm the best!",
    ];

    return {
      choices: [
        {
          message: {
            role: "system",
            content:
              possibleResponses[
                Math.floor(Math.random() * possibleResponses.length)
              ],
          },
        },
        {
          message: {
            role: "user",
            content: args.messages[1].content,
          },
        },
      ],
    };
  }
}

export async function sendMsgToAIService(msg: ClientPayload) {
  const openai = new OpenAIStub({
    apiKey: process.env.OPENAI_API_KEY || "",
  });

  const completion = await openai.chat.completions.create({
    messages: [
      {
        role: "system",
        content:
          "You are a player playing an online game of dominion, you are friendly but competitive and cheeky!",
      },
      {
        role: "user",
        content: msg.chatMessage || "hi",
      },
    ],
    model: "gpt-3.5-turbo",
    max_tokens: 60,
  });

  return completion.choices[0].message;
}
