import { PrismaClient } from "@prisma/client";


export const prisma = new PrismaClient();


export async function connectDatabase() {
 try {
   await prisma.$connect();
   console.log(`🛢️ [database]: Mysql database is connected ...`);
 } catch (error) {
   await prisma.$disconnect();
   console.log(`⚡️ [database] : Error connecting to the database ...`);
   console.log("Mysql DB connection error :", error);
 }
}



