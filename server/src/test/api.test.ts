import { describe, expect, test } from "vitest";

const REGISTER_ENDPOINT = "http://localhost:3000/api/register";

describe("http api endpoints", () => {
  test("register user, login, create room and open room", async () => {
    // register
    const registerResponse = await fetch(REGISTER_ENDPOINT, {
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

    const registerResponseJson = await registerResponse.json();

    expect(registerResponseJson).toMatchObject({ successMsg: "Email sent" });

    // login
    const loginResponse = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: "testuserA",
        password: "testpassword",
      }),
    });

    const loginResponseJson = await loginResponse.json();

    expect(loginResponseJson).toMatchObject({ authToken: expect.any(String) });

    // create room
    const createGameSessionResponse = await fetch(
      "http://localhost:3000/api/game-sessions",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authToken: loginResponseJson.authToken,
          room: 123,
        }),
      }
    );

    const createGameSessionResponseJson =
      await createGameSessionResponse.json();

    expect(createGameSessionResponseJson.data.gameState).toHaveProperty(
      "created_at"
    );
  });
});
