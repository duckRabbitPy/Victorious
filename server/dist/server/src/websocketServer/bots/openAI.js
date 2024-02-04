"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMsgToAIService = exports.OpenAIStub = void 0;
class OpenAIStub {
    constructor({ apiKey }) {
        this.apiKey = apiKey;
        this.chat = {
            completions: {
                create: this.chatCompletionsCreate,
            },
        };
    }
    chatCompletionsCreate(args) {
        return __awaiter(this, void 0, void 0, function* () {
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
                            content: possibleResponses[Math.floor(Math.random() * possibleResponses.length)],
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
        });
    }
}
exports.OpenAIStub = OpenAIStub;
function sendMsgToAIService(msg) {
    return __awaiter(this, void 0, void 0, function* () {
        const openai = new OpenAIStub({
            apiKey: process.env.OPENAI_API_KEY || "",
        });
        const completion = yield openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a player playing an online game of dominion, you are friendly but competitive and cheeky!",
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
    });
}
exports.sendMsgToAIService = sendMsgToAIService;
