export const API_ENDPOINT =
  import.meta.env.MODE === "production"
    ? "https://dominion.onrender.com/api"
    : "http://localhost:3000/api";

export const WEB_SOCKET_URL =
  import.meta.env.MODE === "production"
    ? "wss://dominion.onrender.com"
    : "ws://localhost:3000";

console.log(import.meta.env.MODE);
console.log({ API_ENDPOINT });
