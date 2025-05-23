import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());

// routes import

import gigsRouter from "./routes/gigs.route.js";
import clientRouter from "./routes/client.route.js";
import freelancerRouter from "./routes/freelancer.route.js";

app.use("/api/v1/gigs", gigsRouter);
app.use("/api/v1/client", clientRouter);
app.use("/api/v1/freelancer", freelancerRouter);

export { app };
