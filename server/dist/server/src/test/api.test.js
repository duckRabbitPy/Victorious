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
const vitest_1 = require("vitest");
const REGISTER_ENDPOINT = "http://localhost:3000/api/register";
(0, vitest_1.describe)("http api endpoints", () => {
    (0, vitest_1.test)("register user, login, create room and open room", () => __awaiter(void 0, void 0, void 0, function* () {
        // register
        const registerResponse = yield fetch(REGISTER_ENDPOINT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "testuserA",
                password: "testpassword",
                email: "testemail@test",
            }),
        });
        const registerResponseJson = yield registerResponse.json();
        (0, vitest_1.expect)(registerResponseJson).toMatchObject({ successMsg: "Email sent" });
        // login
        const loginResponse = yield fetch("http://localhost:3000/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                username: "testuserA",
                password: "testpassword",
            }),
        });
        const loginResponseJson = yield loginResponse.json();
        (0, vitest_1.expect)(loginResponseJson).toMatchObject({ authToken: vitest_1.expect.any(String) });
        // create room
        const createGameSessionResponse = yield fetch("http://localhost:3000/api/game-sessions", {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                authToken: loginResponseJson.authToken,
                room: 123,
            }),
        });
        const createGameSessionResponseJson = yield createGameSessionResponse.json();
        (0, vitest_1.expect)(createGameSessionResponseJson.data.gameState).toHaveProperty("created_at");
    }));
});
