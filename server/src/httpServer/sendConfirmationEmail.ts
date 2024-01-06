import * as Effect from "@effect/io/Effect";
import nodemailer from "nodemailer";
import { SERVER_API_ENDPOINT } from "../server";

export const sendConfirmationEmail = ({
  email,
  confirmation_token,
}: {
  email: string;
  confirmation_token: string;
}) =>
  Effect.tryPromise({
    try: () => {
      return new Promise((resolve, reject) => {
        const transporter = nodemailer.createTransport({
          service: "gmail",
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: `${process.env.SENDER_EMAIL}`,
            pass: `${process.env.GMAIL_APP_PASSWORD}`,
          },
        });

        const mailOptions = {
          from: process.env.SENDER_EMAIL,
          to: email,
          subject: "Confirm your email",
          text: `Click the link to confirm your email: ${SERVER_API_ENDPOINT}/register/confirm/${confirmation_token}`,
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.log(error);
            reject(error);
          } else {
            console.log("Email sent: " + info.response);
            resolve(info.response);
          }
        });

        transporter.close();
      });
    },
    catch: () => new Error("Error sending confirmation email"),
  });
