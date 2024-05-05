import { beforeAll, describe, expect, it } from "vitest";
import { Effect as E } from "effect";
import { resetAndSeedDatabase } from "../db/seed";
import { NEW_API_TEST_USER } from "./helpers";
import { Pool } from "pg";
import { DBConnection, DBConnectionTest } from "../db/connection";

const REGISTER_ENDPOINT = "http://localhost:3000/api/register";

const TEST_ROOM = 123;

describe("http api endpoints", async () => {
  beforeAll(async () => {
    await resetAndSeedDatabase();
  });
  const runTests = DBConnection.pipe(
    E.flatMap((connection) => connection.pool),
    E.flatMap((pool) => runAllTests(pool))
  );
  const runnable = E.provideService(runTests, DBConnection, DBConnectionTest);

  await E.runPromise(runnable);
});

const registerUserTest = (pool: Pool) => {
  it("register user", async () => {
    const registerResponse = await fetch(REGISTER_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: NEW_API_TEST_USER.username,
        password: NEW_API_TEST_USER.password,
        email: NEW_API_TEST_USER.email,
      }),
    });

    const registerResponseJson = await registerResponse.json();

    expect(registerResponseJson).toMatchObject({ successMsg: "Email sent" });
  });

  return E.succeed(E.void);
};

const loginFailsForUnverifiedTest = (pool: Pool) => {
  it("attempt to login user before verification", async () => {
    const loginResponse = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: NEW_API_TEST_USER.username,
        password: NEW_API_TEST_USER.password,
      }),
    });

    const loginResponseJson = await loginResponse.json();

    expect(loginResponseJson).toMatchObject({
      message: "Fail: User not verified",
    });
  });

  return E.succeed(E.void);
};

const verifyUserEmailTest = (pool: Pool) => {
  it("verify user email", async () => {
    const confirmationToken = (
      await pool.query(
        "SELECT confirmation_token FROM users WHERE username = $1",
        [NEW_API_TEST_USER.username]
      )
    ).rows[0].confirmation_token;

    const confirmResponse = await fetch(
      `http://localhost:3000/api/register/confirm/${confirmationToken}`
    );

    expect(confirmResponse.status).toBe(200);

    const verified = (
      await pool.query("SELECT verified FROM users WHERE username = $1", [
        NEW_API_TEST_USER.username,
      ])
    ).rows[0].verified;

    expect(verified).toBe(true);
  });

  return E.succeed(E.void);
};

const loginUserTest = (pool: Pool) => {
  it("login user", async () => {
    const loginResponse = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: NEW_API_TEST_USER.username,
        password: NEW_API_TEST_USER.password,
      }),
    });

    const loginResponseJson = await loginResponse.json();

    expect(loginResponseJson).toMatchObject({
      authToken: expect.any(String),
    });
  });

  return E.succeed(E.void);
};

const createRoomTest = (pool: Pool) => {
  it("create room", async () => {
    const loginResponse = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: NEW_API_TEST_USER.username,
        password: NEW_API_TEST_USER.password,
      }),
    });

    const loginResponseJson = await loginResponse.json();

    const authToken = loginResponseJson.authToken;

    const createGameSessionResponse = await fetch(
      "http://localhost:3000/api/game-sessions",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          room: TEST_ROOM,
        }),
      }
    );

    const createGameSessionResponseJson =
      await createGameSessionResponse.json();

    expect(createGameSessionResponseJson.data?.gameState).toHaveProperty(
      "created_at"
    );
  });

  return E.succeed(E.void);
};

const createRoomAuthProtectedTest = (pool: Pool) => {
  it("attempt create room without being logged in ", async () => {
    const createGameSessionResponse = await fetch(
      "http://localhost:3000/api/game-sessions",
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer a9jd-invalid-token-38af`,
        },
        body: JSON.stringify({
          room: TEST_ROOM,
        }),
      }
    );

    const createGameSessionResponseJson =
      await createGameSessionResponse.json();

    expect(createGameSessionResponseJson).toMatchObject({
      message: "Fail: Invalid or missing token, retry login for fresh token",
    });
  });

  return E.succeed(E.void);
};

const getOpenRoomsAuthProtectedTest = (pool: Pool) => {
  it("attempt to see open rooms without being logged in ", async () => {
    const openGameSessionResponse = await fetch(
      "http://localhost:3000/api/game-sessions",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer a9jd-invalid-token-38af`,
        },
      }
    );
    expect(openGameSessionResponse.status).toBe(401);
  });

  return E.succeed(E.void);
};

const getOpenRooms = (pool: Pool) => {
  it("see open rooms", async () => {
    const loginResponse = await fetch("http://localhost:3000/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: NEW_API_TEST_USER.username,
        password: NEW_API_TEST_USER.password,
      }),
    });

    const loginResponseJson = await loginResponse.json();

    const authToken = loginResponseJson.authToken;
    const openGameSessionResponse = await fetch(
      "http://localhost:3000/api/game-sessions",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          authorization: `Bearer ${authToken}`,
        },
      }
    );
    const openGameSessionResponseJson = await openGameSessionResponse.json();
    expect(openGameSessionResponseJson.data.openRooms).toContain(TEST_ROOM);
  });

  return E.succeed(E.void);
};

function runAllTests(pool: Pool) {
  return E.succeed(pool).pipe(
    E.flatMap(() => registerUserTest(pool)),
    E.flatMap(() => loginFailsForUnverifiedTest(pool)),
    E.flatMap(() => verifyUserEmailTest(pool)),
    E.flatMap(() => loginUserTest(pool)),
    E.flatMap(() => createRoomAuthProtectedTest(pool)),
    E.flatMap(() => getOpenRoomsAuthProtectedTest(pool)),
    E.flatMap(() => createRoomTest(pool)),
    E.flatMap(() => getOpenRooms(pool))
  );
}
