"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
// const tempDir = path.join(__dirname, "../public/temp");
// // Ensure the directory exists
// if (!fs.existsSync(tempDir)) {
//   fs.mkdirSync(tempDir, { recursive: true });
// }
// Set up disk storage with correct typing
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path_1.default.join(__dirname, "../public/temp")); // Use path.join for cross-platform compatibility
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});
// Configure multer with limits (e.g., max file size)
exports.upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 200 * 1024 * 1024, // 200 MB
    },
});
