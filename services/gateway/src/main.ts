import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import winston from "winston";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

const app = express();

const logger = winston.createLogger({
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "requests.log" }),
  ],
});

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { error: "Max requests per minute reached" },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

const services = {
  users: process.env.USERS_SERVICE_URL,
};

for (const [service, target] of Object.entries(services)) {
  app.use(
    `/api/${service}`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^/api/${service}`]: "",
      },
    }),
  );
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Running API Gateway on port", PORT));
