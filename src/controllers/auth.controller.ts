import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../middlewares/auth.middleware";

const prisma = new PrismaClient();

export const login = (req: Request, res: Response) => {
  res.send("login page is working");
};

export const registerUser = async (req: Request, res: Response) => {
  const { name, email, password } = req.body;
  // console.log("Received registration request:", req.body); // For debugging purposes

  // --- 1. Basic Input Validation ---
  if (!name || !email || !password) {
    return res
      .status(400)
      .json({ message: "Name, email, and password are all required fields." });
  }

  // --- 2. Password Hashing ---
  const saltRounds = 10; // Recommended number of salt rounds for bcrypt
  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, saltRounds);
  } catch (error) {
    console.error("Error hashing password:", error);
    return res
      .status(500)
      .json({ message: "Failed to process password securely." });
  }

  // --- 3. Create User in Database ---
  try {
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // Store the hashed password
        // createdAt and updatedAt are automatically handled by Prisma
      },
      // Select fields to return – important for security (NEVER return the password)
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // --- 4. Send Success Response ---
    return res.status(201).json({
      message: "User registered successfully!",
      user: newUser, // Send back the newly created user's safe data
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "An unexpected error occurred during registration." });
  } finally {
    // Disconnect Prisma Client after the operation
    // For long-running Express apps, you might manage connection pooling differently.
    await prisma.$disconnect();
  }
};

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
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials." });
    }
    const accessToken = generateAccessToken(String(user.id));
    const refreshToken = generateRefreshToken(String(user.id));

    // 5. If passwords match, user is authenticated!
    //    Remove the password from the user object before sending it to the client
    const { password: _, ...userWithoutPassword } = user; // Destructure to exclude password

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
  } finally {
    await prisma.$disconnect();
  }
};



