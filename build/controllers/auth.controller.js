"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = exports.verifyOTP = exports.registerUser = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const nodemailer_1 = __importDefault(require("nodemailer"));
const crypto_1 = require("crypto");
const validators_1 = require("../utils/validators");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prisma = new client_1.PrismaClient();
// Configure nodemailer SMTP transporter
const transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === "true", // use TLS if true (usually port 465)
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
function generateOtp() {
    // crypto.randomInt(100000, 1000000) yields a secure 6-digit number [100000–999999]
    const code = (0, crypto_1.randomInt)(100000, 1000000);
    return code.toString().padStart(6, "0");
}
const OTP_EXPIRATION_MS = 5 * 60 * 1000;
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, name, password } = req.body;
    // Basic validation
    if (!email || !name || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }
    if (!(0, validators_1.isValidEmail)(email)) {
        return res.status(400).json({ message: "Invalid email format" });
    }
    if (!(0, validators_1.isPasswordStrong)(password)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character.",
        });
    }
    // Check user does not already exist (email or username)
    const existing = yield prisma.user.findFirst({
        where: { email },
        select: {
            id: true,
            name: true,
            isVerified: true
            // Add more fields if needed
        },
    });
    // Generate OTP and hash password
    const otpCode = generateOtp();
    const passwordHash = yield bcryptjs_1.default.hash(password, 10); // salt rounds = 10
    const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);
    if (existing) {
        if (existing.isVerified) {
            return res.status(400).json({ message: "User already exists" });
        }
        yield prisma.user.update({
            where: { email },
            data: {
                name,
                password: passwordHash,
                otp: otpCode,
                expiresAt,
            },
        });
    }
    else {
        yield prisma.user.create({
            data: {
                email,
                name,
                password: passwordHash,
                otp: otpCode,
                expiresAt: expiresAt
            },
        });
    }
    // Send OTP email
    try {
        yield transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: "Your Registration OTP",
            text: `Your one-time code is: ${otpCode}`,
        });
        res.json({ message: "OTP sent to email" });
    }
    catch (err) {
        console.error("Error sending OTP email:", err);
        res.status(500).json({ error: "Failed to send OTP" });
    }
});
exports.registerUser = registerUser;
const verifyOTP = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, otp } = req.body;
    if (!email || !otp) {
        return res.status(400).json({ error: "Missing fields" });
    }
    // console.log(otpStore);
    const user = yield prisma.user.findUnique({
        where: {
            email
        },
        select: {
            expiresAt: true,
            otp: true
            // Add more fields if needed
        },
    });
    if (!user) {
        return res.status(400).json({ error: "User not found" });
    }
    // Verify OTP and expiration
    if (user.expiresAt && user.expiresAt < new Date()) {
        return res.status(400).json({ error: "OTP has expired" });
    }
    if (user.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP code" });
    }
    // Create the new user in the database
    try {
        yield prisma.user.update({
            where: {
                email
            },
            data: {
                isVerified: true
            },
        });
        res.json({ message: "Registration complete" });
    }
    catch (err) {
        console.error("Error creating user:", err);
        res.status(500).json({ error: "Registration failed" });
    }
});
exports.verifyOTP = verifyOTP;
// export const registerUser = async (req: Request, res: Response) => {
//   const {  name, email, password } = req.body;
//   // console.log("Received registration request:", req.body); // For debugging purposes
//   // --- 1. Basic Input Validation ---
//   if (!name || !email || !password ) {
//     return res
//       .status(400)
//       .json({ message: "fullName, username, email, and password are all required fields." });
//   }
//   // --- 2. Password Hashing ---
//   const saltRounds = 10; // Recommended number of salt rounds for bcrypt
//   let hashedPassword;
//   try {
//     hashedPassword = await bcrypt.hash(password, saltRounds);
//   } catch (error) {
//     console.error("Error hashing password:", error);
//     return res
//       .status(500)
//       .json({ message: "Failed to process password securely." });
//   }
//   // --- 3. Create User in Database ---
//   try {
//     const newUser = await prisma.user.create({
//       data: {
//         name,
//         email,
//         password: hashedPassword, // Store the hashed password
//         // createdAt and updatedAt are automatically handled by Prisma
//       },
//       // Select fields to return – important for security (NEVER return the password)
//       select: {
//         id: true,
//         name: true,
//         email: true,
//         createdAt: true,
//       },
//     });
//     // --- 4. Send Success Response ---
//     return res.status(201).json({
//       message: "User registered successfully!",
//       user: newUser, // Send back the newly created user's safe data
//     });
//   } catch (error) {
//     return res
//       .status(500)
//       .json({ message: "An unexpected error occurred during registration." });
//   }
// };
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
    // req body -> data
    const { email, password } = req.body;
    // console.log(email);
    if (!email || !password) {
        return res
            .status(400)
            .json({ message: "email and password are all required fields." });
    }
    // Here is an alternative of above code based on logic discussed in video:
    // if (!(username || email)) {
    //     throw new ApiError(400, "username or email is required")
    // }
    //find the user
    try {
        // 2. Find the user by their unique email
        const user = yield prisma.user.findUnique({
            where: {
                email: email,
            },
            // IMPORTANT: You MUST select the password field here to compare it
            select: {
                id: true,
                name: true,
                email: true,
                password: true, // <--- Select the hashed password for comparison!
                // Do NOT select other sensitive fields unless needed for immediate use
            },
        });
        // 3. Check if user exists
        if (!user) {
            // It's good practice to provide a generic error message for security
            // to avoid leaking whether an email exists or not.
            return res.status(401).json({ message: "Invalid credentials." });
        }
        // 4. Compare the provided plain-text password with the stored hashed password
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid credentials." });
        }
        const accessToken = (0, auth_middleware_1.generateAccessToken)(String(user.id));
        const refreshToken = (0, auth_middleware_1.generateRefreshToken)(String(user.id));
        // 5. If passwords match, user is authenticated!
        //    Remove the password from the user object before sending it to the client
        const { password: _ } = user, userWithoutPassword = __rest(user, ["password"]); // Destructure to exclude password
        const options = {
            httpOnly: true,
            secure: true,
        };
        return res
            .status(200)
            .cookie("accessToken", accessToken, options)
            .cookie("refreshToken", refreshToken, options)
            .json({
            message: "Login successful!",
            user: userWithoutPassword,
            accessToken,
            refreshToken,
            // You would typically generate and send a JWT token here
            // token: generateAuthToken(user.id)
        });
    }
    catch (error) {
        console.error("Login error:", error);
        return res
            .status(500)
            .json({ message: "An internal server error occurred during login." });
    }
    finally {
        yield prisma.$disconnect();
    }
});
exports.loginUser = loginUser;
