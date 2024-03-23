import { ClientPayload } from "../../../../shared/common";

class OpenAIStub {
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
    const possibleResponses = [
      "Hey! How's it going on your end?",
      "Feeling confident today? I sure am!",
      "Got any tricks up your sleeve? I love a good surprise.",
      "You're doing great! But you never know what could happen.",
      "I might be the underdog, but I've got a few moves in store!",
      "What's your strategy for this game? I'm genuinely curious!",
      "Ready for a friendly match? Let's make it interesting!",
      "Feeling lucky today? I've got a good feeling about this.",
      "This is going to be fun, right? Looking forward to it!",
      "Let's keep it friendly, but I can't promise I won't bring my A-game!",
      "Any secret strategies you want to share? I'm all ears!",
      "I'm ready for a good challenge. What's your game plan?",
      "I'm not just playing to win; I'm playing for the thrill of the game!",
      "Feeling a bit nervous? No worries, we're in this together!",
      "Love a good game. May the best player win!",
      "Get any game-changing cards? I'm always up for a surprise!",
      "It's all in good fun, right? Let's enjoy every moment!",
      "Got any unexpected moves in store? I'm up for the challenge!",
      "Thinking of trying a bold move? Now could be the perfect time!",
      "Let's make this match memorable! What do you think?",
      "Feeling optimistic about this game? I sure am!",
      "Ever tried a strategy that completely changed the game? Share your secrets!",
      "Not just a player – I'm a storyteller in the making!",
      "Who knows what twists and turns this game will bring? Exciting, isn't it?",
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
