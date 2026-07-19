import express from "express";
import type { Application, Request, RequestHandler, Response } from "express";
import cors from "cors";
import helmetModule from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import routes from "./routes/index.js";
import errorMiddleware from "./middlewares/error.middleware.js";
import env from "./config/env.js";
import connectDB from "./config/db.js";
import ApiError from "./utils/ApiError.js";

const app: Application = express();
const helmet = helmetModule as unknown as () => RequestHandler;

// ─── Global Middlewares ───────────────────────────────────────────────────────

app.use(helmet());

const corsOptions: cors.CorsOptions = {
  origin: (requestOrigin: string | undefined, callback: (err: Error | null, origin?: boolean) => void) => {
    if (!requestOrigin) return callback(null, true); // allow Postman, curl

    if (requestOrigin === env.clientUrl) {
      callback(null, true);
    } else {
      callback(new ApiError(403, "Origin not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

// ─── Routes ───────────────────────────────────────────────────────────────────

if (env.nodeEnv === "production") {
  app.use(async (_req, _res, next) => {
    try {
      await connectDB();
      next();
    } catch (error) {
      next(error);
    }
  });
}

app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "NovaSchool OS API is running",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

app.use("/api", routes);

// ─── Health Check ─────────────────────────────────────────────────────────────

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "NovaSchool OS API is running",
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────

app.use((req, _res, next) => {
  next(new ApiError(404, `Route ${req.method} ${req.originalUrl} not found`));
});

app.use(errorMiddleware);

export default app;
