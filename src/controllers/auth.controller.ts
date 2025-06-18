import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import { otpStore } from "../utils/otpStore";
import { randomInt } from "crypto";
import { isPasswordStrong, isValidEmail } from "../utils/validators";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../middlewares/auth.middleware";

const prisma = new PrismaClient();
// Configure nodemailer SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true", // use TLS if true (usually port 465)
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

function generateOtp(): string {
  // crypto.randomInt(100000, 1000000) yields a secure 6-digit number [100000–999999]
  const code = randomInt(100000, 1000000);
  return code.toString().padStart(6, "0");
}
const OTP_EXPIRATION_MS = 5 * 60 * 1000;

export const registerUser = async (req: Request, res: Response) => {
  const { email, name, password } = req.body;
  // Basic validation
  if (!email || !name || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  if (!isValidEmail(email)) {
  return res.status(400).json({ message: "Invalid email format" });
}
   if (!isPasswordStrong(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long and include an uppercase letter, lowercase letter, number, and special character.",
    });
  }

  // Check user does not already exist (email or username)
  const existing = await prisma.user.findFirst({
    where: { email },
    select: {
    id:true,
    name : true,
    isVerified: true
    // Add more fields if needed
  },
  });

 // Generate OTP and hash password
  const otpCode = generateOtp();
  const passwordHash = await bcrypt.hash(password, 10); // salt rounds = 10
  const expiresAt = new Date(Date.now() + OTP_EXPIRATION_MS);


  if (existing) {
    if (existing.isVerified) {
      return res.status(400).json({ message: "User already exists" });
    }
    await prisma.user.update({
      where: { email },
      data: {
        name,
        password: passwordHash,
        otp: otpCode,
        expiresAt,
      },
    });
  }else{
    await prisma.user.create({
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
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "Your Registration OTP",
      text: `Your one-time code is: ${otpCode}`,
    });
    res.json({ message: "OTP sent to email"});
  } catch (err) {
    console.error("Error sending OTP email:", err);
    res.status(500).json({ error: "Failed to send OTP" });
  }
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Missing fields" });
  }
  // console.log(otpStore);
  
  const user = await prisma.user.findUnique({
  where: {
    email
  },
   select: {
    expiresAt:true,
    otp: true
    // Add more fields if needed
  },
});
if (!user) {
  return res.status(400).json({ error: "User not found" });
}


  // Verify OTP and expiration
  if (user.expiresAt && user.expiresAt< new Date()) {
    return res.status(400).json({ error: "OTP has expired" });
  }
  if (user.otp !== otp) {
    return res.status(400).json({ error: "Invalid OTP code" });
  }
  // Create the new user in the database
  try {
    await prisma.user.update({
      where: {
    email
  },
      data: {
        isVerified: true 
      },
    });
    res.json({ message: "Registration complete" });
  } catch (err) {
    console.error("Error creating user:", err);
    res.status(500).json({ error: "Registration failed" });
  }
};

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

export const loginUser = async (req: Request, res: Response) => {
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
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
      // IMPORTANT: You MUST select the password field here to compare it
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        isVerified: true // <--- Select the hashed password for comparison!
        // Do NOT select other sensitive fields unless needed for immediate use
      },
    });

    // 3. Check if user exists
    if (!user) {
      // It's good practice to provide a generic error message for security
      // to avoid leaking whether an email exists or not.
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const { password: _, ...userWithoutPassword } = user; 

    if (!user.isVerified) {
      return res.status(400).json({message: " User is not verified to login!! plz verify", user: userWithoutPassword})
    }

    // 4. Compare the provided plain-text password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const accessToken = generateAccessToken(String(user.id));
    const refreshToken = generateRefreshToken(String(user.id));

    // 5. If passwords match, user is authenticated!
    //   Remove the password from the user object before sending it to the client
  // Destructure to exclude password

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
  } catch (error) {
    console.error("Login error:", error);
    return res
      .status(500)
      .json({ message: "An internal server error occurred during login." });
  } 
};
