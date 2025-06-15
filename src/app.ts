import cors from "cors";
import { config } from "dotenv";
import express, { Express, Request, Response } from "express";
import cookieParser from "cookie-parser";

/** Configures environment variables */
config();


const app: Express = express();
app.use(cookieParser());
app.use(express.urlencoded({extended: true , limit: "16kb"}))
app.use(express.json());
app.use(cors());

import authRouter from "./routes/auth.routes"
import userRouter from "./routes/user.routes"

app.use("/api/auth", authRouter)
app.use("/api", userRouter)





export default app;



