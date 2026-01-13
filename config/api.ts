const PROD_URL = "https://dietbite-pro-backend-new.onrender.com";
const DEV_URL = "http://192.168.1.199:3000";

export const API_BASE_URL = __DEV__ ? DEV_URL : PROD_URL;
