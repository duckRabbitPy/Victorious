"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendConfirmationEmail = void 0;
const effect_1 = require("effect");
const nodemailer_1 = __importDefault(require("nodemailer"));
const server_1 = require("../server");
const sendConfirmationEmail = ({ email, confirmation_token, }) => effect_1.Effect.tryPromise({
    try: () => {
        return new Promise((resolve, reject) => {
            const transporter = nodemailer_1.default.createTransport({
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
                text: `Click the link to confirm your email: ${server_1.SERVER_API_ENDPOINT}/register/confirm/${confirmation_token}`,
            };
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log(error);
                    reject(error);
                }
                else {
                    console.log("Email sent: " + info.response);
                    resolve(info.response);
                }
            });
            transporter.close();
        });
    },
    catch: () => new Error("Error sending confirmation email"),
});
exports.sendConfirmationEmail = sendConfirmationEmail;
