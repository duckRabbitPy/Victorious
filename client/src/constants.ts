export const API_ENDPOINT =
  import.meta.env.MODE === "production"
    ? "https://victorious.onrender.com/api"
    : "http://localhost:3000/api";

export const WEB_SOCKET_URL =
  import.meta.env.MODE === "production"
    ? "wss://victorious.onrender.com"
    : "ws://localhost:3000";

export const LOCAL_STORAGE_AUTH_KEY = "victorious_auth_token";
export const LOCAL_STORAGE_USERNAME_KEY = "victorious_user_name";

export const Backgrounds = [
  "https://res.cloudinary.com/dkytnwn87/image/upload/v1704665159/dominion/Leonardo_Diffusion_XL_snow_background_plain_featureless_in_cen_1_q2dzmc.jpg",
  "https://res.cloudinary.com/dkytnwn87/image/upload/v1703959203/dominion/background_vc3hhv.jpg",
  "https://res.cloudinary.com/dkytnwn87/image/upload/v1704665159/dominion/Leonardo_Diffusion_XL_sea_background_plain_featureless_in_cent_0_swzj28.jpg",
  "https://res.cloudinary.com/dkytnwn87/image/upload/v1704664946/dominion/Leonardo_Diffusion_XL_woodland_background_plain_featureless_in_1_csht6g.jpg",
  "https://res.cloudinary.com/dkytnwn87/image/upload/v1704665159/dominion/Leonardo_Diffusion_XL_desert_background_plain_featureless_in_c_0_ruocct.jpg",
  "https://res.cloudinary.com/dkytnwn87/image/upload/v1704665159/dominion/Leonardo_Diffusion_XL_mountain_background_plain_featureless_in_1_zdasdm.jpg",
];

console.log(import.meta.env.MODE);
console.log({ API_ENDPOINT });

export const THEME_COLORS = {
  victory: "#1133B1",
  translucentBlack: "rgba(28, 26, 27, 0.66)",
  translucentStraw: "rgba(255, 255, 255, 0.7)",
  lightRed: "red",
  lightGreen: "lightgreen",
  darkRed: "darkred",
};
