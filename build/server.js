"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unused-expressions */
const app_1 = __importDefault(require("./app"));
const mysql_config_1 = require("./config/mysql.config");
const PORT = process.env.PORT;
app_1.default.listen(PORT, () => {
    (0, mysql_config_1.connectDatabase)();
    console.log(`⚡️[server]: Server is running at ${PORT}...`);
    console.log(`⚡️Backend is running ${PORT}...`);
});
app_1.default.get("/", (req, res) => {
    res.send("working");
});
exports.default = app_1.default;
// Npx primsa db push 
// Npx prisma migrate reset 
// Npx prisma generate 
