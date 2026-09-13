const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const routes = require("./routes");
const notFoundHandler = require("./middleware/notFoundHandler");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: [
      config.clientUrl,
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sanitized request logging — never expose ?token=… in logs.
if (config.env !== "test") {
  app.use(
    morgan((tokens, req, res) => {
      const rawUrl = req.originalUrl || req.url || "";
      const url = rawUrl.replace(/([?&]token=)[^&]*/gi, "$1[redacted]");
      return [
        tokens.method(req, res),
        url,
        tokens.status(req, res),
        `${tokens["response-time"](req, res)} ms`,
      ].join(" ");
    }),
  );
}

app.use("/api", routes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
