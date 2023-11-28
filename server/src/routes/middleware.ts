// import { NextFunction, Request, Response } from "express";
// import { pipe } from "@effect/data/Function";

// import { AuthorisationError } from "../controllers/customErrors";
// import * as Schema from "@effect/schema/Schema";
// import dotenv from "dotenv";
// import { Effect } from "effect";

// dotenv.config();

// const validateApiKey = (apiKey: string) => {
//   return apiKey === process.env.API_KEY;
// };

// export const safeParseNonEmptyString = Schema.parse(
//   Schema.string.pipe(Schema.minLength(1))
// );

// // Middleware to check API key in headers
// export const apiKeyMiddleware = (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   const apiKey = req.headers["x-api-key"];

//   return pipe(
//     apiKey,
//     safeParseNonEmptyString,
//     Effect.orElseFail(
//       () => new AuthorisationError({ message: "No API key provided" })
//     ),
//     Effect.flatMap((apiKey) => {
//       if (!validateApiKey(apiKey)) {
//         return Effect.fail(
//           new AuthorisationError({ message: "Invalid API key" })
//         );
//       }
//       return Effect.succeed(next());
//     }),
//     Effect.matchCauseEffect({
//       onFailure: (cause) => {
//         if (cause._tag === "Fail") {
//           return Effect.succeed(
//             res.status(401).json({ message: cause.error._tag })
//           );
//         }
//         return Effect.succeed(
//           res.status(500).json({ message: "Internal server error" })
//         );
//       },
//       onSuccess: () => Effect.unit,
//     }),
//     Effect.runSync
//   );
// };
