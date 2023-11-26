import { expect, describe, beforeEach, test, afterAll } from "vitest";
import dotenv from "dotenv";
import { resetAndSeedDatabase } from "../db/seed";
import { pool } from "../db/connection";

dotenv.config();

const SESSIONS_ENDPOINT = "http://localhost:3000/game-state";
const AUTH_HEADER = {
  "x-api-key": process.env.API_KEY || "",
};

async function checkContentType(response: Response) {
  expect(response.headers.get("content-type")).toEqual(
    "application/json; charset=utf-8"
  );
}

describe("V1 Todo Database Tests", () => {
  beforeEach(async () => {
    await resetAndSeedDatabase();
  });

  afterAll(async () => {
    pool.end();
  });

  describe("CRUD operations", () => {
    test("create new game", async () => {
      const res = await fetch(SESSIONS_ENDPOINT, {
        method: "POST",
        headers: AUTH_HEADER,
      });

      expect(res.status).toEqual(201);
      await checkContentType(res);
      const json = await res.json();
      expect(json).toEqual({
        id: 1,
        state: {
          players: [],
          trash: [],
          turn: 0,
          phase: "Action",
          actions: 1,
          buys: 1,
          coins: 0,
          hand: [],
          deck: [],
          discard: [],
        },
      });
    });
  });
});
