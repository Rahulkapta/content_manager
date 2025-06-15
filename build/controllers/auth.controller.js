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
exports.getCurrentUser = exports.loginUser = exports.registerUser = exports.login = void 0;
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const auth_middleware_1 = require("../middlewares/auth.middleware");
const prisma = new client_1.PrismaClient();
const login = (req, res) => {
    res.send("login page is working");
};
exports.login = login;
const registerUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { name, email, password } = req.body;
    console.log("Received registration request:", req.body); // For debugging purposes
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
        hashedPassword = yield bcryptjs_1.default.hash(password, saltRounds);
    }
    catch (error) {
        console.error("Error hashing password:", error);
        return res
            .status(500)
            .json({ message: "Failed to process password securely." });
    }
    // --- 3. Create User in Database ---
    try {
        const newUser = yield prisma.user.create({
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
    }
    catch (error) {
        return res
            .status(500)
            .json({ message: "An unexpected error occurred during registration." });
    }
    finally {
        // Disconnect Prisma Client after the operation
        // For long-running Express apps, you might manage connection pooling differently.
        yield prisma.$disconnect();
    }
});
exports.registerUser = registerUser;
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
            refreshToken
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
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        return res.status(401).json({ message: "Unauthorized: User not logged in." });
    }
    return res.status(200).json({
        message: "User fetched successfully.",
        user: req.user
    });
});
exports.getCurrentUser = getCurrentUser;
// export const refreshAccessToken = async (req: Request, res: Response) => {
//   const refreshToken = req.cookies.refreshToken;
//   if (!refreshToken) {
//     return res.status(401).json({ message: "Refresh token not found." });
//   }
//   try {
//     const payload = jwt.verify(refreshToken, REFRESH_TOKEN_SECRET) as { userId: string };
//     const newAccessToken = generateAccessToken(payload.userId);
//     return res.status(200).json({ accessToken: newAccessToken });
//   } catch (error) {
//     return res.status(403).json({ message: "Invalid refresh token." });
//   }
// };
/*export const registerUser = asyncHandler(async (req:Request, res:Response) => {

  // get user details from frontend
  const { username, email, fullName, password } = req.body;
  // console.log(req.body);

  // if (fullName === "") {
  //     throw new ApiError(400, "fullName is required") //we can check for every entry by using if statement like this
  // }

  //this is way to validate that every entry in req.body is not empty  by using  one if statement
  // validation - not empty
  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  // check if user already exists: username, email
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with userName or email already exists");
  }

  // check for images, check for avatar
 
  const avatarLocalPath = req.files?.avatar[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, " Avatar file is required");
  }

  // upload avatar and coverImage to cloudinary, avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, " Avatar file is required");
  }

  // create user object - create entry in db
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username: username.toLowerCase(),
  });

  // remove password and refresh token field from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

*/
