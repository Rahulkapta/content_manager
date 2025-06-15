import cors from "cors";
import { config } from "dotenv";
import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";

/** Configures environment variables */
config();


const app: Express = express();
app.use(cookieParser());


// Middleware to read json
app.use(express.json());
app.use(cors());

import authRouter from "./routes/auth.routes"

app.use("/api/auth", authRouter)





export default app;



