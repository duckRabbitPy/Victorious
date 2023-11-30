import { NextFunction, Request, Response } from "express";
import { pipe } from "@effect/data/Function";
import { AuthorisationError } from "../controllers/customErrors";
import dotenv from "dotenv";
import * as Effect from "@effect/io/Effect";
import jwt from "jsonwebtoken";
import { safeParseNonEmptyString } from "../utils";

dotenv.config();

export const tokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["Authorization"];
  const secretKey = pipe(
    safeParseNonEmptyString(process.env.JWT_SECRET_KEY),
    Effect.orElseFail(() => Effect.succeed("NOT_CORRECT_KEY")),
    Effect.runSync
  );

  return pipe(
    token,
    safeParseNonEmptyString,
    Effect.flatMap((token) => {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          return Effect.fail(
            new AuthorisationError({ message: "Invalid API key" })
          );
        }
        console.log(decoded);
      });

      return Effect.succeed(next());
    }),
    Effect.matchCauseEffect({
      onFailure: (cause) => {
        if (cause._tag === "Fail") {
          return Effect.succeed(
            res.status(401).json({ message: cause.error._tag })
          );
        }
        return Effect.succeed(
          res.status(500).json({ message: "Internal server error" })
        );
      },
      onSuccess: () => Effect.unit,
    }),
    Effect.runSync
  );
};
