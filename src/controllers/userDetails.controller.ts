import { NextFunction, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { uploadOnCloudinary } from "../utils/cloudinary";
const prisma = new PrismaClient();

export const updateProfilePicture = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const file = req.file;
  // console.log(file);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const contentfilePath = file?.path;

  if (!contentfilePath) {
    return res.status(400).json({ message: "file is required." });
  }
  const contentFile = await uploadOnCloudinary(String(contentfilePath));
  // console.log("file", contentFile);

  if (!contentFile?.url) {
    return res.status(500).json({ message: "Cloudinary upload failed" });
  }
  try {
    const existingDetails = await prisma.userDetails.findUnique({
      where: { userId },
    });

    if (existingDetails) {
      // Update existing user details
      const updated = await prisma.userDetails.update({
        where: { userId },
        data: {
          profilePicture: contentFile.url,
        },
      });

      return res
        .status(200)
        .json({ message: "Profile picture updated", ProfilePicture: updated });
    } else {
      // Create new user details
      const created = await prisma.userDetails.create({
        data: {
          userId,
          profilePicture: contentFile.url,
        },
      });

      return res
        .status(201)
        .json({ message: "Profile Picture uploaded", ProfilePicture: created });
    }
  } catch (err) {
    console.error("Error saving user details:", err);
    return res.status(500).json({ error: "Failed to save user details" });
  }
};

export const createUserDetails = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  // console.log("called createUserDetails", userId);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  let {
    bio,
    website,
    gender,
    birthDate,
    phone,
    location,
    isPrivate,
    language,
  } = req.body;

  const validGenders = ["MALE", "FEMALE", "OTHER", "NOT_SPECIFIED"];
  if (!validGenders.includes(gender)) {
    gender = undefined; // Don't include if invalid or empty
  }

   const dataToSave: any = {
    bio,
    website,
    birthDate: birthDate ? new Date(birthDate) : undefined,
    phone,
    location,
    isPrivate: Boolean(isPrivate),
    language,
  };
   if (gender) {
    dataToSave.gender = gender;
  }

  try {
    const existingDetails = await prisma.userDetails.findUnique({
      where: { userId },
    });

    if (existingDetails) {
      // Update existing user details
      const updated = await prisma.userDetails.update({
        where: { userId },
        data: dataToSave
      });

      return res
        .status(200)
        .json({ message: "User details updated", userDetails: updated });
    } else {
      // Create new user details
      const created = await prisma.userDetails.create({
        data: {userId, ...dataToSave}
      });

      return res
        .status(201)
        .json({ message: "User details created", userDetails: created });
    }
  } catch (err) {
    console.error("Error saving user details:", err);
    return res.status(500).json({ error: "Failed to save user details" });
  }
};

export const getUserDetails = async (req: Request, res: Response) => {
  const userId = req.user?.id; // or from req.params if passed in URL
  console.log(req.user);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const userDetails = await prisma.userDetails.findUnique({
      where: { userId },
    });

    if (!userDetails) {
      return res.status(200).json({ userDetails: {} });
    }
    // console.log("userdetails", userDetails);

    return res.status(200).json({ userDetails });
  } catch (err) {
    console.error("Error fetching user details:", err);
    // return res.status(500).json({ error: "Failed to fetch user details" });
  }
};
