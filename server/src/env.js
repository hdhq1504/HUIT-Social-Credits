import 'dotenv/config'; 

export const env = {
  PORT: process.env.PORT || 8080,
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  NODE_ENV: process.env.NODE_ENV || "development"
};
