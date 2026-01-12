// config/api.ts

// Put your Render URL here after deployment
const PROD_URL = "https://dietbite-pro-backend.onrender.com";

// Use LAN only while developing locally
const DEV_URL = "http://192.168.1.199:3000";

export const API_BASE_URL = __DEV__ ? DEV_URL : PROD_URL;
