/* eslint-disable @typescript-eslint/no-unused-expressions */
import app from "./app";
import { connectDatabase } from "./config/mysql.config";
import express, { Express, Request, Response } from "express";



const PORT = process.env.PORT;


app.listen(PORT, () => {
 connectDatabase();
 console.log(`⚡️[server]: Server is running at ${PORT}...`);
 console.log(`⚡️Backend is running ${PORT}...`);
});

app.get("/", (req:Request, res:Response)=>{
    res.send("working")

})


export default app;

// Npx primsa db push 
// Npx prisma migrate reset 
// Npx prisma generate 

