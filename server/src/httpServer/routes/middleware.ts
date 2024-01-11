import { NextFunction, Request, Response } from "express";
import { pipe, Effect as E } from "effect";
import { AuthorisationError } from "../../customErrors";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
import { safeParseNonEmptyString } from "../../../../shared/common";

dotenv.config();

// not currently used
export const tokenMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.headers["Authorization"];
  const secretKey = pipe(
    safeParseNonEmptyString(process.env.JWT_SECRET_KEY),
    E.orElseFail(() => E.succeed("NOT_CORRECT_KEY")),
    E.runSync
  );

  return pipe(
    token,
    safeParseNonEmptyString,
    E.flatMap((token) => {
      jwt.verify(token, secretKey, (err, decoded) => {
        if (err) {
          return E.fail(
            new AuthorisationError({ message: "Invalid Auth Token" })
          );
        }
      });

      return E.succeed(next());
    }),
    E.matchCauseEffect({
      onFailure: (cause) => {
        if (cause._tag === "Fail") {
          return E.succeed(res.status(401).json({ message: cause.error._tag }));
        }
        return E.succeed(
          res.status(500).json({ message: "Internal server error" })
        );
      },
      onSuccess: () => E.unit,
    }),
    E.runSync
  );
};
