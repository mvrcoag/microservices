import "dotenv/config";
import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import morgan from "morgan";
import { logger } from "./loggers";
import { limiter } from "./limiter";

const app = express();

app.use(
  morgan("combined", {
    stream: { write: (message) => logger.info(message.trim()) },
  }),
);

app.use(limiter);

const services = {
  users: process.env.USERS_SERVICE_URL,
  orders: process.env.ORDERS_SERVICE_URL,
};

for (const [service, target] of Object.entries(services)) {
  app.use(
    `/api/${service}`,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      pathRewrite: {
        [`^/api/${service}`]: "/",
      },
    }),
  );
}

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Running API Gateway on port", PORT));
