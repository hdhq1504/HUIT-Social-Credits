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
import registrationRoutes from "./src/routes/registration.routes.js";
import faceProfileRoutes from "./src/routes/face-profile.routes.js";
import councilRoutes from "./src/routes/council.routes.js";
import teacherRoutes from "./src/routes/teacher.routes.js";
import adminTeacherRoutes from "./src/routes/admin.teacher.routes.js";
import studentRoutes from "./src/routes/student.routes.js";
import teacherHomeroomRoutes from "./src/routes/teacher.homeroom.routes.js";
import { errorHandler } from "./src/middlewares/error.middleware.js";

/**
 * Express application entry point.
 * Configures middlewares, routes, and error handling.
 */
const app = express();

// Security middlewares
app.use(helmet());
app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(cors({
  origin: env.CORS_ORIGIN,
  credentials: true
}));
app.use(rateLimit({ windowMs: 60_000, max: 120 }));

// Health check endpoint
app.get("/api/health", (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// Mount routes
app.use("/api/auth", authRoutes);
app.use("/api/activities", activityRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/academics", academicRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/users", userRoutes);
app.use("/api/system", systemRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/face-profiles", faceProfileRoutes);
app.use("/api/councils", councilRoutes);
app.use("/api/teacher", teacherRoutes);
app.use("/api/teacher/homeroom", teacherHomeroomRoutes);
app.use("/api/admin/teachers", adminTeacherRoutes);
app.use("/api/admin/students", studentRoutes);

// Global error handler
app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  app.listen(env.PORT, () => {
    console.log(`Kết nối CSDL thành công.`);
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

export default app;
