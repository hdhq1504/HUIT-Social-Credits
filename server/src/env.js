import 'dotenv/config';

export const env = {
  PORT: process.env.PORT || 8080,
  CORS_ORIGIN: process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"],
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  ACCESS_TOKEN_EXPIRES: process.env.ACCESS_TOKEN_EXPIRES || "15m",
  REFRESH_TOKEN_EXPIRES: process.env.REFRESH_TOKEN_EXPIRES || "7d",
  NODE_ENV: process.env.NODE_ENV || "development",
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT,
  SMTP_SECURE: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === "true" : undefined,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM,
  APP_URL: process.env.APP_URL
};
