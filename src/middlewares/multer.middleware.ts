
import multer, { StorageEngine } from "multer";
import path from "path";
import fs from "fs";
import { Request } from "express";

const tempDir = path.join(__dirname, "../public/temp");

// Ensure the directory exists
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

// Set up disk storage with correct typing
const storage: StorageEngine = multer.diskStorage({
  destination: function (req: Request, file, cb) {
    cb(null, path.join(__dirname, "../public/temp")); // Use path.join for cross-platform compatibility
  },
  filename: function (req: Request, file, cb) {
    cb(null, file.originalname);
  },
});

// Configure multer with limits (e.g., max file size)
export const upload = multer({
  storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200 MB
  },
});