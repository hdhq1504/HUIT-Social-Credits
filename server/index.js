import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { env } from "./src/env.js";
import authRoutes from "./src/routes/auth.routes.js";
import activityRoutes from "./src/routes/activity.routes.js";
import notificationRoutes from "./src/routes/notification.routes.js";
import statsRoutes from "./src/routes/stats.routes.js";
import academicRoutes from "./src/routes/academic.routes.js";
import feedbackRoutes from "./src/routes/feedback.routes.js";
import userRoutes from "./src/routes/user.routes.js";
import systemRoutes from "./src/routes/system.routes.js";
import { errorHandler } from "./src/middlewares/error.middleware.js";

const app = express();

app.use(helmet());
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));
app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/academics", academicRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/users", userRoutes);
app.use("/api/system", systemRoutes);

app.use(errorHandler);

app.listen(env.PORT, () => {
  console.log(`Kết nối CSDL thành công.`);
  console.log(`API listening on http://localhost:${env.PORT}`);
});
